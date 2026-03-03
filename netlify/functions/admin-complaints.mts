import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

type Session = { username: string; role: string };
type ComplaintStatus = "جديدة" | "جاري المتابعة" | "تم الحل" | "مؤرشف";

type ComplaintRecord = {
  complaintNo: string;
  status?: ComplaintStatus;
  [key: string]: unknown;
};

const STATUS_SET = new Set<ComplaintStatus>(["جديدة", "جاري المتابعة", "تم الحل", "مؤرشف"]);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function normalizeStatus(value: unknown): ComplaintStatus | null {
  if (typeof value !== "string") return null;

  const cleaned = value.trim();
  if (STATUS_SET.has(cleaned as ComplaintStatus)) return cleaned as ComplaintStatus;

  const map: Record<string, ComplaintStatus> = {
    open: "جديدة",
    new: "جديدة",
    "in progress": "جاري المتابعة",
    in_progress: "جاري المتابعة",
    closed: "تم الحل",
    solved: "تم الحل",
    resolved: "تم الحل",
    archive: "مؤرشف",
    archived: "مؤرشف",
  };

  return map[cleaned.toLowerCase()] || null;
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

export default async (req: Request, _context: Context) => {
  const store = getStore("complaints");

  const session = await validateSession(req);
  if (!session) return json({ error: "Unauthorized" }, 401);
  if (!["superadmin", "admin"].includes(session.role)) {
    return json({ error: "Permission Denied" }, 403);
  }

  if (req.method === "GET") {
    const data = ((await store.get("items", { type: "json" })) as ComplaintRecord[] | null) || [];
    const normalized = data.map((item) => ({ ...item, status: item.status || "جديدة" }));
    return json(normalized);
  }

  if (req.method === "PATCH") {
    const body = (await req.json().catch(() => ({}))) as { complaintNo?: string; status?: string };
    const complaintNo = String(body.complaintNo || "").trim();
    const status = normalizeStatus(body.status);

    if (!complaintNo || !status) {
      return json({ error: "complaintNo and valid status are required" }, 400);
    }

    const data = ((await store.get("items", { type: "json" })) as ComplaintRecord[] | null) || [];
    const index = data.findIndex((item) => item.complaintNo === complaintNo);
    if (index < 0) return json({ error: "Complaint not found" }, 404);

    const updated = {
      ...data[index],
      status,
      updatedAt: new Date().toISOString(),
    };

    data[index] = updated;
    await store.setJSON("items", data);
    return json({ complaint: updated });
  }

  return json({ error: "Method Not Allowed" }, 405);
};

export const config = {
  path: "/api/admin/complaints",
};
