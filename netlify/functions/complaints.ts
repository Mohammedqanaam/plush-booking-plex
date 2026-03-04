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
  const recipient = process.env.COMPLAINT_EMAIL_TO || "x2yy@icloud.com";

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: recipient,
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
      inHouse: complaint.inHouse === "Yes" ? "نعم" : "لا",
      urgency: complaint.urgency ? "عاجلة" : "عادية",
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
};
