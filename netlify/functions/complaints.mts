import { getStore } from "@netlify/blobs";
import {
  BRAND_PREFIX,
  COMPLAINT_CATEGORIES,
  DEFAULT_WHATSAPP_TEMPLATE,
  applyTemplate,
} from "../../src/lib/enterpriseProtocol";
import { hotelBranches } from "../../src/data/hotels";

type Brand = keyof typeof BRAND_PREFIX;
type ComplaintStatus = "جديدة" | "جاري المتابعة" | "تم الحل" | "مؤرشف";

type Session = { username: string; role: string };

type Complaint = {
  complaintNo: string;
  brand: Brand;
  branch: string;
  mainCategory: string;
  subCategory: string;
  urgency: boolean;
  guestName: string;
  bookingMobile: string;
  contactMobile: string;
  suiteNumber: string;
  checkInDate: string;
  inHouse: "Yes" | "No";
  notes: string;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
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

  const englishMap: Record<string, ComplaintStatus> = {
    open: "جديدة",
    new: "جديدة",
    "in progress": "جاري المتابعة",
    in_progress: "جاري المتابعة",
    followup: "جاري المتابعة",
    resolved: "تم الحل",
    closed: "تم الحل",
    solved: "تم الحل",
    archived: "مؤرشف",
    archive: "مؤرشف",
  };

  return englishMap[cleaned.toLowerCase()] || null;
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

async function ensureAdmin(req: Request) {
  const session = await validateSession(req);
  if (!session) return { ok: false as const, response: json({ error: "Unauthorized" }, 401) };
  if (!["superadmin", "admin"].includes(session.role)) {
    return { ok: false as const, response: json({ error: "Permission Denied" }, 403) };
  }
  return { ok: true as const };
}

async function nextComplaintNo(brand: Brand) {
  const counters = getStore("complaint_counters");
  const key = `counter_${brand}`;
  const current = ((await counters.get(key, { type: "json" })) as number | null) || 0;
  const next = current + 1;
  await counters.setJSON(key, next);
  return `${BRAND_PREFIX[brand]}-${String(next).padStart(5, "0")}`;
}

async function sendComplaintEmailCopy(complaint: Complaint, html: string) {
  const webhook = process.env.COMPLAINT_EMAIL_WEBHOOK;
  if (!webhook) return { sent: false, reason: "webhook_not_configured" };

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: "mohammedqanaam@gmail.com",
        subject: `Complaint ${complaint.complaintNo} - ${complaint.brand}`,
        html,
        complaint,
      }),
    });
    return { sent: res.ok, status: res.status };
  } catch {
    return { sent: false, reason: "request_failed" };
  }
}

export default async (req: Request) => {
  const store = getStore("complaints");

  if (req.method === "GET") {
    const items = ((await store.get("items", { type: "json" })) as Complaint[] | null) || [];
    const complaints = items.map((item) => ({ ...item, status: item.status || "جديدة" }));

    const branches = Array.from(new Set(hotelBranches.map((b) => `${b.name} - ${b.city}`))).sort((a, b) =>
      a.localeCompare(b, "ar"),
    );
    return json({ complaints, categories: COMPLAINT_CATEGORIES, branches });
  }

  if (req.method === "POST") {
    const body = (await req.json().catch(() => ({}))) as Partial<Complaint>;
    const brand = (body.brand || "Boudl") as Brand;
    const complaintNo = await nextComplaintNo(brand);

    const now = new Date().toISOString();
    const complaint: Complaint = {
      complaintNo,
      brand,
      branch: String(body.branch || "").trim(),
      mainCategory: String(body.mainCategory || "").trim(),
      subCategory: String(body.subCategory || "").trim(),
      urgency: Boolean(body.urgency),
      guestName: String(body.guestName || "").trim(),
      bookingMobile: String(body.bookingMobile || "").trim(),
      contactMobile: String(body.contactMobile || "").trim(),
      suiteNumber: String(body.suiteNumber || "").trim(),
      checkInDate: String(body.checkInDate || "").trim(),
      inHouse: body.inHouse === "No" ? "No" : "Yes",
      notes: String(body.notes || "").trim(),
      status: "جديدة",
      createdAt: now,
      updatedAt: now,
    };

    if (!complaint.branch || !complaint.mainCategory || !complaint.subCategory || !complaint.guestName) {
      return json({ error: "Missing required fields" }, 400);
    }

    const items = ((await store.get("items", { type: "json" })) as Complaint[] | null) || [];
    items.unshift(complaint);
    await store.setJSON("items", items.slice(0, 5000));

    const values = {
      complaintNo: complaint.complaintNo,
      brand: complaint.brand,
      branch: complaint.branch,
      mainCategory: complaint.mainCategory,
      subCategory: complaint.subCategory,
      guestName: complaint.guestName,
      bookingMobile: complaint.bookingMobile,
      suiteNumber: complaint.suiteNumber,
      checkInDate: complaint.checkInDate,
      inHouse: complaint.inHouse,
      urgency: complaint.urgency ? "Urgent" : "Normal",
      contactMobile: complaint.contactMobile,
      notes: complaint.notes,
    };

    const whatsappMessage = applyTemplate(DEFAULT_WHATSAPP_TEMPLATE, values);
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

    const emailHtml = `
      <h3>Complaint ${complaint.complaintNo}</h3>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse">
      ${Object.entries(values)
        .map(([k, v]) => `<tr><td><b>${k}</b></td><td>${v}</td></tr>`)
        .join("")}
      </table>
    `;

    const emailResult = await sendComplaintEmailCopy(complaint, emailHtml);

    return json({ complaint, whatsappMessage, whatsappUrl, emailResult }, 201);
  }

  if (req.method === "PUT") {
    const auth = await ensureAdmin(req);
    if (!auth.ok) return auth.response;

    const body = (await req.json().catch(() => ({}))) as { complaintNo?: string; status?: string };
    const complaintNo = String(body.complaintNo || "").trim();
    const status = normalizeStatus(body.status);

    if (!complaintNo || !status) {
      return json({ error: "complaintNo and valid status are required" }, 400);
    }

    const items = ((await store.get("items", { type: "json" })) as Complaint[] | null) || [];
    const index = items.findIndex((item) => item.complaintNo === complaintNo);
    if (index < 0) return json({ error: "Complaint not found" }, 404);

    const updated = {
      ...items[index],
      status,
      updatedAt: new Date().toISOString(),
    };
    items[index] = updated;
    await store.setJSON("items", items);

    return json({ complaint: updated });
  }

  if (req.method === "DELETE") {
    const auth = await ensureAdmin(req);
    if (!auth.ok) return auth.response;

    const body = (await req.json().catch(() => ({}))) as { complaintNo?: string };
    const complaintNo = String(body.complaintNo || "").trim();
    if (!complaintNo) return json({ error: "complaintNo is required" }, 400);

    const items = ((await store.get("items", { type: "json" })) as Complaint[] | null) || [];
    const next = items.filter((item) => item.complaintNo !== complaintNo);
    if (next.length === items.length) return json({ error: "Complaint not found" }, 404);

    await store.setJSON("items", next);
    return json({ success: true });
  }

  return json({ error: "Method not allowed" }, 405);
};

export const config = {
  path: "/api/complaints",
};
