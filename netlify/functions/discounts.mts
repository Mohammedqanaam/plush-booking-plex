import { getStore } from "@netlify/blobs";

type Session = { username: string; role: string };
type BrandCode = "Boudl" | "Braira" | "Narcissus" | "Aber";

type Discount = {
  id: string;
  brand: BrandCode;
  title: string;
  percent: number;
  code: string;
  active: boolean;
  assignedEmployee?: string;
  notes?: string;
  createdAt: string;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

async function validateSession(req: Request): Promise<Session | null> {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim();
  if (!token) return null;
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
    );
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
};
