import { getStore } from "@netlify/blobs";
import { hotelBranches } from "../../src/data/hotels";
import { BRAND_PREFIX, COMPLAINT_CATEGORIES, DEFAULT_WHATSAPP_TEMPLATE, applyTemplate } from "../../src/lib/enterpriseProtocol";

type Session = { username: string; role: string };
type ComplaintStatus = "open" | "under_review" | "closed";
type Complaint = {
  complaintNo: string;
  brand: keyof typeof BRAND_PREFIX;
  branch: string;
  mainCategory: string;
  subCategory: string;
  priority: string;
  guestName: string;
  bookingMobile: string;
  contactMobile: string;
  suiteNumber: string;
  checkInDate: string;
  notes: string;
  status: ComplaintStatus;
  createdAt: string;
};

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

async function validateSession(req: Request): Promise<Session | null> {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim();
  if (!token) return null;
  try {
    return (await getStore({ name: "sessions", consistency: "strong" }).get(`sess_${token}`, { type: "json" })) as Session | null;
  } catch {
    return null;
  }
}

async function nextComplaintNo(brand: keyof typeof BRAND_PREFIX) {
  const counters = getStore("complaint_counters");
  const key = `counter_${brand}`;
  const current = ((await counters.get(key, { type: "json" })) as number | null) || 0;
  const next = current + 1;
  await counters.setJSON(key, next);
  return `${BRAND_PREFIX[brand]}-${String(next).padStart(5, "0")}`;
}

async function sendComplaintEmailCopy(complaint: Complaint, html: string) {
  const settings = ((await getStore("settings").get("site", { type: "json" })) as { complaintEmail?: string; complaintEmailWebhook?: string } | null) || {};
  const webhook = settings.complaintEmailWebhook || process.env.COMPLAINT_EMAIL_WEBHOOK;
  const recipient = settings.complaintEmail || process.env.COMPLAINT_EMAIL_TO || "";
  if (!webhook || !recipient) return { sent: false, reason: "webhook_or_recipient_missing" };

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: recipient, subject: `شكوى ${complaint.complaintNo} - ${complaint.brand}`, html, complaint }),
    });
    return { sent: res.ok, status: res.status };
  } catch {
    return { sent: false, reason: "request_failed" };
  }
}

export default async (req: Request) => {
  const store = getStore("complaints");
  const items = ((await store.get("items", { type: "json" })) as Complaint[] | null) || [];

  if (req.method === "GET") {
    const branches = Array.from(new Set(hotelBranches.map((b) => `${b.name} - ${b.city}`))).sort((a, b) => a.localeCompare(b, "ar"));
    return json({ complaints: items, categories: COMPLAINT_CATEGORIES, branches });
  }

  if (req.method === "POST") {
    const body = (await req.json().catch(() => ({}))) as Partial<Complaint>;
    const brand = (body.brand || "Boudl") as keyof typeof BRAND_PREFIX;
    const complaintNo = await nextComplaintNo(brand);

    const complaint: Complaint = {
      complaintNo,
      brand,
      branch: String(body.branch || "").trim(),
      mainCategory: String(body.mainCategory || "").trim(),
      subCategory: String(body.subCategory || "").trim(),
      priority: String(body.priority || "normal").trim(),
      guestName: String(body.guestName || "").trim(),
      bookingMobile: String(body.bookingMobile || "").trim(),
      contactMobile: String(body.contactMobile || "").trim(),
      suiteNumber: String(body.suiteNumber || "").trim(),
      checkInDate: String(body.checkInDate || "").trim(),
      notes: String(body.notes || "").trim(),
      status: "open",
      createdAt: new Date().toISOString(),
    };

    items.unshift(complaint);
    await store.setJSON("items", items.slice(0, 5000));

    const values = {
      complaintNo: complaint.complaintNo,
      brand: complaint.brand,
      branch: complaint.branch,
      guestName: complaint.guestName,
      bookingMobile: complaint.bookingMobile,
      contactMobile: complaint.contactMobile,
      suiteNumber: complaint.suiteNumber,
      checkInDate: complaint.checkInDate,
      priority: complaint.priority,
      notes: complaint.notes,
      mainCategory: complaint.mainCategory,
      subCategory: complaint.subCategory,
    };

    const whatsappMessage = `${applyTemplate(DEFAULT_WHATSAPP_TEMPLATE, values)}\n\nرقم الشكوى: ${complaint.complaintNo}\nالعلامة: ${complaint.brand}\nالفرع: ${complaint.branch}\nاسم الضيف: ${complaint.guestName}\nجوال الحجز: ${complaint.bookingMobile}\nجوال التواصل: ${complaint.contactMobile}\nرقم السويت: ${complaint.suiteNumber}\nتاريخ الدخول: ${complaint.checkInDate}\nالأولوية: ${complaint.priority}\nالملاحظات: ${complaint.notes}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

    const emailHtml = `<h3>شكوى ${complaint.complaintNo}</h3><p>${whatsappMessage.replace(/\n/g, "<br>")}</p>`;
    const emailResult = await sendComplaintEmailCopy(complaint, emailHtml);

    return json({ complaint, whatsappMessage, whatsappUrl, emailResult }, 201);
  }

  if (req.method === "PUT") {
    const session = await validateSession(req);
    if (!session || !["superadmin", "admin", "editor"].includes(session.role)) return json({ error: "Unauthorized" }, 401);
    const body = (await req.json().catch(() => ({}))) as { complaintNo?: string; status?: ComplaintStatus };
    const index = items.findIndex((item) => item.complaintNo === body.complaintNo);
    if (index === -1) return json({ error: "Not found" }, 404);
    const nextStatus: ComplaintStatus = body.status && ["open", "under_review", "closed"].includes(body.status) ? body.status : items[index].status;
    items[index] = { ...items[index], status: nextStatus };
    await store.setJSON("items", items);
    return json({ complaint: items[index] });
  }

  return json({ error: "Method not allowed" }, 405);
};
