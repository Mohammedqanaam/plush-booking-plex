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
