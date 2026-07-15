import type { Context } from "@netlify/functions";
import { getDeployStore, getStore } from "@netlify/blobs";
import { json } from "./_shared/security";

type RunnerEntry = {
  id: string;
  playerId: string;
  name: string;
  score: number;
  bookings: number;
  maxCombo: number;
  calls: number;
  durationMs: number;
  createdAt: string;
};

const cleanName = (value: unknown) =>
  Array.from(String(value || ""))
    .filter((char) => {
      const code = char.charCodeAt(0);
      return char !== "<" && char !== ">" && code > 31 && code !== 127;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 28);

const finiteInteger = (value: unknown, min: number, max: number) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  const integer = Math.floor(numeric);
  return integer >= min && integer <= max ? integer : null;
};

const leaderboardStore = (context: Context) => {
  if (context.deploy.context === "production") {
    return getStore({ name: "runner_leaderboard", consistency: "strong" });
  }
  return getDeployStore({ name: "runner_leaderboard", deployID: context.deploy.id });
};

const readEntries = async (store: ReturnType<typeof leaderboardStore>): Promise<RunnerEntry[]> => {
  try {
    return ((await store.get("scores", { type: "json" })) as RunnerEntry[]) || [];
  } catch {
    return [];
  }
};

const publicEntry = (entry: RunnerEntry) => ({
  id: entry.id,
  name: entry.name,
  score: entry.score,
  bookings: entry.bookings,
  maxCombo: entry.maxCombo,
  calls: entry.calls,
  createdAt: entry.createdAt,
});

export default async (req: Request, context: Context) => {
  const store = leaderboardStore(context);

  if (req.method === "GET") {
    const entries = await readEntries(store);
    return json({
      entries: entries
        .sort((a, b) => b.bookings - a.bookings || b.score - a.score || a.createdAt.localeCompare(b.createdAt))
        .slice(0, 20)
        .map(publicEntry),
    });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const name = cleanName(body.name);
  const playerId = String(body.playerId || "").trim();
  const score = finiteInteger(body.score, 0, 1_000_000);
  const bookings = finiteInteger(body.bookings, 0, 500);
  const maxCombo = finiteInteger(body.maxCombo, 0, 9);
  const calls = finiteInteger(body.calls, 0, 2_000);
  const durationMs = finiteInteger(body.durationMs, 1_000, 14_400_000);

  if (name.length < 2 || !/^[\p{L}\p{N} ._-]+$/u.test(name)) {
    return json({ error: "Enter a valid display name" }, 400);
  }
  if (!/^[a-zA-Z0-9_-]{12,64}$/.test(playerId)) {
    return json({ error: "Invalid player identifier" }, 400);
  }
  if (score === null || bookings === null || maxCombo === null || calls === null || durationMs === null) {
    return json({ error: "Invalid score data" }, 400);
  }

  const minimumDuration = Math.max(1_000, bookings * 260);
  const maximumPlausibleScore = Math.floor(durationMs / 1_000 * 220 + bookings * 500 + 10_000);
  if (durationMs < minimumDuration || score > maximumPlausibleScore) {
    return json({ error: "Score could not be verified" }, 422);
  }

  const entry: RunnerEntry = {
    id: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    playerId,
    name,
    score,
    bookings,
    maxCombo,
    calls,
    durationMs,
    createdAt: new Date().toISOString(),
  };

  const entries = await readEntries(store);
  const existingIndex = entries.findIndex((item) => item.playerId === playerId);
  if (existingIndex >= 0) {
    const existing = entries[existingIndex];
    const isBetter = entry.bookings > existing.bookings || (entry.bookings === existing.bookings && entry.score > existing.score);
    if (isBetter) entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }

  const ranked = entries
    .sort((a, b) => b.bookings - a.bookings || b.score - a.score || a.createdAt.localeCompare(b.createdAt))
    .slice(0, 50);
  await store.setJSON("scores", ranked);

  return json({ ok: true, entries: ranked.slice(0, 20).map(publicEntry) }, 201);
};

export const config = {
  rateLimit: {
    windowSize: 60,
    windowLimit: 30,
    aggregateBy: ["ip"],
  },
};
