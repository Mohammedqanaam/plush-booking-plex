import { getStore } from "@netlify/blobs";
import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

export const VALID_ROLES = ["superadmin", "admin", "editor", "viewer"] as const;
export type UserRole = (typeof VALID_ROLES)[number];
export type Session = {
  username: string;
  role: UserRole;
  createdAt: number;
  expiresAt: number;
};

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const PASSWORD_ITERATIONS = 310_000;
const PASSWORD_KEY_LENGTH = 32;

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export function getBearerToken(req: Request): string | null {
  const header = req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return /^[a-f0-9]{64}$/i.test(token) ? token : null;
}

export async function validateSession(req: Request): Promise<Session | null> {
  const token = getBearerToken(req);
  if (!token) return null;

  const store = getStore({ name: "sessions", consistency: "strong" });
  try {
    const raw = (await store.get(`sess_${token}`, { type: "json" })) as Partial<Session> | null;
    if (!raw?.username || !raw.role || !VALID_ROLES.includes(raw.role)) return null;

    const createdAt = Number(raw.createdAt || 0);
    const expiresAt = Number(raw.expiresAt || createdAt + SESSION_TTL_MS);
    if (!createdAt || expiresAt <= Date.now()) {
      await store.delete(`sess_${token}`).catch(() => undefined);
      return null;
    }

    return { username: raw.username, role: raw.role, createdAt, expiresAt };
  } catch {
    return null;
  }
}

export function createSession(username: string, role: UserRole): Session {
  const createdAt = Date.now();
  return { username, role, createdAt, expiresAt: createdAt + SESSION_TTL_MS };
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const key = pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEY_LENGTH, "sha256").toString("hex");
  return `pbkdf2_sha256$${PASSWORD_ITERATIONS}$${salt}$${key}`;
}

export function verifyPassword(password: string, encoded: string): boolean {
  const [algorithm, iterationsValue, salt, expectedHex] = encoded.split("$");
  const iterations = Number(iterationsValue);
  if (algorithm !== "pbkdf2_sha256" || !salt || !expectedHex || !Number.isSafeInteger(iterations)) return false;

  try {
    const expected = Buffer.from(expectedHex, "hex");
    const actual = pbkdf2Sync(password, salt, iterations, expected.length, "sha256");
    return expected.length > 0 && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function normalizeRole(role: unknown): UserRole {
  return VALID_ROLES.includes(role as UserRole) ? (role as UserRole) : "admin";
}
