import { useCallback, useEffect, useRef, useState } from "react";
import { Gamepad2, KeyRound, Pause, Play, RotateCcw, Trophy, Volume2, VolumeX } from "lucide-react";
import PageHeader from "@/components/PageHeader";

type GameState = "idle" | "running" | "paused" | "over";
type ObstacleType = "suitcase" | "cart" | "key";
type Obstacle = { id: number; type: ObstacleType; x: number; y: number; width: number; height: number; collected?: boolean };
type GameWorld = { lastTime: number; lastUiUpdate: number; distance: number; speed: number; playerY: number; velocityY: number; grounded: boolean; spawnIn: number; objects: Obstacle[]; keys: number; nextId: number };

const BRANDS = [
  { ar: "بودل", en: "BOUDL", color: "#08705a", accent: "#d9b66f" },
  { ar: "بريرا", en: "BRAIRA", color: "#684476", accent: "#d7c3dc" },
  { ar: "نارسيس", en: "NARCISSUS", color: "#20201f", accent: "#c8aa61" },
  { ar: "عابر", en: "ABER", color: "#b93649", accent: "#f0c9cf" },
];

const makeWorld = (): GameWorld => ({ lastTime: 0, lastUiUpdate: 0, distance: 0, speed: 285, playerY: 0, velocityY: 0, grounded: true, spawnIn: 900, objects: [], keys: 0, nextId: 1 });

const BoudlRunner = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const worldRef = useRef<GameWorld>(makeWorld());
  const stateRef = useRef<GameState>("idle");
  const audioRef = useRef<AudioContext | null>(null);
  const soundRef = useRef(true);
  const [state, setState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [keys, setKeys] = useState(0);
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem("bhg_runner_high_score") || 0));
  const [sound, setSound] = useState(true);

  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { soundRef.current = sound; }, [sound]);

  const tone = useCallback((frequency: number, duration = 0.12) => {
    if (!soundRef.current) return;
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const context = audioRef.current || new AudioContextClass();
      audioRef.current = context;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.055, context.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + duration + 0.02);
    } catch {
      // Audio is optional.
    }
  }, []);

  const endGame = useCallback(() => {
    const finalScore = Math.floor(worldRef.current.distance / 10) + worldRef.current.keys * 10;
    setScore(finalScore);
    setKeys(worldRef.current.keys);
    setState("over");
    stateRef.current = "over";
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem("bhg_runner_high_score", String(finalScore));
    }
    tone(170, 0.28);
    if (navigator.vibrate) navigator.vibrate([35, 45, 35]);
  }, [highScore, tone]);

  const jump = useCallback(() => {
    const world = worldRef.current;
    if (stateRef.current !== "running" || !world.grounded) return;
    world.velocityY = -720;
    world.grounded = false;
    tone(390, 0.08);
    if (navigator.vibrate) navigator.vibrate(7);
  }, [tone]);

  const startGame = useCallback(() => {
    worldRef.current = makeWorld();
    setScore(0);
    setKeys(0);
    setState("running");
    stateRef.current = "running";
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (["Space", "ArrowUp"].includes(event.code)) {
        event.preventDefault();
        if (stateRef.current === "idle" || stateRef.current === "over") startGame();
        else jump();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump, startGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const roundedRect = (x: number, y: number, width: number, height: number, radius: number) => {
      context.beginPath();
      context.roundRect(x, y, width, height, radius);
    };

    const drawHotel = (x: number, ground: number, index: number) => {
      const normalizedIndex = ((index % BRANDS.length) + BRANDS.length) % BRANDS.length;
      const brand = BRANDS[normalizedIndex];
      const height = 176 + (((index % 3) + 3) % 3) * 24;
      const buildingWidth = 220;
      const buildingY = ground - height;
      context.fillStyle = "rgba(255,255,255,.82)";
      context.strokeStyle = "rgba(60,60,67,.10)";
      context.lineWidth = 1;
      roundedRect(x, buildingY, buildingWidth, height, 14);
      context.fill();
      context.stroke();
      context.fillStyle = brand.color;
      roundedRect(x + 22, buildingY + 18, buildingWidth - 44, 42, 9);
      context.fill();
      context.fillStyle = "#fff";
      context.textAlign = "center";
      context.font = "700 14px system-ui";
      context.fillText(`${brand.ar}  ·  ${brand.en}`, x + buildingWidth / 2, buildingY + 44);
      for (let row = 0; row < 3; row += 1) for (let column = 0; column < 4; column += 1) {
        const wx = x + 24 + column * 47;
        const wy = buildingY + 78 + row * 35;
        context.fillStyle = (row + column + index) % 3 === 0 ? brand.accent : "#dce6e6";
        roundedRect(wx, wy, 28, 20, 4);
        context.fill();
      }
      context.fillStyle = brand.color;
      roundedRect(x + buildingWidth / 2 - 18, ground - 43, 36, 43, 7);
      context.fill();
      context.fillStyle = "rgba(255,255,255,.9)";
      context.fillRect(x + buildingWidth / 2 - 1, ground - 40, 2, 38);
    };

    const drawPlayer = (ground: number, time: number, width: number) => {
      const world = worldRef.current;
      const x = Math.max(64, Math.min(104, width * 0.18));
      const y = ground - 64 - world.playerY;
      const run = stateRef.current === "running" && world.grounded ? Math.sin(time / 80) * 7 : 0;
      context.save();
      context.translate(x, y);
      context.strokeStyle = "#173c34";
      context.lineWidth = 7;
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(0, 38); context.lineTo(-9 + run, 59);
      context.moveTo(0, 38); context.lineTo(10 - run, 59);
      context.stroke();
      context.fillStyle = "#08705a";
      roundedRect(-16, 11, 32, 35, 10); context.fill();
      context.strokeStyle = "#d8b268"; context.lineWidth = 4;
      context.beginPath(); context.moveTo(-12, 20); context.lineTo(13, 35); context.stroke();
      context.strokeStyle = "#173c34"; context.lineWidth = 6;
      context.beginPath();
      context.moveTo(-12, 22); context.lineTo(-23 - run / 2, 35);
      context.moveTo(12, 22); context.lineTo(23 + run / 2, 31); context.stroke();
      context.fillStyle = "#d8aa85";
      context.beginPath(); context.arc(0, 0, 13, 0, Math.PI * 2); context.fill();
      context.fillStyle = "#173c34";
      context.beginPath(); context.arc(0, -4, 13, Math.PI, Math.PI * 2); context.fill();
      context.restore();
      return { x: x - 18, y, width: 36, height: 62 };
    };

    const drawObject = (object: Obstacle, ground: number) => {
      const y = ground - object.height - object.y;
      if (object.type === "key") {
        context.save(); context.translate(object.x + object.width / 2, y + object.height / 2); context.rotate(performance.now() / 700);
        context.strokeStyle = "#b78925"; context.lineWidth = 5; context.beginPath();
        context.arc(-5, 0, 8, 0, Math.PI * 2); context.moveTo(3, 0); context.lineTo(18, 0); context.lineTo(18, 7); context.moveTo(12, 0); context.lineTo(12, 6); context.stroke(); context.restore();
      } else if (object.type === "cart") {
        context.strokeStyle = "#55635f"; context.lineWidth = 4; context.beginPath();
        context.arc(object.x + 10, y + object.height - 4, 6, 0, Math.PI * 2); context.arc(object.x + object.width - 10, y + object.height - 4, 6, 0, Math.PI * 2); context.stroke();
        context.fillStyle = "#c5a35a"; roundedRect(object.x + 4, y + 10, object.width - 8, object.height - 20, 6); context.fill();
        context.strokeStyle = "#55635f"; context.beginPath(); context.moveTo(object.x + 6, y + 12); context.lineTo(object.x + 6, y); context.lineTo(object.x + object.width - 2, y); context.stroke();
      } else {
        context.fillStyle = "#7f5945"; roundedRect(object.x, y + 6, object.width, object.height - 6, 7); context.fill();
        context.strokeStyle = "#4d372d"; context.lineWidth = 3; context.beginPath(); context.arc(object.x + object.width / 2, y + 7, 9, Math.PI, Math.PI * 2); context.stroke();
      }
      return { x: object.x, y, width: object.width, height: object.height };
    };

    const collides = (a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }, padding = 8) =>
      a.x + padding < b.x + b.width && a.x + a.width - padding > b.x && a.y + padding < b.y + b.height && a.y + a.height - padding > b.y;

    const draw = (time: number) => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const ground = height - 62;
      const world = worldRef.current;
      const delta = Math.min(32, world.lastTime ? time - world.lastTime : 16);
      world.lastTime = time;

      if (stateRef.current === "running") {
        const seconds = delta / 1000;
        world.distance += world.speed * seconds;
        world.speed = Math.min(520, 285 + world.distance / 38);
        if (!world.grounded) {
          world.velocityY += 1900 * seconds;
          world.playerY -= world.velocityY * seconds;
          if (world.playerY <= 0) { world.playerY = 0; world.velocityY = 0; world.grounded = true; }
        }
        world.spawnIn -= delta;
        if (world.spawnIn <= 0) {
          const key = Math.random() < 0.34;
          const cart = !key && Math.random() < 0.38;
          world.objects.push(key
            ? { id: world.nextId++, type: "key", x: width + 50, y: 75 + Math.random() * 65, width: 38, height: 38 }
            : { id: world.nextId++, type: cart ? "cart" : "suitcase", x: width + 50, y: 0, width: cart ? 58 : 42, height: cart ? 50 : 43 });
          world.spawnIn = Math.max(720, 1450 - world.speed * 1.15) + Math.random() * 480;
        }
        world.objects.forEach((object) => { object.x -= world.speed * seconds; });
        world.objects = world.objects.filter((object) => object.x > -100 && !object.collected);
      }

      const sky = context.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, "#dff4f2"); sky.addColorStop(.58, "#f5f1e8"); sky.addColorStop(1, "#efe8dc");
      context.fillStyle = sky; context.fillRect(0, 0, width, height);
      context.fillStyle = "rgba(255,255,255,.72)"; context.beginPath(); context.arc(width - 68, 65, 34, 0, Math.PI * 2); context.fill();

      const hotelSpacing = 285;
      const parallax = (world.distance * .32) % hotelSpacing;
      const startIndex = Math.floor((world.distance * .32) / hotelSpacing);
      for (let index = -1; index < Math.ceil(width / hotelSpacing) + 2; index += 1) drawHotel(index * hotelSpacing - parallax, ground - 10, startIndex + index);

      context.fillStyle = "#d7c8ae"; context.fillRect(0, ground, width, height - ground);
      context.fillStyle = "#b6a587"; context.fillRect(0, ground, width, 4);
      context.strokeStyle = "rgba(255,255,255,.85)"; context.lineWidth = 3; context.setLineDash([28, 22]); context.beginPath();
      context.moveTo(-(world.distance % 50), ground + 33); context.lineTo(width + 50, ground + 33); context.stroke(); context.setLineDash([]);

      const playerBox = drawPlayer(ground, time, width);
      for (const object of world.objects) {
        const objectBox = drawObject(object, ground);
        if (stateRef.current === "running" && collides(playerBox, objectBox, object.type === "key" ? 2 : 9)) {
          if (object.type === "key") {
            object.collected = true; world.keys += 1; setKeys(world.keys); tone(690, 0.11); if (navigator.vibrate) navigator.vibrate(5);
          } else endGame();
        }
      }
      if (stateRef.current === "running" && time - world.lastUiUpdate >= 120) {
        world.lastUiUpdate = time;
        setScore(Math.floor(world.distance / 10) + world.keys * 10);
      }
      frameRef.current = requestAnimationFrame(draw);
    };
    frameRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frameRef.current); observer.disconnect(); };
  }, [endGame, tone]);

  const togglePause = () => {
    if (state === "running") setState("paused");
    else if (state === "paused") { worldRef.current.lastTime = performance.now(); setState("running"); }
  };

  const handleCanvasPress = () => {
    if (state === "idle" || state === "over") startGame();
    else jump();
  };

  return (
    <div className="page-wrap-narrow runner-page">
      <PageHeader title="BHG Runner" subtitle="اركض بين فنادق المجموعة واجمع مفاتيح الضيافة." icon={Gamepad2} />
      <section className="runner-shell">
        <div className="runner-hud">
          <div><span>النقاط</span><strong>{score.toLocaleString("ar-SA")}</strong></div>
          <div><span>المفاتيح</span><strong><KeyRound className="h-4 w-4" /> {keys.toLocaleString("ar-SA")}</strong></div>
          <div><span>الأفضل</span><strong><Trophy className="h-4 w-4" /> {highScore.toLocaleString("ar-SA")}</strong></div>
          <button onClick={() => setSound((value) => !value)} aria-label={sound ? "إيقاف الصوت" : "تشغيل الصوت"}>{sound ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}</button>
        </div>
        <div className="runner-stage">
          <canvas ref={canvasRef} onPointerDown={handleCanvasPress} aria-label="لعبة ركض بين فنادق مجموعة بودل" />
          {state === "idle" ? <div className="runner-overlay"><span className="runner-overlay__icon"><Gamepad2 className="h-8 w-8" /></span><h2>جاهز للجولة؟</h2><p>المس الشاشة للقفز فوق الحقائب وعربات الخدمة، واجمع المفاتيح أثناء مرورك بين بودل وبريرا ونارسيس وعابر.</p><button onClick={startGame}><Play className="h-5 w-5 fill-current" /> ابدأ اللعب</button></div> : null}
          {state === "paused" ? <div className="runner-overlay"><Pause className="h-8 w-8" /><h2>اللعبة متوقفة</h2><button onClick={togglePause}><Play className="h-5 w-5 fill-current" /> متابعة</button></div> : null}
          {state === "over" ? <div className="runner-overlay runner-overlay--over"><span className="runner-overlay__score">{score.toLocaleString("ar-SA")}</span><h2>جولة جميلة!</h2><p>جمعت {keys.toLocaleString("ar-SA")} من مفاتيح الضيافة. خذ نفسًا وجرّب كسر رقمك.</p><button onClick={startGame}><RotateCcw className="h-5 w-5" /> جولة جديدة</button></div> : null}
        </div>
        <div className="runner-controls">
          <button onClick={state === "idle" || state === "over" ? startGame : jump}><span>↑</span><strong>{state === "idle" || state === "over" ? "ابدأ" : "قفز"}</strong></button>
          {state === "running" || state === "paused" ? <button onClick={togglePause}>{state === "running" ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}<strong>{state === "running" ? "إيقاف" : "متابعة"}</strong></button> : null}
          <p>يمكنك أيضًا لمس مضمار اللعبة أو الضغط على المسافة.</p>
        </div>
      </section>
      <div className="runner-brand-strip" aria-label="علامات مجموعة بودل للضيافة">{BRANDS.map((brand) => <span key={brand.en} style={{ borderColor: `${brand.color}22`, color: brand.color }}>{brand.ar}<small>{brand.en}</small></span>)}</div>
      <p className="text-center text-[11px] leading-5 text-muted-foreground">استراحة ترفيهية قصيرة للموظفين. الرسوم أصلية ومخصصة للموقع.</p>
    </div>
  );
};

export default BoudlRunner;
