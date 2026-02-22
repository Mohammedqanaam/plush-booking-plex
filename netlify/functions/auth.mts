import { getStore } from "@netlify/blobs";
import { createHmac } from "node:crypto";
import type { Config, Context } from "@netlify/functions";

interface User {
  username: string;
  password: string;
  role: "superadmin" | "admin" | "editor" | "viewer";
}

const DEFAULT_USER: User = {
  username: "admin",
  password: "Worm@2026",
  role: "superadmin",
};

function getSecret(): string {
  return Netlify.env.get("ADMIN_SECRET") || "worm-ai-default-secret-2026";
}

function createToken(username: string, role: string): string {
  const payload = Buffer.from(
    JSON.stringify({ username, role, ts: Date.now() })
  ).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

async function ensureDefaultUser(): Promise<User[]> {
  const store = getStore({ name: "users", consistency: "strong" });
  const users = (await store.get("all", { type: "json" })) as User[] | null;
  if (!users || !Array.isArray(users) || users.length === 0) {
    const defaultUsers = [DEFAULT_USER];
    await store.setJSON("all", defaultUsers);
    return defaultUsers;
  }
  const hasDefault = users.some((u) => u.username === DEFAULT_USER.username);
  if (!hasDefault) {
    users.push(DEFAULT_USER);
    await store.setJSON("all", users);
  }
  return users;
}

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action } = body;

  if (action === "login") {
    const { username, password } = body;
    if (!username || !password) {
      return Response.json({ error: "Missing credentials" }, { status: 400 });
    }

    const users = await ensureDefaultUser();
    const user = users.find(
      (u) => u.username === username.trim() && u.password === password.trim()
    );
    if (!user) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = createToken(user.username, user.role);
    return Response.json({
      token,
      username: user.username,
      role: user.role,
    });
  }

  if (action === "validate") {
    const { token } = body;
    if (!token) {
      return Response.json({ valid: false }, { status: 401 });
    }
    try {
      const parts = token.split(".");
      if (parts.length !== 2) {
        return Response.json({ valid: false }, { status: 401 });
      }
      const [payload, sig] = parts;
      const expected = createHmac("sha256", getSecret())
        .update(payload)
        .digest("hex");
      if (sig !== expected) {
        return Response.json({ valid: false }, { status: 401 });
      }
      const data = JSON.parse(Buffer.from(payload, "base64url").toString());
      return Response.json({
        valid: true,
        username: data.username,
        role: data.role,
      });
    } catch {
      return Response.json({ valid: false }, { status: 401 });
    }
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
};

export const config: Config = {
  path: "/api/auth",
};
