import { getStore } from "@netlify/blobs";
import { json, validateSession } from "./_shared/security";

type ErrorLog = {
  id: string;
  source: string;
  message: string;
  context?: string;
  createdAt: string;
};

export default async (req: Request) => {
  const store = getStore("errors_store");
  const logs = ((await store.get("items", { type: "json" })) as ErrorLog[] | null) || [];

  if (req.method === "POST") {
    const session = await validateSession(req);
    if (!session) return json({ error: "Unauthorized" }, 401);
    const body = (await req.json().catch(() => ({}))) as Partial<ErrorLog>;
    const log: ErrorLog = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      source: String(body.source || "unknown").slice(0, 120),
      message: String(body.message || "unknown_error").slice(0, 500),
      context: body.context ? String(body.context).slice(0, 1000) : undefined,
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
