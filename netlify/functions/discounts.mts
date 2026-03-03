import type { Context } from "@netlify/functions";

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

export default async (req: Request, context: Context) => {
  const store = context.blobs.getStore("discounts_store");
  const url = new URL(req.url);
  const method = req.method;

  if (method === "GET") {
    const brand = (url.searchParams.get("brand") || "").trim();
    if (!brand) return json({ error: "Brand required" }, 400);

    const data = ((await store.get(brand, { type: "json" })) as DiscountItem[] | null) || [];
    return json(data);
  }

  if (method === "POST") {
    let body: Partial<{ brand: string; sector_name: string; discount_percentage: number | string }>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid request body" }, 400);
    }

    const brand = String(body.brand || "").trim();
    const sectorName = String(body.sector_name || "").trim();
    const discountPercentage = Number(body.discount_percentage);

    if (!brand || !sectorName || Number.isNaN(discountPercentage)) {
      return json({ error: "Missing fields" }, 400);
    }

    const existing = ((await store.get(brand, { type: "json" })) as DiscountItem[] | null) || [];
    const item: DiscountItem = {
      id: crypto.randomUUID(),
      sector_name: sectorName,
      discount_percentage: discountPercentage,
      created_at: new Date().toISOString(),
    };

    existing.push(item);
    await store.setJSON(brand, existing);

    return json({ success: true, item });
  }

  return json({ error: "Method not allowed" }, 405);
};

export const config = {
  path: "/api/discounts",
};
