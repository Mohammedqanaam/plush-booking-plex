import { getStore } from "@netlify/blobs";

type Session = { username: string; role: string };

type Discount = {
  id: string;
  brand: string;
  title: string;
  percent: number;
  code: string;
  active: boolean;
  assignedEmployee?: string;
  notes?: string;
  createdAt: string;
};

type LegacyDiscountItem = {
  id: string;
  sector_name: string;
  discount_percentage: number;
  created_at: string;
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

function toLegacyItem(discount: Discount): LegacyDiscountItem {
  return {
    id: discount.id,
    sector_name: discount.title,
    discount_percentage: discount.percent,
    created_at: discount.createdAt,
  };
}

export default async (req: Request) => {
  const store = getStore("discounts");
  const items = ((await store.get("items", { type: "json" })) as Discount[] | null) || [];
  const url = new URL(req.url);

  if (req.method === "GET") {
    const brand = (url.searchParams.get("brand") || "").trim();
    if (brand) {
      return json(items.filter((item) => item.brand === brand).map(toLegacyItem));
    }
    return json({ discounts: items });
  }

  const session = await validateSession(req);
  if (!session || !["superadmin", "admin", "editor"].includes(session.role)) {
    return json({ error: "Unauthorized" }, 401);
  }

  if (req.method === "POST") {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const title = String(body.title || body.sector_name || "").trim();
    const percent = Number(body.percent ?? body.percentage ?? body.discount_percentage ?? 0);

    if (!title || Number.isNaN(percent)) {
      return json({ error: "Missing or invalid fields" }, 400);
    }

    const discount: Discount = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      brand: String(body.brand || "Boudl").trim(),
      title,
      percent,
      code: String(body.code || "").trim(),
      active: body.active !== false,
      assignedEmployee: String(body.assignedEmployee || "").trim() || undefined,
      notes: String(body.notes || "").trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    items.unshift(discount);
    await store.setJSON("items", items);

    return json({ success: true, discount, item: toLegacyItem(discount) }, 201);
  }

  if (req.method === "PUT") {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const id = String(body.id || "").trim();
    const index = items.findIndex((item) => item.id === id);

    if (!id || index === -1) {
      return json({ error: "Not found" }, 404);
    }

    const current = items[index];
    const nextPercent = Number(body.percent ?? body.percentage ?? body.discount_percentage ?? current.percent);
    if (Number.isNaN(nextPercent)) {
      return json({ error: "Invalid percentage" }, 400);
    }

    items[index] = {
      ...current,
      brand: String(body.brand ?? current.brand).trim() || current.brand,
      title: String(body.title ?? body.sector_name ?? current.title).trim() || current.title,
      percent: nextPercent,
      code: String(body.code ?? current.code).trim(),
      active: typeof body.active === "boolean" ? body.active : current.active,
      assignedEmployee: body.assignedEmployee === undefined
        ? current.assignedEmployee
        : String(body.assignedEmployee || "").trim() || undefined,
      notes: body.notes === undefined ? current.notes : String(body.notes || "").trim() || undefined,
    };

    await store.setJSON("items", items);
    return json({ discount: items[index], item: toLegacyItem(items[index]) });
  }

  if (req.method === "DELETE") {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const id = String(body.id || "").trim();

    if (!id) {
      return json({ error: "Missing id" }, 400);
    }

    await store.setJSON(
      "items",
      items.filter((item) => item.id !== id),
    );
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
};

export const config = {
  path: "/api/discounts",
};
