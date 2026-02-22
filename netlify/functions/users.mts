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

function getAuthSession(
  req: Request
): { username: string; role: string } | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.slice(7);
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payload, sig] = parts;
    const expected = createHmac("sha256", getSecret())
      .update(payload)
      .digest("hex");
    if (sig !== expected) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return null;
  }
}

async function getUsers(): Promise<User[]> {
  const store = getStore({ name: "users", consistency: "strong" });
  const users = (await store.get("all", { type: "json" })) as User[] | null;
  if (!users || !Array.isArray(users) || users.length === 0) {
    await store.setJSON("all", [DEFAULT_USER]);
    return [DEFAULT_USER];
  }
  return users;
}

export default async (req: Request, context: Context) => {
  const session = getAuthSession(req);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (req.method === "GET") {
    if (!["superadmin", "admin"].includes(session.role)) {
      return Response.json({ error: "Permission denied" }, { status: 403 });
    }
    const users = await getUsers();
    const safeUsers = users.map(({ username, role }) => ({ username, role }));
    return Response.json({ users: safeUsers });
  }

  if (req.method === "POST") {
    if (!["superadmin", "admin"].includes(session.role)) {
      return Response.json({ error: "Permission denied" }, { status: 403 });
    }

    let body: Record<string, string>;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const store = getStore({ name: "users", consistency: "strong" });
    const { action } = body;

    if (action === "add") {
      const { username, password, role } = body;
      if (!username?.trim() || !password?.trim() || !role) {
        return Response.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }
      const validRoles = ["superadmin", "admin", "editor", "viewer"];
      if (!validRoles.includes(role)) {
        return Response.json({ error: "Invalid role" }, { status: 400 });
      }
      if (
        ["superadmin", "admin"].includes(role) &&
        session.role !== "superadmin"
      ) {
        return Response.json({ error: "Permission denied" }, { status: 403 });
      }

      const users = await getUsers();
      if (users.some((u) => u.username === username.trim())) {
        return Response.json(
          { error: "Username already exists" },
          { status: 409 }
        );
      }

      users.push({
        username: username.trim(),
        password: password.trim(),
        role: role as User["role"],
      });
      await store.setJSON("all", users);
      return Response.json({ success: true });
    }

    if (action === "delete") {
      const { username } = body;
      if (!username) {
        return Response.json(
          { error: "Missing username" },
          { status: 400 }
        );
      }
      if (username === "admin") {
        return Response.json(
          { error: "Cannot delete default admin" },
          { status: 400 }
        );
      }
      if (session.role !== "superadmin") {
        return Response.json({ error: "Permission denied" }, { status: 403 });
      }

      const users = await getUsers();
      const filtered = users.filter((u) => u.username !== username);
      await store.setJSON("all", filtered);
      return Response.json({ success: true });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
};

export const config: Config = {
  path: "/api/users",
};
