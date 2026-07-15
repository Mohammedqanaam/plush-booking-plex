import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Pause,
  PhoneCall,
  Play,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";

type GameState = "idle" | "running" | "paused" | "over";
type Lane = -1 | 0 | 1;
type TrackObjectType = "booking" | "call" | "cart";
type TrackObject = {
  id: number;
  type: TrackObjectType;
  lane: Lane;
  depth: number;
  handled?: boolean;
};

type GameWorld = {
  lastTime: number;
  lastUiUpdate: number;
  distance: number;
  speed: number;
  lane: number;
  targetLane: Lane;
  jumpY: number;
  jumpVelocity: number;
  grounded: boolean;
  spawnIn: number;
  objects: TrackObject[];
  bookings: number;
  calls: number;
  lead: number;
  nextId: number;
  invulnerableUntil: number;
};

const BRANDS = [
  { ar: "بودل", en: "BOUDL", color: "#08705a", accent: "#d9b66f" },
  { ar: "بريرا", en: "BRAIRA", color: "#684476", accent: "#d7c3dc" },
  { ar: "نارسيس", en: "NARCISSUS", color: "#20201f", accent: "#c8aa61" },
  { ar: "عابر", en: "ABER", color: "#b93649", accent: "#f0c9cf" },
];

const HOTEL_SCENES = [
  {
    ar: "نارسيس الرياض",
    en: "Narcissus The Royal",
    color: "#c8aa61",
    photo: "/images/narcissus-riyadh.png",
  },
  {
    ar: "بريرا النخيل",
    en: "Braira Al Nakhil",
    color: "#684476",
    photo: "https://s3.boudl.work/hotels/optimized-medium/01K8ZMRJWCQW768ACB655T939V.webp",
  },
  {
    ar: "عابر المونسية",
    en: "Aber Al Munsiyah",
    color: "#b93649",
    photo: "https://s3.boudl.work/hotels/optimized-medium/01K6WP1VB8X6Y2ACX3WRERG8FC.webp",
  },
  {
    ar: "بودل السليمانية",
    en: "Boudl Al Sulimaniyah",
    color: "#08705a",
    photo: "https://s3.boudl.work/hotels/optimized-medium/01KDDYE8EZVGAP5MJR9K0QVD5N.webp",
  },
] as const;

const makeWorld = (): GameWorld => ({
  lastTime: 0,
  lastUiUpdate: 0,
  distance: 0,
  speed: 0.23,
  lane: 0,
  targetLane: 0,
  jumpY: 0,
  jumpVelocity: 0,
  grounded: true,
  spawnIn: 650,
  objects: [],
  bookings: 0,
  calls: 0,
  lead: 72,
  nextId: 1,
  invulnerableUntil: 0,
});

const laneValue = (value: number): Lane => Math.max(-1, Math.min(1, value)) as Lane;

const BoudlRunner = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const worldRef = useRef<GameWorld>(makeWorld());
  const stateRef = useRef<GameState>("idle");
  const audioRef = useRef<AudioContext | null>(null);
  const soundRef = useRef(true);
  const [state, setState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [bookings, setBookings] = useState(0);
  const [calls, setCalls] = useState(0);
  const [lead, setLead] = useState(72);
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
      // Sound is optional and never blocks the game.
    }
  }, []);

  const calculateScore = useCallback(() => {
    const world = worldRef.current;
    return Math.floor(world.distance * 2) + world.bookings * 25;
  }, []);

  const endGame = useCallback(() => {
    if (stateRef.current === "over") return;
    const finalScore = calculateScore();
    setScore(finalScore);
    setBookings(worldRef.current.bookings);
    setCalls(worldRef.current.calls);
    setLead(0);
    setState("over");
    stateRef.current = "over";
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem("bhg_runner_high_score", String(finalScore));
    }
    tone(165, 0.3);
    if (navigator.vibrate) navigator.vibrate([35, 45, 35]);
  }, [calculateScore, highScore, tone]);

  const jump = useCallback(() => {
    const world = worldRef.current;
    if (stateRef.current !== "running" || !world.grounded) return;
    world.jumpVelocity = 530;
    world.grounded = false;
    tone(410, 0.08);
    if (navigator.vibrate) navigator.vibrate(7);
  }, [tone]);

  const moveLane = useCallback((direction: -1 | 1) => {
    if (stateRef.current !== "running") return;
    const world = worldRef.current;
    const nextLane = laneValue(world.targetLane + direction);
    if (nextLane === world.targetLane) return;
    world.targetLane = nextLane;
    tone(300, 0.045);
    if (navigator.vibrate) navigator.vibrate(4);
  }, [tone]);

  const startGame = useCallback(() => {
    worldRef.current = makeWorld();
    setScore(0);
    setBookings(0);
    setCalls(0);
    setLead(72);
    setState("running");
    stateRef.current = "running";
  }, []);

  const togglePause = useCallback(() => {
    if (stateRef.current === "running") {
      setState("paused");
      stateRef.current = "paused";
    } else if (stateRef.current === "paused") {
      worldRef.current.lastTime = performance.now();
      setState("running");
      stateRef.current = "running";
    }
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code === "ArrowLeft") {
        event.preventDefault();
        moveLane(-1);
      } else if (event.code === "ArrowRight") {
        event.preventDefault();
        moveLane(1);
      } else if (["Space", "ArrowUp"].includes(event.code)) {
        event.preventDefault();
        if (stateRef.current === "idle" || stateRef.current === "over") startGame();
        else jump();
      } else if (event.code === "KeyP") {
        togglePause();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump, moveLane, startGame, togglePause]);

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
    const hotelImages = HOTEL_SCENES.map((hotel) => {
      const image = new Image();
      image.decoding = "async";
      image.src = hotel.photo;
      return image;
    });

    const roundedRect = (x: number, y: number, width: number, height: number, radius: number) => {
      context.beginPath();
      context.roundRect(x, y, width, height, radius);
    };

    const project = (depth: number, lane: number, width: number, height: number) => {
      const horizon = height * 0.265;
      const normalized = Math.max(0, Math.min(1.08, depth));
      const perspective = Math.pow(normalized, 1.55);
      const roadHalfWidth = 35 + perspective * (width * 0.48 - 35);
      return {
        x: width / 2 + lane * roadHalfWidth * 0.56,
        y: horizon + perspective * (height + 16 - horizon),
        scale: 0.22 + perspective * 1.03,
        perspective,
        roadHalfWidth,
      };
    };

    const drawPhotoCover = (image: HTMLImageElement, x: number, y: number, width: number, height: number) => {
      if (!image.complete || !image.naturalWidth) return false;
      const sourceRatio = image.naturalWidth / image.naturalHeight;
      const targetRatio = width / height;
      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = image.naturalWidth;
      let sourceHeight = image.naturalHeight;
      if (sourceRatio > targetRatio) {
        sourceWidth = image.naturalHeight * targetRatio;
        sourceX = (image.naturalWidth - sourceWidth) / 2;
      } else {
        sourceHeight = image.naturalWidth / targetRatio;
        sourceY = (image.naturalHeight - sourceHeight) / 2;
      }
      context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
      return true;
    };

    const drawHotel = (side: -1 | 1, depth: number, hotelIndex: number, width: number, height: number) => {
      const normalizedIndex = ((hotelIndex % HOTEL_SCENES.length) + HOTEL_SCENES.length) % HOTEL_SCENES.length;
      const hotel = HOTEL_SCENES[normalizedIndex];
      const image = hotelImages[normalizedIndex];
      const point = project(depth, side * 1.42, width, height);
      const buildingWidth = 138 * point.scale;
      const buildingHeight = 116 * point.scale;
      const x = point.x - buildingWidth / 2;
      const y = point.y - buildingHeight;

      context.save();
      context.globalAlpha = Math.min(1, 0.48 + point.perspective * 1.35);
      context.shadowColor = "rgba(0,0,0,.35)";
      context.shadowBlur = 16 * point.scale;
      context.fillStyle = "#142624";
      context.strokeStyle = `${hotel.color}cc`;
      context.lineWidth = Math.max(1, point.scale);
      roundedRect(x, y, buildingWidth, buildingHeight, 8 * point.scale);
      context.fill();
      context.stroke();
      context.shadowBlur = 0;
      context.save();
      roundedRect(x + 2, y + 2, buildingWidth - 4, buildingHeight - 4, 7 * point.scale);
      context.clip();
      const hasPhoto = drawPhotoCover(image, x + 2, y + 2, buildingWidth - 4, buildingHeight - 4);
      if (!hasPhoto) {
        const fallback = context.createLinearGradient(x, y, x, y + buildingHeight);
        fallback.addColorStop(0, hotel.color);
        fallback.addColorStop(1, "#132825");
        context.fillStyle = fallback;
        context.fillRect(x, y, buildingWidth, buildingHeight);
      }
      const shade = context.createLinearGradient(0, y, 0, y + buildingHeight);
      shade.addColorStop(0, "rgba(3,12,18,.04)");
      shade.addColorStop(0.55, "rgba(3,12,18,.12)");
      shade.addColorStop(1, "rgba(3,12,18,.88)");
      context.fillStyle = shade;
      context.fillRect(x, y, buildingWidth, buildingHeight);
      context.restore();

      if (point.scale > 0.34) {
        context.fillStyle = "#fff";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = `800 ${Math.max(7, 10 * point.scale)}px system-ui`;
        context.fillText(hotel.ar, point.x, y + buildingHeight - 18 * point.scale);
        context.fillStyle = "rgba(255,255,255,.7)";
        context.font = `700 ${Math.max(5, 6.5 * point.scale)}px system-ui`;
        context.fillText(hotel.en, point.x, y + buildingHeight - 8 * point.scale);
      }
      context.restore();
    };

    const drawRunner = (
      x: number,
      baseline: number,
      scale: number,
      time: number,
      shirt: string,
      label?: string,
      isJumping = false,
    ) => {
      const run = stateRef.current === "running" && !isJumping ? Math.sin(time / 72) : 0;
      context.save();
      context.translate(x, baseline);
      context.scale(scale, scale);
      context.lineCap = "round";

      context.strokeStyle = "#173c34";
      context.lineWidth = 7;
      context.beginPath();
      context.moveTo(-7, -30); context.lineTo(-13 - run * 7, -4);
      context.moveTo(7, -30); context.lineTo(14 + run * 7, -4);
      context.stroke();

      context.strokeStyle = "#173c34";
      context.lineWidth = 6;
      context.beginPath();
      context.moveTo(-14, -55); context.lineTo(-23 + run * 5, -33);
      context.moveTo(14, -55); context.lineTo(23 - run * 5, -35);
      context.stroke();

      context.fillStyle = shirt;
      roundedRect(-17, -68, 34, 42, 10);
      context.fill();
      context.strokeStyle = "#d9b66f";
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(-12, -61); context.lineTo(13, -39);
      context.stroke();

      context.fillStyle = "#d7a47e";
      context.beginPath();
      context.arc(0, -82, 14, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#173c34";
      context.beginPath();
      context.arc(0, -86, 14, Math.PI, Math.PI * 2);
      context.fill();

      if (label) {
        context.fillStyle = "rgba(24,35,33,.86)";
        roundedRect(-25, -116, 50, 22, 8);
        context.fill();
        context.fillStyle = "#fff";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = "700 11px system-ui";
        context.fillText(label, 0, -105);
      }
      context.restore();
    };

    const drawTrackObject = (object: TrackObject, width: number, height: number) => {
      const point = project(object.depth, object.lane, width, height);
      const scale = point.scale;
      context.save();
      context.translate(point.x, point.y);
      context.scale(scale, scale);

      if (object.type === "booking") {
        context.shadowColor = "rgba(8,112,90,.22)";
        context.shadowBlur = 12;
        context.fillStyle = "#fff";
        context.strokeStyle = "rgba(8,112,90,.32)";
        context.lineWidth = 2;
        roundedRect(-30, -50, 60, 45, 9);
        context.fill();
        context.stroke();
        context.shadowBlur = 0;
        context.fillStyle = "#08705a";
        roundedRect(-30, -50, 60, 14, 8);
        context.fill();
        context.fillStyle = "#173c34";
        context.textAlign = "center";
        context.font = "800 11px system-ui";
        context.fillText("حجز", 0, -21);
        context.fillStyle = "#b78925";
        context.font = "700 7px system-ui";
        context.fillText(`RSV ${String(object.id).padStart(3, "0")}`, 0, -10);
      } else if (object.type === "call") {
        context.shadowColor = "rgba(185,54,73,.24)";
        context.shadowBlur = 10;
        context.fillStyle = "#fff4f5";
        context.strokeStyle = "#b93649";
        context.lineWidth = 2;
        roundedRect(-27, -51, 54, 48, 14);
        context.fill();
        context.stroke();
        context.shadowBlur = 0;
        context.fillStyle = "#b93649";
        context.textAlign = "center";
        context.font = "700 22px system-ui";
        context.fillText("☎", 0, -25);
        context.font = "800 8px system-ui";
        context.fillText("مكالمة", 0, -10);
      } else {
        context.strokeStyle = "#4f605c";
        context.lineWidth = 4;
        context.beginPath();
        context.arc(-18, -7, 6, 0, Math.PI * 2);
        context.arc(18, -7, 6, 0, Math.PI * 2);
        context.stroke();
        context.fillStyle = "#c5a35a";
        roundedRect(-30, -42, 60, 30, 6);
        context.fill();
        context.strokeStyle = "#4f605c";
        context.beginPath();
        context.moveTo(-25, -42); context.lineTo(-25, -54); context.lineTo(29, -54);
        context.stroke();
      }
      context.restore();
    };

    const drawRoad = (width: number, height: number, world: GameWorld) => {
      const horizon = height * 0.265;
      const center = width / 2;
      const activeHotelIndex = Math.floor(world.distance / 120) % HOTEL_SCENES.length;
      const activeHotel = HOTEL_SCENES[activeHotelIndex];
      const activeImage = hotelImages[activeHotelIndex];
      const hasBackground = drawPhotoCover(activeImage, 0, 0, width, height);

      if (!hasBackground) {
        const sky = context.createLinearGradient(0, 0, 0, height);
        sky.addColorStop(0, "#020817");
        sky.addColorStop(0.55, "#0c2941");
        sky.addColorStop(1, "#5b554c");
        context.fillStyle = sky;
        context.fillRect(0, 0, width, height);
      }

      const nightShade = context.createLinearGradient(0, 0, 0, height);
      nightShade.addColorStop(0, "rgba(2,8,22,.42)");
      nightShade.addColorStop(0.42, "rgba(3,14,26,.3)");
      nightShade.addColorStop(1, "rgba(4,12,16,.7)");
      context.fillStyle = nightShade;
      context.fillRect(0, 0, width, height);

      context.fillStyle = "rgba(255,255,255,.72)";
      for (let index = 0; index < 24; index += 1) {
        const starX = ((index * 83 + 41) % 997) / 997 * width;
        const starY = ((index * 47 + 17) % 211) / 211 * horizon * 0.72;
        context.beginPath();
        context.arc(starX, starY, index % 5 === 0 ? 1.15 : 0.55, 0, Math.PI * 2);
        context.fill();
      }

      context.save();
      context.fillStyle = "rgba(4,13,19,.78)";
      context.strokeStyle = `${activeHotel.color}cc`;
      context.lineWidth = 1;
      roundedRect(14, 14, Math.min(width - 28, 205), 47, 13);
      context.fill();
      context.stroke();
      context.fillStyle = "#fff";
      context.textAlign = "right";
      context.textBaseline = "middle";
      context.font = "800 13px system-ui";
      context.fillText(activeHotel.ar, Math.min(width - 28, 205), 33);
      context.fillStyle = "rgba(255,255,255,.62)";
      context.font = "600 8px system-ui";
      context.fillText(activeHotel.en, Math.min(width - 28, 205), 49);
      context.restore();

      const sceneryOffset = (world.distance * 0.008) % 0.24;
      for (let index = 0; index < 6; index += 1) {
        const depth = (index * 0.24 + sceneryOffset) % 1.04;
        const hotelIndex = Math.floor(world.distance / 70) + index;
        drawHotel(index % 2 === 0 ? -1 : 1, Math.max(0.04, depth), hotelIndex, width, height);
      }

      context.fillStyle = "#77736c";
      context.beginPath();
      context.moveTo(center - 35, horizon);
      context.lineTo(-8, height + 8);
      context.lineTo(34, height + 8);
      context.lineTo(center - 29, horizon);
      context.closePath();
      context.fill();
      context.beginPath();
      context.moveTo(center + 35, horizon);
      context.lineTo(width + 8, height + 8);
      context.lineTo(width - 34, height + 8);
      context.lineTo(center + 29, horizon);
      context.closePath();
      context.fill();

      const roadGradient = context.createLinearGradient(0, horizon, 0, height);
      roadGradient.addColorStop(0, "#46504f");
      roadGradient.addColorStop(0.55, "#202827");
      roadGradient.addColorStop(1, "#111716");
      context.fillStyle = roadGradient;
      context.beginPath();
      context.moveTo(center - 35, horizon);
      context.lineTo(center + 35, horizon);
      context.lineTo(width + 8, height + 8);
      context.lineTo(-8, height + 8);
      context.closePath();
      context.fill();

      context.strokeStyle = "rgba(224,187,95,.92)";
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(center - 36, horizon);
      context.lineTo(-6, height);
      context.moveTo(center + 36, horizon);
      context.lineTo(width + 6, height);
      context.stroke();

      const lightOffset = (world.distance * 0.011) % 0.2;
      for (let index = 0; index < 6; index += 1) {
        const depth = (index * 0.2 + lightOffset) % 1.04;
        for (const side of [-1, 1] as const) {
          const point = project(Math.max(0.04, depth), side * 1.12, width, height);
          const poleHeight = 86 * point.scale;
          context.strokeStyle = "rgba(20,29,29,.95)";
          context.lineWidth = Math.max(1, 3 * point.scale);
          context.beginPath();
          context.moveTo(point.x, point.y);
          context.lineTo(point.x, point.y - poleHeight);
          context.lineTo(point.x - side * 12 * point.scale, point.y - poleHeight);
          context.stroke();
          context.save();
          context.shadowColor = "#ffd98b";
          context.shadowBlur = 20 * point.scale;
          context.fillStyle = "#ffe8aa";
          context.beginPath();
          context.arc(point.x - side * 13 * point.scale, point.y - poleHeight, Math.max(1.3, 3.5 * point.scale), 0, Math.PI * 2);
          context.fill();
          context.restore();
        }
      }

      const dashOffset = (world.distance * 0.015) % 0.2;
      [-0.5, 0.5].forEach((laneDivider) => {
        for (let index = 0; index < 7; index += 1) {
          const startDepth = (index * 0.2 + dashOffset) % 1.08;
          const endDepth = Math.min(1.08, startDepth + 0.075);
          const start = project(startDepth, laneDivider, width, height);
          const end = project(endDepth, laneDivider, width, height);
          context.strokeStyle = "rgba(255,255,255,.78)";
          context.lineWidth = Math.max(1, end.scale * 3);
          context.beginPath();
          context.moveTo(start.x, start.y);
          context.lineTo(end.x, end.y);
          context.stroke();
        }
      });

      for (let index = 0; index < 4; index += 1) {
        const depth = (index * 0.27 + (world.distance * 0.01) % 0.27) % 1.03;
        const point = project(depth, index % 2 === 0 ? -0.2 : 0.22, width, height);
        context.save();
        context.globalAlpha = 0.25 + point.perspective * 0.65;
        context.strokeStyle = index % 2 === 0 ? "#f7e8b4" : "#e04d61";
        context.lineWidth = Math.max(1, 2.2 * point.scale);
        context.beginPath();
        context.moveTo(point.x, point.y - 3 * point.scale);
        context.lineTo(point.x, point.y - 20 * point.scale);
        context.stroke();
        context.restore();
      }
    };

    const applyLead = (amount: number) => {
      const world = worldRef.current;
      world.lead = Math.max(0, Math.min(100, world.lead + amount));
      setLead(Math.round(world.lead));
      if (world.lead <= 0) endGame();
    };

    const spawnObject = (world: GameWorld) => {
      const lane = laneValue(Math.floor(Math.random() * 3) - 1);
      const roll = Math.random();
      const type: TrackObjectType = roll < 0.58 ? "booking" : roll < 0.82 ? "call" : "cart";
      world.objects.push({ id: world.nextId++, type, lane, depth: 0.04 });

      if (type !== "booking" && Math.random() < 0.5) {
        const safeLanes = ([-1, 0, 1] as Lane[]).filter((candidate) => candidate !== lane);
        const bookingLane = safeLanes[Math.floor(Math.random() * safeLanes.length)];
        world.objects.push({ id: world.nextId++, type: "booking", lane: bookingLane, depth: 0.01 });
      }
      world.spawnIn = Math.max(470, 930 - world.speed * 720) + Math.random() * 360;
    };

    const updateWorld = (time: number, delta: number) => {
      const world = worldRef.current;
      if (stateRef.current !== "running") return;
      const seconds = delta / 1000;
      world.distance += (38 + world.speed * 105) * seconds;
      world.speed = Math.min(0.43, 0.23 + world.distance / 5200);
      world.lane += (world.targetLane - world.lane) * Math.min(1, seconds * 11);

      if (!world.grounded) {
        world.jumpY += world.jumpVelocity * seconds;
        world.jumpVelocity -= 1450 * seconds;
        if (world.jumpY <= 0) {
          world.jumpY = 0;
          world.jumpVelocity = 0;
          world.grounded = true;
        }
      }

      world.spawnIn -= delta;
      if (world.spawnIn <= 0) spawnObject(world);
      world.objects.forEach((object) => { object.depth += world.speed * seconds; });

      for (const object of world.objects) {
        if (object.handled) continue;
        const sameLane = Math.abs(world.lane - object.lane) < 0.34;
        const inCollisionZone = object.depth >= 0.82 && object.depth <= 1.01;
        if (sameLane && inCollisionZone) {
          if (object.type === "booking") {
            object.handled = true;
            world.bookings += 1;
            setBookings(world.bookings);
            applyLead(4);
            tone(720, 0.1);
            if (navigator.vibrate) navigator.vibrate(5);
          } else if (world.jumpY < (object.type === "cart" ? 58 : 42) && time >= world.invulnerableUntil) {
            object.handled = true;
            world.invulnerableUntil = time + 650;
            if (object.type === "call") {
              world.calls += 1;
              setCalls(world.calls);
              applyLead(-25);
            } else {
              applyLead(-18);
            }
            tone(190, 0.16);
            if (navigator.vibrate) navigator.vibrate([18, 25, 18]);
          }
        }

        if (!object.handled && object.depth > 1.06) {
          object.handled = true;
          if (object.type === "booking") applyLead(-5);
        }
      }

      world.objects = world.objects.filter((object) => !object.handled && object.depth < 1.12);
      if (time - world.lastUiUpdate >= 120) {
        world.lastUiUpdate = time;
        setScore(calculateScore());
      }
    };

    const draw = (time: number) => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const world = worldRef.current;
      const delta = Math.min(34, world.lastTime ? time - world.lastTime : 16);
      world.lastTime = time;
      updateWorld(time, delta);

      drawRoad(width, height, world);
      [...world.objects]
        .sort((a, b) => a.depth - b.depth)
        .forEach((object) => drawTrackObject(object, width, height));

      const playerPoint = project(0.9, world.lane, width, height);
      const danger = 1 - world.lead / 100;
      const chaserSide = world.lane > 0.35 ? -1 : 1;
      const chaserX = playerPoint.x + chaserSide * (42 - danger * 14);
      const chaserBaseline = Math.min(height + 3, playerPoint.y + 39 - danger * 34);
      drawRunner(chaserX, chaserBaseline, 0.72 + danger * 0.15, time + 28, "#684476", "المشرف");
      drawRunner(playerPoint.x, playerPoint.y - world.jumpY, 1.04, time, "#08705a", undefined, !world.grounded);

      if (danger > 0.64 && stateRef.current === "running") {
        context.fillStyle = `rgba(185,54,73,${(danger - 0.64) * 0.22})`;
        context.fillRect(0, 0, width, height);
      }

      frameRef.current = requestAnimationFrame(draw);
    };
    frameRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameRef.current);
      observer.disconnect();
    };
  }, [calculateScore, endGame, tone]);

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (state === "idle" || state === "over") {
      startGame();
      return;
    }
    if (state !== "running" || !start) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) > 34 && Math.abs(deltaX) > Math.abs(deltaY)) moveLane(deltaX > 0 ? 1 : -1);
    else jump();
  };

  const chaseLabel = lead > 58 ? "المشرف بعيد" : lead > 28 ? "المشرف يقترب" : "انتبه! المشرف خلفك";

  return (
    <div className="page-wrap-narrow runner-page">
      <PageHeader title="BHG Runner" subtitle="اجمع الحجوزات قبل أن تلحق بك المكالمات." icon={Gamepad2} />
      <section className="runner-shell">
        <div className="runner-hud">
          <div><span>النقاط</span><strong>{score.toLocaleString("ar-SA")}</strong></div>
          <div><span>الحجوزات</span><strong><CalendarCheck2 className="h-4 w-4" /> {bookings.toLocaleString("ar-SA")}</strong></div>
          <div><span>الأفضل</span><strong><Trophy className="h-4 w-4" /> {highScore.toLocaleString("ar-SA")}</strong></div>
          <button onClick={() => setSound((value) => !value)} aria-label={sound ? "إيقاف الصوت" : "تشغيل الصوت"}>{sound ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}</button>
        </div>
        <div className="runner-chase" aria-label={`المسافة عن المشرف ${lead}%`}>
          <span>{chaseLabel}</span>
          <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={lead}><i style={{ width: `${lead}%` }} /></div>
          <span><PhoneCall className="h-3.5 w-3.5" /> {calls.toLocaleString("ar-SA")}</span>
        </div>
        <div className="runner-stage runner-stage--perspective">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            aria-label="لعبة جري بمنظور الشخص الثالث بين فنادق مجموعة بودل"
          />
          {state === "idle" ? (
            <div className="runner-overlay">
              <span className="runner-overlay__icon"><Gamepad2 className="h-8 w-8" /></span>
              <h2>المكالمات وراك!</h2>
              <p>تحرك بين المسارات واجمع بطاقات الحجوزات. تجنب المكالمات وعربات الخدمة قبل أن يلحق بك المشرف.</p>
              <div className="runner-howto"><span>↔ اسحب للمسارات</span><span>↑ المس للقفز</span></div>
              <button onClick={startGame}><Play className="h-5 w-5 fill-current" /> ابدأ المطاردة</button>
            </div>
          ) : null}
          {state === "paused" ? (
            <div className="runner-overlay"><Pause className="h-8 w-8" /><h2>المطاردة متوقفة</h2><button onClick={togglePause}><Play className="h-5 w-5 fill-current" /> متابعة</button></div>
          ) : null}
          {state === "over" ? (
            <div className="runner-overlay runner-overlay--over">
              <span className="runner-overlay__score">{score.toLocaleString("ar-SA")}</span>
              <h2>المشرف لحقك!</h2>
              <p>جمعت {bookings.toLocaleString("ar-SA")} حجزًا، واستلمت {calls.toLocaleString("ar-SA")} مكالمات خلال الجولة.</p>
              <button onClick={startGame}><RotateCcw className="h-5 w-5" /> اهرب من جديد</button>
            </div>
          ) : null}
        </div>
        <div className="runner-controls runner-controls--lanes">
          <button onClick={() => moveLane(-1)} disabled={state !== "running"} aria-label="التحرك إلى اليسار"><ChevronLeft className="h-6 w-6" /><strong>يسار</strong></button>
          <button onClick={state === "idle" || state === "over" ? startGame : jump}><span>↑</span><strong>{state === "idle" || state === "over" ? "ابدأ" : "قفز"}</strong></button>
          <button onClick={() => moveLane(1)} disabled={state !== "running"} aria-label="التحرك إلى اليمين"><ChevronRight className="h-6 w-6" /><strong>يمين</strong></button>
          {state === "running" || state === "paused" ? <button className="runner-controls__pause" onClick={togglePause}>{state === "running" ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}<strong>{state === "running" ? "إيقاف" : "متابعة"}</strong></button> : null}
          <p>اسحب داخل اللعبة يمينًا أو يسارًا، والمس الشاشة للقفز.</p>
        </div>
      </section>
      <div className="runner-brand-strip" aria-label="علامات مجموعة بودل للضيافة">{BRANDS.map((brand) => <span key={brand.en} style={{ borderColor: `${brand.color}22`, color: brand.color }}>{brand.ar}<small>{brand.en}</small></span>)}</div>
      <p className="text-center text-[11px] leading-5 text-muted-foreground">استراحة ترفيهية خفيفة للموظفين. الشخصيات والرسوم أصلية ومخصصة للموقع.</p>
    </div>
  );
};

export default BoudlRunner;
