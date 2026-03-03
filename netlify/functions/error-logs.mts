import { getStore } from "@netlify/blobs";

type Session = { username: string; role: string };

type ErrorLog = {
  id: string;
  source: string;
  message: string;
  context?: string;
  createdAt: string;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function validateSession(req: Request): Promise<Session | null> {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim();
  if (!token) return null;
  const store = getStore({ name: "sessions", consistency: "strong" });
  try {
    return (await store.get(`sess_${token}`, { type: "json" })) as Session | null;
  } catch {
    return null;
  }
}

export default async (req: Request) => {
  const store = getStore("errors_store");
  const logs = ((await store.get("items", { type: "json" })) as ErrorLog[] | null) || [];

  if (req.method === "POST") {
    const body = (await req.json().catch(() => ({}))) as Partial<ErrorLog>;
    const log: ErrorLog = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      source: String(body.source || "unknown"),
      message: String(body.message || "unknown_error"),
      context: body.context ? String(body.context) : undefined,
      createdAt: new Date().toISOString(),
    };
    logs.unshift(log);
    await store.setJSON("items", logs.slice(0, 2000));
    return json({ log }, 201);
  }

  const session = await validateSession(req);
  if (!session || !["superadmin", "admin"].includes(session.role)) return json({ error: "Unauthorized" }, 401);

  if (req.method === "GET") return json({ logs });

  return json({ error: "Method not allowed" }, 405);
};
