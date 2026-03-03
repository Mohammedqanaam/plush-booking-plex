import { getStore } from "@netlify/blobs";

type Session = { username: string; role: string };
<<<<<<< codex/fix-xud2ja
type BrandCode = "Boudl" | "Braira" | "Narcissus" | "Aber";

type Discount = {
  id: string;
  brand: BrandCode;
  title: string;
  percent: number;
  code: string;
  active: boolean;
  assignedEmployee?: string;
=======

type Discount = {
  id: string;
  brand: "Boudl" | "Braira" | "Narcissus" | "Aber";
  title: string;
  percentage: number;
  active: boolean;
  startsAt?: string;
  endsAt?: string;
>>>>>>> codex/add-tailwind-css-integration-a0gjxg
  notes?: string;
  createdAt: string;
};

function json(data: unknown, status = 200) {
<<<<<<< codex/fix-xud2ja
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
=======
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
>>>>>>> codex/add-tailwind-css-integration-a0gjxg
}

async function validateSession(req: Request): Promise<Session | null> {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim();
  if (!token) return null;
<<<<<<< codex/fix-xud2ja
  return (await getStore({ name: "sessions", consistency: "strong" }).get(`sess_${token}`, { type: "json" })) as Session | null;
}

export default async (req: Request) => {
  const store = getStore({ name: "discounts_store", consistency: "strong" });

  if (req.method === "GET") {
    const discounts = ((await store.get("all", { type: "json" })) as Discount[]) || [];
    return json({ discounts });
  }

  const session = await validateSession(req);
  if (!session) return json({ error: "Unauthorized" }, 401);

  if (!["superadmin", "admin", "editor"].includes(session.role)) {
    return json({ error: "Permission Denied" }, 403);
  }

  const discounts = ((await store.get("all", { type: "json" })) as Discount[]) || [];

  if (req.method === "POST") {
    const body = (await req.json()) as Omit<Discount, "id" | "createdAt">;
    const newDiscount: Discount = {
      ...body,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    discounts.unshift(newDiscount);
    await store.setJSON("all", discounts);
    return json({ ok: true, discount: newDiscount });
  }

  if (req.method === "PUT") {
    const body = (await req.json()) as Partial<Discount> & { id: string };
    const index = discounts.findIndex((d) => d.id === body.id);
    if (index < 0) return json({ error: "Not found" }, 404);
    discounts[index] = { ...discounts[index], ...body };
    await store.setJSON("all", discounts);
    return json({ ok: true, discount: discounts[index] });
  }

  if (req.method === "DELETE") {
    const { id } = (await req.json()) as { id?: string };
    await store.setJSON(
      "all",
      discounts.filter((d) => d.id !== id)
=======

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
>>>>>>> codex/add-tailwind-css-integration-a0gjxg
    );
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
};
