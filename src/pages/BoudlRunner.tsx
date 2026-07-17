import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Crown,
  Gamepad2,
  Loader2,
  Medal,
  Pause,
  PhoneCall,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";

type GameState = "idle" | "running" | "paused" | "over" | "won";
type Lane = -1 | 0 | 1;
type TrackObjectType = "booking" | "vip" | "coffee" | "call" | "cart";
type TrackObject = {
  id: number;
  type: TrackObjectType;
  lane: Lane;
  depth: number;
  handled?: boolean;
};

type PickupEffect = {
  id: number;
  lane: Lane;
  depth: number;
  life: number;
  color: string;
  label: string;
};

type LeaderboardEntry = {
  id: string;
  name: string;
  score: number;
  bookings: number;
  maxCombo: number;
  calls: number;
  createdAt: string;
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
  combo: number;
  maxCombo: number;
  comboExpires: number;
  bonusScore: number;
  missionTarget: number;
  turboUntil: number;
  shieldUntil: number;
  message: string;
  messageUntil: number;
  nextQuipAt: number;
  pressureIndex: number;
  pressureUntil: number;
  shake: number;
  effects: PickupEffect[];
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

const BOOKING_QUIPS = [
  "حجز مؤكد... والبريك مؤجل دقيقة!",
  "تم التأكيد قبل ما الضيف يقول: ألو؟",
  "ممتاز! رقم التأكيد أسرع منك.",
  "الحجز دخل... والهدف بدأ يتوتر.",
];

const CALL_QUIPS = [
  "مكالمة «سريعة»... مدتها المتوقعة ١٨ دقيقة!",
  "التحويلة عرفت مسارك.",
  "المشرف: من المتاح؟ الكل فجأة ساكت!",
  "المكالمة تقول: بس عندي استفسار بسيط.",
];

const SUPERVISOR_QUIPS = [
  "المشرف: ممتاز... باقي كم حجز؟ لا تسأل!",
  "تنبيه إداري: البريك يركض أسرع منك.",
  "المشرف: لا تشيل هم، المكالمة ودودة جدًا.",
  "هدف الشفت يشاهدك الآن.",
];

const CONTEST_GOAL = 500;
const PRESSURE_THRESHOLDS = [100, 250, 400, 475];

const pickQuip = (items: string[], seed: number) => items[Math.abs(seed) % items.length];

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
  combo: 0,
  maxCombo: 0,
  comboExpires: 0,
  bonusScore: 0,
  missionTarget: 12,
  turboUntil: 0,
  shieldUntil: 0,
  message: "",
  messageUntil: 0,
  nextQuipAt: 0,
  pressureIndex: 0,
  pressureUntil: 0,
  shake: 0,
  effects: [],
  nextId: 1,
  invulnerableUntil: 0,
});

const laneValue = (value: number): Lane => Math.max(-1, Math.min(1, value)) as Lane;

const getPlayerId = () => {
  const existing = localStorage.getItem("bhg_runner_player_id");
  if (existing) return existing;
  const generated = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 16)}`;
  localStorage.setItem("bhg_runner_player_id", generated);
  return generated;
};

const BoudlRunner = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const startedAtRef = useRef(0);
  const durationRef = useRef(1_000);
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
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [missionTarget, setMissionTarget] = useState(12);
  const [boosted, setBoosted] = useState(false);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem("bhg_runner_player_name") || "");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem("bhg_runner_high_score") || 0));
  const [sound, setSound] = useState(true);

  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { soundRef.current = sound; }, [sound]);

  const loadLeaderboard = useCallback(async () => {
    try {
      const response = await fetch("/.netlify/functions/runner-leaderboard");
      if (!response.ok) throw new Error("Leaderboard unavailable");
      const data = await response.json() as { entries?: LeaderboardEntry[] };
      setLeaderboard(Array.isArray(data.entries) ? data.entries : []);
    } catch {
      setLeaderboard([]);
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  useEffect(() => { void loadLeaderboard(); }, [loadLeaderboard]);

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
    return Math.floor(world.distance * 2) + world.bonusScore;
  }, []);

  const submitLeaderboardScore = useCallback(async () => {
    const name = playerName.trim();
    if (name.length < 2 || !["over", "won"].includes(stateRef.current)) {
      setSubmitStatus("error");
      return;
    }
    setSubmitStatus("sending");
    try {
      const response = await fetch("/.netlify/functions/runner-leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: getPlayerId(),
          name,
          score,
          bookings,
          maxCombo,
          calls,
          durationMs: Math.round(durationRef.current),
        }),
      });
      const data = await response.json() as { entries?: LeaderboardEntry[] };
      if (!response.ok) throw new Error("Unable to submit score");
      localStorage.setItem("bhg_runner_player_name", name);
      setLeaderboard(Array.isArray(data.entries) ? data.entries : []);
      setSubmitStatus("sent");
    } catch {
      setSubmitStatus("error");
    }
  }, [bookings, calls, maxCombo, playerName, score]);

  const endGame = useCallback(() => {
    if (stateRef.current === "over" || stateRef.current === "won") return;
    durationRef.current = Math.max(1_000, performance.now() - startedAtRef.current);
    const finalScore = calculateScore();
    setScore(finalScore);
    setBookings(worldRef.current.bookings);
    setCalls(worldRef.current.calls);
    setCombo(0);
    setMaxCombo(worldRef.current.maxCombo);
    setBoosted(false);
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

  const winChallenge = useCallback(() => {
    if (stateRef.current !== "running") return;
    durationRef.current = Math.max(1_000, performance.now() - startedAtRef.current);
    const finalScore = calculateScore() + 5000;
    worldRef.current.bonusScore += 5000;
    setScore(finalScore);
    setBookings(worldRef.current.bookings);
    setCalls(worldRef.current.calls);
    setCombo(worldRef.current.combo);
    setMaxCombo(worldRef.current.maxCombo);
    setBoosted(false);
    setState("won");
    stateRef.current = "won";
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem("bhg_runner_high_score", String(finalScore));
    }
    tone(980, 0.28);
    window.setTimeout(() => tone(1240, 0.32), 170);
    if (navigator.vibrate) navigator.vibrate([25, 30, 25, 30, 70]);
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
    startedAtRef.current = performance.now();
    durationRef.current = 1_000;
    setScore(0);
    setBookings(0);
    setCalls(0);
    setLead(72);
    setCombo(0);
    setMaxCombo(0);
    setMissionTarget(12);
    setBoosted(false);
    setSubmitStatus("idle");
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
        if (["idle", "over", "won"].includes(stateRef.current)) startGame();
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
      glow = false,
    ) => {
      const run = stateRef.current === "running" && !isJumping ? Math.sin(time / 72) : 0;
      context.save();
      context.globalAlpha = 0.28;
      context.fillStyle = glow ? "#f2c96d" : "#07110f";
      context.beginPath();
      context.ellipse(x, baseline + 1, 24 * scale, 7 * scale, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
      context.save();
      context.translate(x, baseline);
      context.scale(scale, scale);
      context.lineCap = "round";

      if (glow) {
        context.shadowColor = "#f2c96d";
        context.shadowBlur = 22;
      }

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
        context.shadowBlur = 0;
        context.fillStyle = "#f7f1e3";
        context.strokeStyle = "#c6a65d";
        context.lineWidth = 2;
        roundedRect(16, -62, 18, 26, 3);
        context.fill();
        context.stroke();
        context.fillStyle = "#684476";
        context.fillRect(20, -57, 10, 2);
        context.fillRect(20, -51, 8, 2);
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

      if (object.type === "booking" || object.type === "vip") {
        const isVip = object.type === "vip";
        context.shadowColor = isVip ? "rgba(241,193,78,.48)" : "rgba(8,112,90,.22)";
        context.shadowBlur = isVip ? 22 : 12;
        context.fillStyle = isVip ? "#fff9e8" : "#fff";
        context.strokeStyle = isVip ? "#e6b84d" : "rgba(8,112,90,.32)";
        context.lineWidth = 2;
        roundedRect(-30, -50, 60, 45, 9);
        context.fill();
        context.stroke();
        context.shadowBlur = 0;
        context.fillStyle = isVip ? "#b78925" : "#08705a";
        roundedRect(-30, -50, 60, 14, 8);
        context.fill();
        context.fillStyle = "#173c34";
        context.textAlign = "center";
        context.font = "800 11px system-ui";
        context.fillText(isVip ? "VIP" : "حجز", 0, -21);
        context.fillStyle = "#b78925";
        context.font = "700 7px system-ui";
        context.fillText(`RSV ${String(object.id).padStart(3, "0")}`, 0, -10);
      } else if (object.type === "coffee") {
        context.shadowColor = "rgba(242,201,109,.55)";
        context.shadowBlur = 20;
        context.fillStyle = "#f9e2b8";
        context.strokeStyle = "#8a5b34";
        context.lineWidth = 3;
        roundedRect(-22, -42, 39, 32, 8);
        context.fill();
        context.stroke();
        context.beginPath();
        context.arc(18, -27, 10, -Math.PI / 2, Math.PI / 2);
        context.stroke();
        context.shadowBlur = 0;
        context.strokeStyle = "rgba(255,255,255,.8)";
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(-11, -48); context.quadraticCurveTo(-17, -55, -10, -61);
        context.moveTo(1, -48); context.quadraticCurveTo(-5, -55, 2, -62);
        context.stroke();
        context.fillStyle = "#5a3d2c";
        context.textAlign = "center";
        context.font = "800 8px system-ui";
        context.fillText("قهوة", -2, -20);
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

    const drawPickupEffects = (effects: PickupEffect[], width: number, height: number) => {
      for (const effect of effects) {
        const point = project(effect.depth, effect.lane, width, height);
        const progress = 1 - effect.life / 760;
        context.save();
        context.globalAlpha = Math.max(0, effect.life / 760);
        context.translate(point.x, point.y - 48 * point.scale - progress * 34);
        context.fillStyle = effect.color;
        context.textAlign = "center";
        context.font = `900 ${Math.max(9, 13 * point.scale)}px system-ui`;
        context.fillText(effect.label, 0, -16);
        for (let index = 0; index < 8; index += 1) {
          const angle = index * Math.PI / 4;
          const radius = (10 + progress * 28) * point.scale;
          context.beginPath();
          context.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, Math.max(1.2, 2.5 * point.scale), 0, Math.PI * 2);
          context.fill();
        }
        context.restore();
      }
    };

    const drawGameMessage = (world: GameWorld, time: number, width: number) => {
      if (!world.message || time >= world.messageUntil) return;
      const remaining = world.messageUntil - time;
      const alpha = Math.min(1, remaining / 260, (world.messageUntil - remaining + 80) / 240);
      context.save();
      context.globalAlpha = Math.max(0, alpha);
      context.direction = "rtl";
      context.font = "800 11px system-ui";
      const bubbleWidth = Math.min(width - 36, Math.max(190, context.measureText(world.message).width + 34));
      const bubbleX = (width - bubbleWidth) / 2;
      context.fillStyle = "rgba(7,20,25,.86)";
      context.strokeStyle = "rgba(242,201,109,.55)";
      context.lineWidth = 1;
      roundedRect(bubbleX, 72, bubbleWidth, 38, 13);
      context.fill();
      context.stroke();
      context.fillStyle = "#fff9eb";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(world.message, width / 2, 91, bubbleWidth - 24);
      context.restore();
    };

    const drawRoad = (width: number, height: number, world: GameWorld, time: number) => {
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

      context.save();
      context.globalAlpha = 0.14;
      context.fillStyle = "#d4d6d2";
      for (let index = 0; index < 26; index += 1) {
        const depth = ((index * 0.071 + world.distance * 0.002) % 1.02);
        const lane = ((index * 37) % 100) / 50 - 1;
        const point = project(depth, lane, width, height);
        context.fillRect(point.x, point.y, Math.max(1, point.scale * 2), Math.max(1, point.scale * 5));
      }
      context.restore();

      if (time < world.turboUntil) {
        context.save();
        context.globalAlpha = 0.5;
        context.strokeStyle = "#f7d983";
        for (let index = 0; index < 14; index += 1) {
          const x = (index * 79 + time * 0.32) % (width + 90) - 45;
          const y = height * 0.38 + ((index * 53) % Math.max(1, height * 0.62));
          context.lineWidth = index % 3 === 0 ? 2 : 1;
          context.beginPath();
          context.moveTo(x, y);
          context.lineTo(x - (20 + index % 4 * 8), y + 46);
          context.stroke();
        }
        context.restore();
      }
    };

    const applyLead = (amount: number) => {
      const world = worldRef.current;
      world.lead = Math.max(0, Math.min(100, world.lead + amount));
      setLead(Math.round(world.lead));
      if (world.lead <= 0) endGame();
    };

    const showWorldMessage = (world: GameWorld, message: string, time: number, duration = 1900) => {
      world.message = message;
      world.messageUntil = time + duration;
    };

    const addPickupEffect = (world: GameWorld, object: TrackObject, color: string, label: string) => {
      world.effects.push({ id: world.nextId++, lane: object.lane, depth: object.depth, life: 760, color, label });
    };

    const spawnObject = (world: GameWorld) => {
      const lane = laneValue(Math.floor(Math.random() * 3) - 1);
      const roll = Math.random();
      const type: TrackObjectType = roll < 0.46
        ? "booking"
        : roll < 0.54
          ? "vip"
          : roll < 0.61
            ? "coffee"
            : roll < 0.84
              ? "call"
              : "cart";
      world.objects.push({ id: world.nextId++, type, lane, depth: 0.04 });

      if (["call", "cart"].includes(type) && Math.random() < 0.58) {
        const safeLanes = ([-1, 0, 1] as Lane[]).filter((candidate) => candidate !== lane);
        const bookingLane = safeLanes[Math.floor(Math.random() * safeLanes.length)];
        world.objects.push({ id: world.nextId++, type: "booking", lane: bookingLane, depth: 0.01 });
      }
      world.spawnIn = Math.max(430, 900 - world.speed * 690) + Math.random() * 340;
    };

    const updateWorld = (time: number, delta: number) => {
      const world = worldRef.current;
      if (stateRef.current !== "running") return;
      const seconds = delta / 1000;
      const hasTurbo = time < world.turboUntil;
      world.distance += (38 + world.speed * 105 + (hasTurbo ? 13 : 0)) * seconds;
      world.speed = Math.min(0.46, 0.23 + world.distance / 5200 + (hasTurbo ? 0.035 : 0));
      world.lane += (world.targetLane - world.lane) * Math.min(1, seconds * 11);
      world.shake = Math.max(0, world.shake - delta * 0.028);

      if (world.nextQuipAt === 0) world.nextQuipAt = time + 4200;
      if (time >= world.nextQuipAt) {
        showWorldMessage(world, pickQuip(SUPERVISOR_QUIPS, Math.floor(world.distance)), time, 2200);
        world.nextQuipAt = time + 6200 + Math.random() * 2600;
      }
      if (world.combo > 0 && time > world.comboExpires) {
        world.combo = 0;
        setCombo(0);
      }
      if (!hasTurbo && world.turboUntil !== 0) {
        world.turboUntil = 0;
        world.shieldUntil = 0;
        setBoosted(false);
      }

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
      world.effects.forEach((effect) => {
        effect.life -= delta;
        effect.depth = Math.min(1.08, effect.depth + world.speed * seconds * 0.12);
      });
      world.effects = world.effects.filter((effect) => effect.life > 0);

      for (const object of world.objects) {
        if (object.handled) continue;
        const sameLane = Math.abs(world.lane - object.lane) < 0.34;
        const inCollisionZone = object.depth >= 0.82 && object.depth <= 1.01;
        if (sameLane && inCollisionZone) {
          if (object.type === "booking" || object.type === "vip") {
            const isVip = object.type === "vip";
            object.handled = true;
            world.bookings += 1;
            world.combo = time <= world.comboExpires ? Math.min(9, world.combo + 1) : 1;
            world.comboExpires = time + 2700;
            world.maxCombo = Math.max(world.maxCombo, world.combo);
            const pickupScore = (isVip ? 90 : 30) * Math.min(5, world.combo);
            world.bonusScore += pickupScore;
            setBookings(world.bookings);
            setCombo(world.combo);
            setMaxCombo(world.maxCombo);
            applyLead(isVip ? 10 : 4);
            addPickupEffect(world, object, isVip ? "#f2c96d" : "#62dcb3", `+${pickupScore}`);
            showWorldMessage(
              world,
              isVip ? "حجز VIP! الإدارة ابتسمت لمدة ثلاث ثوانٍ." : pickQuip(BOOKING_QUIPS, world.bookings),
              time,
            );
            tone(isVip ? 880 : 720, isVip ? 0.16 : 0.1);
            if (navigator.vibrate) navigator.vibrate(5);
            if (world.bookings >= world.missionTarget) {
              world.bonusScore += 250;
              world.missionTarget += 12;
              setMissionTarget(world.missionTarget);
              applyLead(12);
              showWorldMessage(world, "مهمة الشفت اكتملت! المشرف: جميل... نبدأ الثانية؟", time, 2600);
              tone(990, 0.22);
            }
            const pressureAt = PRESSURE_THRESHOLDS[world.pressureIndex];
            if (pressureAt && world.bookings >= pressureAt) {
              const safeLane = laneValue(world.pressureIndex % 3 - 1);
              ([-1, 0, 1] as Lane[]).forEach((pressureLane) => {
                if (pressureLane !== safeLane) {
                  world.objects.push({ id: world.nextId++, type: "call", lane: pressureLane, depth: 0.035 });
                }
              });
              world.pressureIndex += 1;
              world.pressureUntil = time + 4800;
              world.shake = 3;
              showWorldMessage(world, `دروب الضغط ${world.pressureIndex}: عاصفة مكالمات... ومسار النجاة مفتوح!`, time, 2900);
            }
            if (world.bookings >= CONTEST_GOAL) winChallenge();
          } else if (object.type === "coffee") {
            object.handled = true;
            world.turboUntil = time + 5400;
            world.shieldUntil = time + 5400;
            world.bonusScore += 60;
            setBoosted(true);
            addPickupEffect(world, object, "#f2c96d", "قهوة الشفت!");
            showWorldMessage(world, "قهوة النايت شفت: سرعة، تركيز، ونسيان وقت البريك!", time, 2500);
            tone(940, 0.2);
            if (navigator.vibrate) navigator.vibrate([6, 25, 6]);
          } else if (world.jumpY < (object.type === "cart" ? 58 : 42) && time >= world.invulnerableUntil) {
            object.handled = true;
            world.invulnerableUntil = time + 650;
            if (time < world.shieldUntil) {
              world.bonusScore += 20;
              addPickupEffect(world, object, "#f2c96d", "تجاوز!");
              showWorldMessage(world, "القهوة قالت للمكالمة: مشغول حاليًا!", time);
              tone(620, 0.09);
            } else {
              world.combo = 0;
              setCombo(0);
              world.shake = 8;
              if (object.type === "call") {
                world.calls += 1;
                setCalls(world.calls);
                applyLead(-24);
                showWorldMessage(world, pickQuip(CALL_QUIPS, world.calls), time, 2300);
              } else {
                applyLead(-17);
                showWorldMessage(world, "عربة الخدمة: ١ — أنت: صفر.", time);
              }
              tone(190, 0.16);
              if (navigator.vibrate) navigator.vibrate([18, 25, 18]);
            }
          }
        }

        if (!object.handled && object.depth > 1.06) {
          object.handled = true;
          if (object.type === "booking" || object.type === "vip") {
            const hadCombo = world.combo >= 3;
            world.combo = 0;
            setCombo(0);
            applyLead(object.type === "vip" ? -8 : -4);
            if (hadCombo) showWorldMessage(world, "ضاع الحجز... والكومبو أخذ إجازة مفاجئة.", time);
          }
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

      context.save();
      if (world.shake > 0) {
        context.translate(Math.sin(time * 0.12) * world.shake * 0.45, Math.cos(time * 0.17) * world.shake * 0.24);
      }
      drawRoad(width, height, world, time);
      [...world.objects]
        .sort((a, b) => a.depth - b.depth)
        .forEach((object) => drawTrackObject(object, width, height));
      drawPickupEffects(world.effects, width, height);

      const playerPoint = project(0.9, world.lane, width, height);
      const danger = 1 - world.lead / 100;
      const chaserSide = world.lane > 0.35 ? -1 : 1;
      const chaserX = playerPoint.x + chaserSide * (42 - danger * 14);
      const chaserBaseline = Math.min(height + 3, playerPoint.y + 39 - danger * 34);
      drawRunner(chaserX, chaserBaseline, 0.72 + danger * 0.15, time + 28, "#684476", "المشرف");
      drawRunner(playerPoint.x, playerPoint.y - world.jumpY, 1.04, time, "#08705a", undefined, !world.grounded, time < world.shieldUntil);

      if (danger > 0.64 && stateRef.current === "running") {
        context.fillStyle = `rgba(185,54,73,${(danger - 0.64) * 0.22})`;
        context.fillRect(0, 0, width, height);
      }
      context.restore();
      drawGameMessage(world, time, width);

      frameRef.current = requestAnimationFrame(draw);
    };
    frameRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameRef.current);
      observer.disconnect();
    };
  }, [calculateScore, endGame, tone, winChallenge]);

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (state === "idle" || state === "over" || state === "won") {
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
  const contestProgress = Math.min(100, bookings / CONTEST_GOAL * 100);
  const missionStart = Math.max(0, missionTarget - 12);
  const missionProgress = Math.min(12, Math.max(0, bookings - missionStart));
  const performanceTitle = bookings >= 100 ? "أسطورة الشفت" : bookings >= 40 ? "ملك التأكيد" : bookings >= 15 ? "أداء فاخر" : "بداية موفقة";

  return (
    <div className="page-wrap-narrow runner-page">
      <PageHeader title="BHG Runner" subtitle="نسخة النايت شفت: حجوزات، كومبو، ومكالمات لا تعرف الرحمة." icon={Gamepad2} />
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
        <div className="runner-contest" aria-label={`تقدم تحدي خمسمائة حجز ${bookings} من ${CONTEST_GOAL}`}>
          <span><Crown className="h-4 w-4" /> تحدي ٥٠٠ حجز</span>
          <div><i style={{ width: `${contestProgress}%` }} /></div>
          <strong>{bookings.toLocaleString("ar-SA")} / ٥٠٠</strong>
          <small>آيفون 17 افتراضي داخل اللعبة للمرح فقط — ليست جائزة حقيقية.</small>
        </div>
        <div className="runner-stage runner-stage--perspective">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            aria-label="لعبة جري بمنظور الشخص الثالث بين فنادق مجموعة بودل"
          />
          {state === "running" && combo >= 2 ? <div className="runner-combo"><span>×{combo.toLocaleString("ar-SA")}</span><small>كومبو الحجز</small></div> : null}
          {state === "running" ? <div className="runner-mini-mission"><span>مهمة الشفت</span><strong>{missionProgress.toLocaleString("ar-SA")} / ١٢</strong></div> : null}
          {state === "running" && boosted ? <div className="runner-boost"><Coffee className="h-4 w-4" /><span>قهوة الشفت</span><strong>حماية مؤقتة</strong></div> : null}
          {state === "idle" ? (
            <div className="runner-overlay runner-overlay--premium">
              <span className="runner-edition"><Sparkles className="h-3.5 w-3.5" /> NIGHT SHIFT EDITION</span>
              <span className="runner-overlay__icon"><Gamepad2 className="h-8 w-8" /></span>
              <h2>الشفت بدأ... والهروب اختياري!</h2>
              <p>اجمع الحجوزات، حافظ على الكومبو، وخذ قهوة الشفت قبل أن تتحول عبارة «استفسار بسيط» إلى مكالمة تاريخية.</p>
              <div className="runner-rewards"><span><CalendarCheck2 /> حجز</span><span><Crown /> VIP</span><span><Coffee /> حماية</span></div>
              <div className="runner-howto"><span>↔ اسحب للمسارات</span><span>↑ المس للقفز</span></div>
              <button onClick={startGame}><Play className="h-5 w-5 fill-current" /> ابدأ الشفت</button>
            </div>
          ) : null}
          {state === "paused" ? (
            <div className="runner-overlay"><Pause className="h-8 w-8" /><h2>المطاردة متوقفة</h2><button onClick={togglePause}><Play className="h-5 w-5 fill-current" /> متابعة</button></div>
          ) : null}
          {state === "over" ? (
            <div className="runner-overlay runner-overlay--over">
              <span className="runner-overlay__score">{score.toLocaleString("ar-SA")}</span>
              <h2>{performanceTitle}</h2>
              <p>{calls > bookings ? "المكالمات كسبت الجولة... لكنها لم تكسب احترامك." : "المشرف لحقك، لكنه سجّل ملاحظة: الركض ممتاز."}</p>
              <div className="runner-result-grid"><span><small>الحجوزات</small><strong>{bookings.toLocaleString("ar-SA")}</strong></span><span><small>أعلى كومبو</small><strong>×{maxCombo.toLocaleString("ar-SA")}</strong></span><span><small>المكالمات</small><strong>{calls.toLocaleString("ar-SA")}</strong></span></div>
              <button onClick={startGame}><RotateCcw className="h-5 w-5" /> جولة انتقامية</button>
            </div>
          ) : null}
          {state === "won" ? (
            <div className="runner-overlay runner-overlay--won">
              <span className="runner-win-crown"><Crown className="h-9 w-9" /></span>
              <span className="runner-overlay__score">٥٠٠</span>
              <h2>فزت بتحدي الحجوزات!</h2>
              <p>الجهاز افتراضي داخل اللعبة؛ أما الإنجاز والكومبو فحقيقيان جدًا.</p>
              <div className="runner-virtual-phone"><span>17</span><small>VIRTUAL TROPHY</small></div>
              <small className="runner-prize-note">هذه مكافأة ترفيهية داخل اللعبة وليست جائزة أو عرضًا حقيقيًا.</small>
              <button onClick={startGame}><RotateCcw className="h-5 w-5" /> تحدٍ جديد</button>
            </div>
          ) : null}
        </div>
        <div className="runner-controls runner-controls--lanes">
          <button onClick={() => moveLane(-1)} disabled={state !== "running"} aria-label="التحرك إلى اليسار"><ChevronLeft className="h-6 w-6" /><strong>يسار</strong></button>
          <button onClick={state === "idle" || state === "over" || state === "won" ? startGame : jump}><span>↑</span><strong>{state === "idle" || state === "over" || state === "won" ? "ابدأ" : "قفز"}</strong></button>
          <button onClick={() => moveLane(1)} disabled={state !== "running"} aria-label="التحرك إلى اليمين"><ChevronRight className="h-6 w-6" /><strong>يمين</strong></button>
          {state === "running" || state === "paused" ? <button className="runner-controls__pause" onClick={togglePause}>{state === "running" ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}<strong>{state === "running" ? "إيقاف" : "متابعة"}</strong></button> : null}
          <p>اسحب داخل اللعبة يمينًا أو يسارًا، والمس الشاشة للقفز.</p>
        </div>
      </section>
      <div className="runner-brand-strip" aria-label="علامات مجموعة بودل للضيافة">{BRANDS.map((brand) => <span key={brand.en} style={{ borderColor: `${brand.color}22`, color: brand.color }}>{brand.ar}<small>{brand.en}</small></span>)}</div>
      <section className="runner-leaderboard" aria-label="ترتيب تحدي الحجوزات الترفيهي">
        <header><span><Medal className="h-5 w-5" /></span><div><h2>متصدرو الشفت</h2><p>أفضل نتائج تحدي الحجوزات الترفيهي.</p></div></header>
        {state === "over" || state === "won" ? (
          <form onSubmit={(event) => { event.preventDefault(); void submitLeaderboardScore(); }}>
            <label htmlFor="runner-player-name">اسم العرض</label>
            <div><input id="runner-player-name" value={playerName} onChange={(event) => { setPlayerName(event.target.value); setSubmitStatus("idle"); }} maxLength={28} placeholder="مثال: محمد - 2135" autoComplete="nickname" /><button type="submit" disabled={submitStatus === "sending" || submitStatus === "sent"}>{submitStatus === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{submitStatus === "sent" ? "تم تسجيل النتيجة" : "سجّل نتيجتي"}</button></div>
            {submitStatus === "error" ? <small className="runner-leaderboard__error">تحقق من الاسم والاتصال ثم حاول مجددًا.</small> : null}
          </form>
        ) : null}
        {leaderboardLoading ? <div className="runner-leaderboard__empty"><Loader2 className="h-5 w-5 animate-spin" /> جارٍ تحميل الترتيب</div> : leaderboard.length ? (
          <ol>{leaderboard.slice(0, 5).map((entry, index) => <li key={entry.id}><span className={`runner-rank runner-rank--${index + 1}`}>{index + 1}</span><div><strong>{entry.name}</strong><small>كومبو ×{entry.maxCombo.toLocaleString("ar-SA")}</small></div><span><strong>{entry.bookings.toLocaleString("ar-SA")}</strong><small>حجز</small></span><span><strong>{entry.score.toLocaleString("ar-SA")}</strong><small>نقطة</small></span></li>)}</ol>
        ) : <div className="runner-leaderboard__empty"><Trophy className="h-5 w-5" /> كن أول متصدر في الشفت.</div>}
        <p className="runner-leaderboard__note">ترتيب ترفيهي داخل اللعبة، ولا يُستخدم لاعتماد مكافآت أو إجراءات وظيفية.</p>
      </section>
      <p className="text-center text-[11px] leading-5 text-muted-foreground">استراحة ترفيهية خفيفة للموظفين. الشخصيات والرسوم أصلية ومخصصة للموقع.</p>
    </div>
  );
};

export default BoudlRunner;
