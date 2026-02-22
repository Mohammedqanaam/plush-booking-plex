import { getStore } from "@netlify/blobs";
import { randomBytes } from "node:crypto";

const DEFAULT_ADMIN = {
  username: "admin",
  password: "Worm@2026",
  role: "superadmin",
};

async function ensureDefaultUser() {
  const store = getStore({ name: "users", consistency: "strong" });
  try {
    const data = await store.get("all", { type: "json" });
    if (Array.isArray(data) && data.length > 0) return;
  } catch {}
  await store.setJSON("all", [DEFAULT_ADMIN]);
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (req: Request) => {
  const secret = process.env.ADMIN_SECRET;
  const method = req.method;

  if (method === "POST") {
    let body: { username?: string; password?: string };
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid request body" }, 400);
    }

    const { username, password } = body;
    if (!username?.trim() || !password?.trim()) {
      return json({ error: "Missing credentials" }, 400);
    }

    await ensureDefaultUser();

    const userStore = getStore({ name: "users", consistency: "strong" });
    let users: { username: string; password: string; role: string }[];
    try {
      users = (await userStore.get("all", { type: "json" })) as typeof users;
      if (!Array.isArray(users)) users = [];
    } catch {
      return json({ error: "Server error" }, 500);
    }

    const user = users.find(
      (u) => u.username === username.trim() && u.password === password.trim()
    );
    if (!user) {
      return json({ error: "Invalid credentials" }, 401);
    }

    const token = randomBytes(32).toString("hex");
    const sessionStore = getStore({ name: "sessions", consistency: "strong" });
    await sessionStore.setJSON(`sess_${token}`, {
      username: user.username,
      role: user.role || "admin",
      createdAt: Date.now(),
    });

    return json({
      token,
      username: user.username,
      role: user.role || "admin",
    });
  }

  if (method === "GET") {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "").trim();
    if (!token) return json({ error: "No token" }, 401);

    const sessionStore = getStore({ name: "sessions", consistency: "strong" });
    try {
      const session = await sessionStore.get(`sess_${token}`, { type: "json" });
      if (!session) return json({ error: "Invalid session" }, 401);
      return json(session);
    } catch {
      return json({ error: "Invalid session" }, 401);
    }
  }

  if (method === "DELETE") {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "").trim();
    if (token) {
      const sessionStore = getStore({ name: "sessions", consistency: "strong" });
      try {
        await sessionStore.delete(`sess_${token}`);
      } catch {}
    }
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
};
