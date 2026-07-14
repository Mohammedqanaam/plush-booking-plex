import { getStore } from "@netlify/blobs";
import { randomBytes } from "node:crypto";
import {
  createSession,
  getBearerToken,
  hashPassword,
  json,
  normalizeRole,
  validateSession,
  verifyPassword,
  type UserRole,
} from "./_shared/security";

type StoredUser = {
  username: string;
  role: UserRole;
  password?: string;
  passwordHash?: string;
};

async function ensureDefaultUser() {
  const store = getStore({ name: "users", consistency: "strong" });
  try {
    const data = await store.get("all", { type: "json" });
    if (Array.isArray(data) && data.length > 0) return;
  } catch {
    // store empty or not yet initialised – proceed to seed default user
  }
  const username = Netlify.env.get("ADMIN_USERNAME")?.trim();
  const password = Netlify.env.get("ADMIN_PASSWORD")?.trim();
  if (!username || !password || password.length < 12) return false;
  await store.setJSON("all", [{ username, passwordHash: hashPassword(password), role: "superadmin" }]);
  return true;
}

export default async (req: Request) => {
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

    const seeded = await ensureDefaultUser();

    const userStore = getStore({ name: "users", consistency: "strong" });
    let users: StoredUser[];
    try {
      users = (await userStore.get("all", { type: "json" })) as typeof users;
      if (!Array.isArray(users)) users = [];
    } catch {
      return json({ error: "Server error" }, 500);
    }

    if (!users.length && !seeded) {
      return json({ error: "Administrator setup required" }, 503);
    }

    const user = users.find((u) => u.username === username.trim());
    const passwordIsValid = user
      ? user.passwordHash
        ? verifyPassword(password, user.passwordHash)
        : typeof user.password === "string" && user.password === password
      : false;
    if (!user || !passwordIsValid) {
      return json({ error: "Invalid credentials" }, 401);
    }

    // Upgrade legacy plain-text records immediately after a successful login.
    if (!user.passwordHash) {
      const index = users.findIndex((candidate) => candidate.username === user.username);
      users[index] = {
        username: user.username,
        role: normalizeRole(user.role),
        passwordHash: hashPassword(password),
      };
      await userStore.setJSON("all", users);
    }

    const token = randomBytes(32).toString("hex");
    const role = normalizeRole(user.role);
    const session = createSession(user.username, role);
    const sessionStore = getStore({ name: "sessions", consistency: "strong" });
    await sessionStore.setJSON(`sess_${token}`, session);

    return json({
      token,
      username: user.username,
      role,
      expiresAt: session.expiresAt,
    });
  }

  if (method === "GET") {
    const session = await validateSession(req);
    if (!session) return json({ error: "Invalid session" }, 401);
    return json(session);
  }

  if (method === "DELETE") {
    const token = getBearerToken(req);
    if (token) {
      const sessionStore = getStore({ name: "sessions", consistency: "strong" });
      try {
        await sessionStore.delete(`sess_${token}`);
      } catch {
        // session already gone – safe to ignore
      }
    }
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
};
