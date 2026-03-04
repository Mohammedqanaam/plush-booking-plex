import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

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
    return (await sessionStore.get(`sess_${token}`, { type: "json" })) as Session | null;
  } catch {
    return null;
  }
}

export default async (req: Request, context: Context) => {
  const store = context.blobs.getStore("complaints_store");

  if (req.method !== "GET") {
    return json({ error: "Method Not Allowed" }, 405);
  }

  const session = await validateSession(req);
  if (!session) return json({ error: "Unauthorized" }, 401);
  if (!["superadmin", "admin"].includes(session.role)) {
    return json({ error: "Permission Denied" }, 403);
  }

  const data = ((await store.get("all", { type: "json" })) as unknown[]) || [];

  return json(data);
};

export const config = {
  path: "/api/admin/complaints",
};
