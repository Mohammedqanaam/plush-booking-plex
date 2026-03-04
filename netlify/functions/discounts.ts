import { getStore } from "@netlify/blobs";

type Session = { username: string; role: string };

type Discount = {
  id: string;
  brand: "Boudl" | "Braira" | "Narcissus" | "Aber";
  title: string;
  percentage: number;
  active: boolean;
  startsAt?: string;
  endsAt?: string;
  notes?: string;
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

  const sessionStore = getStore({ name: "sessions", consistency: "strong" });
  try {
    return (await sessionStore.get(`sess_${token}`, { type: "json" })) as Session | null;
  } catch {
    return null;
  }
}

export default async (req: Request) => {
  const store = getStore("discounts");
  const items = ((await store.get("items", { type: "json" })) as Discount[] | null) || [];

  if (req.method === "GET") {
    return json({ discounts: items });
  }

  const session = await validateSession(req);
  if (!session || !["superadmin", "admin", "editor"].includes(session.role)) {
    return json({ error: "Unauthorized" }, 401);
  }

  if (req.method === "POST") {
    const body = (await req.json().catch(() => ({}))) as Partial<Discount>;
    const discount: Discount = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      brand: (body.brand || "Boudl") as Discount["brand"],
      title: String(body.title || "").trim(),
      percentage: Number(body.percentage || 0),
      active: body.active !== false,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      notes: body.notes,
      createdAt: new Date().toISOString(),
    };
    items.unshift(discount);
    await store.setJSON("items", items);
    return json({ discount }, 201);
  }

  if (req.method === "PUT") {
    const body = (await req.json().catch(() => ({}))) as Partial<Discount>;
    const id = String(body.id || "");
    const index = items.findIndex((d) => d.id === id);
    if (index === -1) return json({ error: "Not found" }, 404);
    items[index] = { ...items[index], ...body, id: items[index].id } as Discount;
    await store.setJSON("items", items);
    return json({ discount: items[index] });
  }

  if (req.method === "DELETE") {
    const body = (await req.json().catch(() => ({}))) as { id?: string };
    const id = String(body.id || "");
    await store.setJSON(
      "items",
      items.filter((d) => d.id !== id),
    );
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
};
