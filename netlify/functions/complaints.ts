import { getStore } from "@netlify/blobs";
import { hotelBranches } from "../../src/data/hotels";
import { BRAND_PREFIX, COMPLAINT_CATEGORIES, DEFAULT_WHATSAPP_TEMPLATE, applyTemplate } from "../../src/lib/enterpriseProtocol";
import { json, validateSession } from "./_shared/security";
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

const clean = (value: unknown, maxLength: number) => String(value || "").trim().slice(0, maxLength);
const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);

function isAllowedWebhookUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".local") || host === "0.0.0.0" || host === "127.0.0.1" || host === "::1") return false;
    if (/^10\.|^192\.168\.|^169\.254\.|^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
    return true;
  } catch {
    return false;
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
  const settings = ((await getStore("settings").get("site", { type: "json" })) as { complaintEmail?: string; complaintEmailWebhook?: string; complaintWhatsappNumber?: string } | null) || {};
  const webhook = settings.complaintEmailWebhook || Netlify.env.get("COMPLAINT_EMAIL_WEBHOOK");
  const recipient = settings.complaintEmail || Netlify.env.get("COMPLAINT_EMAIL_TO") || "";
  if (!webhook || !recipient) return { sent: false, reason: "webhook_or_recipient_missing" };
  if (!isAllowedWebhookUrl(webhook)) return { sent: false, reason: "invalid_webhook_url" };

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
    const session = await validateSession(req);
    if (!session) return json({ error: "Unauthorized" }, 401);
    const branches = Array.from(new Set(hotelBranches.map((b) => `${b.name} - ${b.city}`))).sort((a, b) => a.localeCompare(b, "ar"));
    return json({ complaints: items, categories: COMPLAINT_CATEGORIES, branches });
  }

  if (req.method === "POST") {
    const settings = ((await getStore("settings").get("site", { type: "json" })) as { complaintWhatsappNumber?: string } | null) || {};
    const body = (await req.json().catch(() => ({}))) as Partial<Complaint>;
    const requestedBrand = clean(body.brand, 30) as keyof typeof BRAND_PREFIX;
    const brand = requestedBrand in BRAND_PREFIX ? requestedBrand : "Boudl";
    const complaintNo = await nextComplaintNo(brand);

    const complaint: Complaint = {
      complaintNo,
      brand,
      branch: clean(body.branch, 150),
      mainCategory: clean(body.mainCategory, 100),
      subCategory: clean(body.subCategory, 100),
      priority: clean(body.priority || "normal", 30),
      guestName: clean(body.guestName, 120),
      bookingMobile: clean(body.bookingMobile, 30),
      contactMobile: clean(body.contactMobile, 30),
      suiteNumber: clean(body.suiteNumber, 30),
      checkInDate: clean(body.checkInDate, 20),
      notes: clean(body.notes, 2000),
      status: "open",
      createdAt: new Date().toISOString(),
    };

    if (!complaint.branch || !complaint.mainCategory || !complaint.guestName || !complaint.contactMobile) {
      return json({ error: "Missing required complaint fields" }, 400);
    }

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
      inHouse: complaint.checkInDate ? "نعم" : "غير محدد",
      urgency: complaint.priority,
    };

    const whatsappMessage = `${applyTemplate(DEFAULT_WHATSAPP_TEMPLATE, values)}\n\nرقم الشكوى: ${complaint.complaintNo}\nالعلامة: ${complaint.brand}\nالفرع: ${complaint.branch}\nاسم الضيف: ${complaint.guestName}\nجوال الحجز: ${complaint.bookingMobile}\nجوال التواصل: ${complaint.contactMobile}\nرقم السويت: ${complaint.suiteNumber}\nتاريخ الدخول: ${complaint.checkInDate}\nالأولوية: ${complaint.priority}\nالملاحظات: ${complaint.notes}`;
    const targetNumber = String(settings.complaintWhatsappNumber || "").replace(/\D/g, "");
    const whatsappUrl = targetNumber
      ? `https://wa.me/${targetNumber}?text=${encodeURIComponent(whatsappMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

    const emailHtml = `<h3>شكوى ${escapeHtml(complaint.complaintNo)}</h3><p>${escapeHtml(whatsappMessage).replace(/\n/g, "<br>")}</p>`;
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
