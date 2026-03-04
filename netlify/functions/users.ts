import { getStore } from "@netlify/blobs";

const VALID_ROLES = ["superadmin", "admin", "editor", "viewer"];

type User = { username: string; password: string; role: string };
type Session = { username: string; role: string };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function validateSession(req: Request): Promise<Session | null> {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "").trim();
  if (!token) return null;

  const sessionStore = getStore({ name: "sessions", consistency: "strong" });
  try {
    const session = await sessionStore.get(`sess_${token}`, { type: "json" });
    return session as Session | null;
  } catch {
    return null;
  }
}

function hasPermission(role: string, action: string): boolean {
  const perms: Record<string, string[]> = {
    superadmin: ["view_users", "add_user", "delete_user"],
    admin: ["view_users", "add_user"],
    editor: ["view_users"],
    viewer: ["view_users"],
  };
  return perms[role]?.includes(action) ?? false;
}

export default async (req: Request) => {
  const session = await validateSession(req);
  if (!session) return json({ error: "Unauthorized" }, 401);

  const method = req.method;
  const userStore = getStore({ name: "users", consistency: "strong" });

  if (method === "GET") {
    if (!hasPermission(session.role, "view_users")) {
      return json({ error: "Permission Denied" }, 403);
    }
    try {
      const users = ((await userStore.get("all", { type: "json" })) as User[]) || [];
      const safeUsers = users.map((u) => ({
        username: u.username,
        role: u.role || "admin",
      }));
      return json({ users: safeUsers });
    } catch {
      return json({ users: [] });
    }
  }

  if (method === "POST") {
    if (!hasPermission(session.role, "add_user")) {
      return json({ error: "Permission Denied" }, 403);
    }

    let body: { username?: string; password?: string; role?: string };
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid request" }, 400);
    }

    const { username, password, role } = body;
    if (!username?.trim() || !password?.trim()) {
      return json({ error: "Username and password required" }, 400);
    }
    if (!role || !VALID_ROLES.includes(role)) {
      return json({ error: "Invalid role" }, 400);
    }

    let users: User[] = [];
    try {
      users = ((await userStore.get("all", { type: "json" })) as User[]) || [];
    } catch {
      users = [];
    }

    if (users.some((u) => u.username === username.trim())) {
      return json({ error: "Username already exists" }, 409);
    }

    users.push({ username: username.trim(), password: password.trim(), role });
    await userStore.setJSON("all", users);
    return json({ ok: true });
  }

  if (method === "DELETE") {
    if (!hasPermission(session.role, "delete_user")) {
      return json({ error: "Permission Denied" }, 403);
    }

    let body: { username?: string };
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid request" }, 400);
    }

    const { username } = body;
    if (!username?.trim()) {
      return json({ error: "Username required" }, 400);
    }
    if (username.trim() === "admin") {
      return json({ error: "Cannot delete default admin" }, 400);
    }

    let users: User[] = [];
    try {
      users = ((await userStore.get("all", { type: "json" })) as User[]) || [];
    } catch {
      return json({ error: "Server error" }, 500);
    }

    const filtered = users.filter((u) => u.username !== username.trim());
    await userStore.setJSON("all", filtered);
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
};
