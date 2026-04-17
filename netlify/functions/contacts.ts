import { getStore } from "@netlify/blobs";

type Session = { username: string; role: string };
type ContactRequest = {
  id: string;
  requestNo: string;
  brand: string;
  branchName: string;
  guestName: string;
  guestPhone: string;
  reason: string;
  status: "new" | "done";
  createdAt: string;
};

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

async function getRequests(store: ReturnType<typeof getStore>): Promise<ContactRequest[]> {
  try {
    return ((await store.get("items", { type: "json" })) as ContactRequest[]) || [];
  } catch {
    return [];
  }
}

async function nextRequestNo() {
  const counterStore = getStore("contacts_counter");
  const key = "contact_counter";
  const current = ((await counterStore.get(key, { type: "json" })) as number | null) || 0;
  const next = current + 1;
  await counterStore.setJSON(key, next);
  return `CR-${String(next).padStart(6, "0")}`;
}

export default async (req: Request) => {
  const method = req.method;
  const store = getStore("contacts");

  if (method === "POST") {
    let body: Partial<ContactRequest>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid request" }, 400);
    }

    const brand = String(body.brand || "").trim();
    const branchName = String(body.branchName || "").trim();
    const guestName = String(body.guestName || "").trim();
    const guestPhone = String(body.guestPhone || "").trim();
    const reason = String(body.reason || "").trim();

    if (!brand || !branchName || !guestName || !guestPhone || !reason) {
      return json({ error: "brand, branchName, guestName, guestPhone and reason are required" }, 400);
    }

    const item: ContactRequest = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      requestNo: await nextRequestNo(),
      brand,
      branchName,
      guestName,
      guestPhone,
      reason,
      status: "new",
      createdAt: new Date().toISOString(),
    };

    const items = await getRequests(store);
    items.unshift(item);
    await store.setJSON("items", items.slice(0, 1000));

    return json({ request: item }, 201);
  }

  if (method === "GET") {
    const session = await validateSession(req);
    if (!session) return json({ error: "Unauthorized" }, 401);

    const items = await getRequests(store);
    return json({ requests: items });
  }

  if (method === "PATCH") {
    const session = await validateSession(req);
    if (!session) return json({ error: "Unauthorized" }, 401);

    let body: Partial<ContactRequest>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid request" }, 400);
    }

    const id = String(body.id || "").trim();
    const status = body.status;

    if (!id || (status !== "new" && status !== "done")) {
      return json({ error: "id and valid status are required" }, 400);
    }

    const items = await getRequests(store);
    const index = items.findIndex((v) => v.id === id);
    if (index === -1) return json({ error: "Not found" }, 404);

    const updated = { ...items[index], status };
    items[index] = updated;
    await store.setJSON("items", items);

    return json({ request: updated });
  }

  return json({ error: "Method not allowed" }, 405);
};
