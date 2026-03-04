import { getStore } from "@netlify/blobs";

type ErrorLog = {
  id: string;
  source: string;
  message: string;
  context?: unknown;
  createdAt: string;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

export default async (req: Request) => {
  const store = getStore({ name: "errors_store", consistency: "strong" });

  if (req.method === "GET") {
    const errors = ((await store.get("all", { type: "json" })) as ErrorLog[]) || [];
    return json({ errors });
  }

  if (req.method === "POST") {
    const body = (await req.json()) as Omit<ErrorLog, "id" | "createdAt">;
    const record: ErrorLog = { ...body, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const existing = ((await store.get("all", { type: "json" })) as ErrorLog[]) || [];
    existing.unshift(record);
    await store.setJSON("all", existing.slice(0, 1000));
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
};
