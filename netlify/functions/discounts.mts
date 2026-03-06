import { getStore } from "@netlify/blobs";

const BRANDS = ["Boudl", "Braira", "Narcissus", "Aber"] as const;
type Brand = (typeof BRANDS)[number];

type Session = { username: string; role: string };

type Discount = {
  id: string;
  brand: Brand;
  title: string;
  percentage: number;
  percent?: number;
  code?: string;
  active: boolean;
  startsAt?: string;
  endsAt?: string;
  assignedEmployee?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
};

type DiscountItem = {
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

function normalizeBrand(value: unknown): Brand {
  const raw = String(value || "").trim();
  if (BRANDS.includes(raw as Brand)) return raw as Brand;
  return "Boudl";
}

function normalizePercentage(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
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
  const url = new URL(req.url);

  if (req.method === "GET") {
    const brand = url.searchParams.get("brand")?.trim();

    if (brand) {
      const filtered = items
        .filter((item) => item.brand === brand)
        .map<DiscountItem>((item) => ({
          id: item.id,
          sector_name: item.title,
          discount_percentage: normalizePercentage(item.percentage ?? item.percent),
          created_at: item.createdAt,
        }));
      return json(filtered);
    }

    const session = await validateSession(req);
    if (!session || !["superadmin", "admin", "editor"].includes(session.role)) {
      return json({ error: "Unauthorized" }, 401);
    }
    return json({ discounts: items });
  }

  const session = await validateSession(req);
  if (!session || !["superadmin", "admin", "editor"].includes(session.role)) {
    return json({ error: "Unauthorized" }, 401);
  }

  if (req.method === "POST") {
    const body = (await req.json().catch(() => ({}))) as {
      brand?: unknown;
      title?: unknown;
      sector_name?: unknown;
      percentage?: unknown;
      percent?: unknown;
      discount_percentage?: unknown;
      active?: unknown;
      startsAt?: unknown;
      endsAt?: unknown;
      code?: unknown;
      assignedEmployee?: unknown;
      notes?: unknown;
    };

    const title = String(body.title ?? body.sector_name ?? "").trim();
    const rawPercentage =
      body.percentage ?? body.percent ?? body.discount_percentage;

    const hasValidPercentage =
      typeof rawPercentage === "number"
        ? Number.isFinite(rawPercentage)
        : typeof rawPercentage === "string"
          ? rawPercentage.trim() !== "" &&
            !Number.isNaN(Number(rawPercentage))
          : false;

    if (!title || !hasValidPercentage) {
      return json({ error: "Missing fields" }, 400);
    }

    const percentage = normalizePercentage(rawPercentage);
    const now = new Date().toISOString();
    const discount: Discount = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      brand: normalizeBrand(body.brand),
      title,
      percentage,
      percent: percentage,
      code: body.code ? String(body.code) : undefined,
      active: body.active !== false,
      startsAt: body.startsAt ? String(body.startsAt) : undefined,
      endsAt: body.endsAt ? String(body.endsAt) : undefined,
      assignedEmployee: body.assignedEmployee ? String(body.assignedEmployee) : undefined,
      notes: body.notes ? String(body.notes) : undefined,
      createdAt: now,
      updatedAt: now,
    };

    items.unshift(discount);
    await store.setJSON("items", items);

    return json(
      {
        success: true,
        discount,
        item: {
          id: discount.id,
          sector_name: discount.title,
          discount_percentage: discount.percentage,
          created_at: discount.createdAt,
        },
      },
      201,
    );
  }

  if (req.method === "PUT") {
    const body = (await req.json().catch(() => ({}))) as Partial<Discount>;
    const id = String(body.id || "").trim();
    const index = items.findIndex((d) => d.id === id);

    if (index === -1) return json({ error: "Not found" }, 404);

    const existing = items[index];
    const nextPercentage =
      body.percentage !== undefined
        ? normalizePercentage(body.percentage, existing.percentage)
        : body.percent !== undefined
          ? normalizePercentage(body.percent, existing.percentage)
          : existing.percentage;

    const updated: Discount = {
      ...existing,
      ...body,
      id: existing.id,
      brand: normalizeBrand(body.brand ?? existing.brand),
      percentage: nextPercentage,
      percent: nextPercentage,
      updatedAt: new Date().toISOString(),
    };

    items[index] = updated;
    await store.setJSON("items", items);
    return json({ discount: updated });
  }

  if (req.method === "DELETE") {
    const body = (await req.json().catch(() => ({}))) as { id?: unknown };
    const id = String(body.id || "").trim();

    await store.setJSON(
      "items",
      items.filter((d) => d.id !== id),
    );
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
};

export const config = {
  path: "/api/discounts",
};
