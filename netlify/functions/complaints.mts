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
  bookingMobile?: string;
  contactMobile: string;
  suiteNumber: string;
  checkInDate: string;
  inHouse: "Yes" | "No";
  notes: string;
  createdAt: string;
};

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

const GROUP_TO_BRAND: Record<string, keyof typeof BRAND_PREFIX> = {
  بودل: "Boudl",
  بريرا: "Braira",
  نارسس: "Narcissus",
  عابر: "Aber",
};

function resolveBrandFromBranch(branch: unknown, fallback?: unknown): keyof typeof BRAND_PREFIX {
  const normalizedBranch = String(branch || "").trim();
  const matchedBranch = hotelBranches.find((item) => `${item.name} - ${item.city}` === normalizedBranch);
  if (matchedBranch?.group && GROUP_TO_BRAND[matchedBranch.group]) {
    return GROUP_TO_BRAND[matchedBranch.group];
  }

  const fallbackBrand = String(fallback || "").trim() as keyof typeof BRAND_PREFIX;
  return BRAND_PREFIX[fallbackBrand] ? fallbackBrand : "Boudl";
}

function buildAdminRecord(complaint: Complaint): ComplaintRecord {
  return {
    id: complaint.complaintNo,
    brand: complaint.brand,
    branch: complaint.branch,
    category: `${complaint.mainCategory}${complaint.subCategory ? ` / ${complaint.subCategory}` : ""}`,
    urgency: complaint.urgency ? "Urgent" : "Normal",
    guest_name: complaint.guestName,
      booking_mobile: complaint.bookingMobile || undefined,
    contact_mobile: complaint.contactMobile || undefined,
    suite_number: complaint.suiteNumber || undefined,
    checkin_date: complaint.checkInDate || undefined,
    guest_in_house: complaint.inHouse === "Yes",
    notes: complaint.notes || undefined,
    status: "Open",
    created_at: complaint.createdAt,
  };
}

async function persistAdminComplaint(complaint: Complaint) {
  const store = getStore("complaints_store");
  const all = ((await store.get("all", { type: "json" })) as ComplaintRecord[] | null) || [];
  all.push(buildAdminRecord(complaint));
  await store.setJSON("all", all);
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
    const brand = resolveBrandFromBranch(body.branch, body.brand);
    const complaintNo = await nextComplaintNo(brand);

    const complaint: Complaint = {
      complaintNo,
      brand,
      branch: String(body.branch || "").trim(),
      mainCategory: String(body.mainCategory || "").trim(),
      subCategory: String(body.subCategory || "").trim(),
      urgency: Boolean(body.urgency),
      guestName: String(body.guestName || "").trim(),
      bookingMobile: String(body.bookingMobile || "").trim() || undefined,
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
    await persistAdminComplaint(complaint);

    const values = {
      complaintNo: complaint.complaintNo,
      brand: complaint.brand,
      branch: complaint.branch,
      mainCategory: complaint.mainCategory,
      subCategory: complaint.subCategory,
      guestName: complaint.guestName,
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

    return json(
      {
        complaint,
        complaintNo: complaint.complaintNo,
        complaint_number: complaint.complaintNo,
        whatsappMessage,
        whatsappUrl,
        emailResult,
      },
      201,
    );
  }

  return json({ error: "Method not allowed" }, 405);
};
