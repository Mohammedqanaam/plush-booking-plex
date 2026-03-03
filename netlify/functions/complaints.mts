import { getStore } from "@netlify/blobs";
import { hotelBranches } from "../../src/data/hotels";
import {
  BRAND_PREFIX,
  COMPLAINT_CATEGORIES,
  DEFAULT_WHATSAPP_TEMPLATE,
  applyTemplate,
} from "../../src/lib/enterpriseProtocol";

type Complaint = {
  complaintNo: string;
  brand: keyof typeof BRAND_PREFIX;
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
  createdAt: string;
import type { Context } from "@netlify/functions";

type ComplaintStatus = "Open" | "In Progress" | "Closed";

type ComplaintRecord = {
  id: string;
  brand: string;
  branch: string;
  category: string;
  urgency?: string;
  guest_name: string;
  booking_mobile?: string;
  contact_mobile?: string;
  suite_number?: string;
  checkin_date?: string;
  guest_in_house?: boolean;
  notes?: string;
  status: ComplaintStatus;
  created_at: string;
};

const prefixMap: Record<string, string> = {
  Boudl: "BO",
  Braira: "BR",
  Narcissus: "NA",
  Aber: "AB",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
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
    const branches = Array.from(new Set(hotelBranches.map((b) => `${b.name} - ${b.city}`))).sort((a, b) =>
      a.localeCompare(b, "ar"),
    );
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
      urgency: Boolean(body.urgency),
      guestName: String(body.guestName || "").trim(),
      bookingMobile: String(body.bookingMobile || "").trim(),
      contactMobile: String(body.contactMobile || "").trim(),
      suiteNumber: String(body.suiteNumber || "").trim(),
      checkInDate: String(body.checkInDate || "").trim(),
      inHouse: body.inHouse === "No" ? "No" : "Yes",
      notes: String(body.notes || "").trim(),
      createdAt: new Date().toISOString(),
    };

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

  return json({ error: "Method not allowed" }, 405);
function generateComplaintNumber(prefix: string) {
  const random = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${random}`;
}

async function notifyAdminsByEmail(complaint: ComplaintRecord, adminEmails: string[]) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey || !adminEmails.length) return;

  const to = adminEmails.map((v) => v.trim()).filter(Boolean);
  if (!to.length) return;

  const subject = `شكوى جديدة ${complaint.id} - ${complaint.brand}`;
  const html = `
    <h3>شكوى جديدة</h3>
    <p><strong>الرقم:</strong> ${complaint.id}</p>
    <p><strong>العلامة:</strong> ${complaint.brand}</p>
    <p><strong>الفرع:</strong> ${complaint.branch}</p>
    <p><strong>العميل:</strong> ${complaint.guest_name}</p>
    <p><strong>الفئة:</strong> ${complaint.category}</p>
    <p><strong>الأولوية:</strong> ${complaint.urgency || "-"}</p>
    <p><strong>الملاحظات:</strong> ${complaint.notes || "-"}</p>
    <p><strong>وقت الإنشاء:</strong> ${complaint.created_at}</p>
  `;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "Complaints <onboarding@resend.dev>",
      to,
      subject,
      html,
    }),
  }).catch(() => null);
}

export default async (req: Request, context: Context) => {
  const store = context.blobs.getStore("complaints_store");

  if (req.method !== "POST") {
    return json({ error: "Method Not Allowed" }, 405);
  }

  let body: Partial<ComplaintRecord>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  const brand = String(body.brand || "").trim();
  const branch = String(body.branch || "").trim();
  const category = String(body.category || "").trim();
  const guestName = String(body.guest_name || "").trim();

  if (!brand || !branch || !category || !guestName) {
    return json({ error: "Missing required fields" }, 400);
  }

  const prefix = prefixMap[brand] || "CM";
  const number = generateComplaintNumber(prefix);

  const complaint: ComplaintRecord = {
    id: number,
    brand,
    branch,
    category,
    urgency: body.urgency ? String(body.urgency) : undefined,
    guest_name: guestName,
    booking_mobile: body.booking_mobile ? String(body.booking_mobile) : undefined,
    contact_mobile: body.contact_mobile ? String(body.contact_mobile) : undefined,
    suite_number: body.suite_number ? String(body.suite_number) : undefined,
    checkin_date: body.checkin_date ? String(body.checkin_date) : undefined,
    guest_in_house: body.guest_in_house === true,
    notes: body.notes ? String(body.notes) : undefined,
    status: "Open",
    created_at: new Date().toISOString(),
  };

  const all = ((await store.get("all", { type: "json" })) as ComplaintRecord[] | null) || [];
  all.push(complaint);
  await store.setJSON("all", all);

  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  await notifyAdminsByEmail(complaint, adminEmails);

  return json({ complaint_number: number }, 201);
};

export const config = {
  path: "/api/complaints",
};
