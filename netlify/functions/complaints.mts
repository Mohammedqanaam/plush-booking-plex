import { getStore } from "@netlify/blobs";
<<<<<<< codex/fix-xud2ja

type Session = { username: string; role: string };
type BrandCode = "Boudl" | "Braira" | "Narcissus" | "Aber";

type Complaint = {
  complaintNo: string;
  brand: BrandCode;
  branch: string;
  mainCategory: string;
  subCategory: string;
  urgent: boolean;
  assignedEmployee?: string;
  guestFullName: string;
=======
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
>>>>>>> codex/add-tailwind-css-integration-a0gjxg
  bookingMobile: string;
  contactMobile: string;
  suiteNumber: string;
  checkInDate: string;
  inHouse: "Yes" | "No";
  notes: string;
  createdAt: string;
};

<<<<<<< codex/fix-xud2ja
type EnterpriseSettings = {
  complaint: {
    whatsappTemplate: string;
    emailTemplate: string;
    emailEnabled: boolean;
    escalationThreshold: number;
    slaHours: number;
  };
};

const DEFAULT_TEMPLATE = `Complaint No: {{complaintNo}}\nBrand: {{brand}}\nBranch: {{branch}}\nCategory: {{mainCategory}}\nSub-category: {{subCategory}}\n\nGuest Name: {{guestFullName}}\nBooking Mobile: {{bookingMobile}}\nSuite No: {{suiteNumber}}\nCheck-in Date: {{checkInDate}}\nGuest In-House: {{inHouse}}\nPriority: {{priority}}\nAssigned Employee: {{assignedEmployee}}\n\nPlease handle according to operational protocol.`;

const prefixMap: Record<BrandCode, string> = { Boudl: "BO", Braira: "BR", Narcissus: "NA", Aber: "AB" };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

async function validateSession(req: Request): Promise<Session | null> {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim();
  if (!token) return null;
  return (await getStore({ name: "sessions", consistency: "strong" }).get(`sess_${token}`, { type: "json" })) as Session | null;
}

function renderTemplate(template: string, data: Record<string, string>) {
  return Object.entries(data).reduce((out, [key, value]) => out.replaceAll(`{{${key}}}`, value), template);
}

function buildEmailHtml(complaint: Complaint) {
  return `<div style="font-family:Arial,sans-serif"><h2>Complaint ${complaint.complaintNo}</h2><table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%"><tbody>${Object.entries(complaint)
    .map(([key, value]) => `<tr><td><b>${key}</b></td><td>${String(value)}</td></tr>`)
    .join("")}</tbody></table></div>`;
}

async function sendEmailCopy(complaint: Complaint, settings: EnterpriseSettings) {
  if (!settings.complaint.emailEnabled) return { skipped: true };
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { skipped: true };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "Complaints <onboarding@resend.dev>",
      to: ["mohammedqanaam@gmail.com"],
      subject: `Complaint ${complaint.complaintNo} - ${complaint.brand}`,
      html: buildEmailHtml(complaint),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Email failed: ${text}`);
  }

  return { sent: true };
}

export default async (req: Request) => {
  const method = req.method;
  const store = getStore({ name: "complaints_store", consistency: "strong" });
  const counterStore = getStore({ name: "complaints_counter", consistency: "strong" });
  const settingsStore = getStore("settings");

  if (method === "GET") {
    const complaints = ((await store.get("all", { type: "json" })) as Complaint[]) || [];
    return json({ complaints });
  }

  if (method === "POST") {
    const session = await validateSession(req);
    if (!session) return json({ error: "Unauthorized" }, 401);

    const body = (await req.json()) as Omit<Complaint, "complaintNo" | "createdAt">;
    const prefix = prefixMap[body.brand];
    if (!prefix) return json({ error: "Invalid brand" }, 400);

    const counterKey = `counter_${body.brand}`;
    const currentCounter = Number((await counterStore.get(counterKey)) || "10000") + 1;
    await counterStore.set(counterKey, String(currentCounter));

    const complaintNo = `${prefix}-${String(currentCounter).padStart(5, "0")}`;
    const complaint: Complaint = { ...body, complaintNo, createdAt: new Date().toISOString() };

    const existing = ((await store.get("all", { type: "json" })) as Complaint[]) || [];
    existing.unshift(complaint);
    await store.setJSON("all", existing);

    const settings = ((await settingsStore.get("enterprise", { type: "json" })) as EnterpriseSettings) || {
      complaint: { whatsappTemplate: DEFAULT_TEMPLATE, emailTemplate: "", emailEnabled: true, escalationThreshold: 3, slaHours: 2 },
    };

    const dataMap = {
      complaintNo,
=======
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
>>>>>>> codex/add-tailwind-css-integration-a0gjxg
      brand: complaint.brand,
      branch: complaint.branch,
      mainCategory: complaint.mainCategory,
      subCategory: complaint.subCategory,
<<<<<<< codex/fix-xud2ja
      guestFullName: complaint.guestFullName,
=======
      guestName: complaint.guestName,
>>>>>>> codex/add-tailwind-css-integration-a0gjxg
      bookingMobile: complaint.bookingMobile,
      suiteNumber: complaint.suiteNumber,
      checkInDate: complaint.checkInDate,
      inHouse: complaint.inHouse,
<<<<<<< codex/fix-xud2ja
      priority: complaint.urgent ? "Urgent" : "Normal",
      assignedEmployee: complaint.assignedEmployee || "N/A",
    };

    const whatsappMessage = renderTemplate(settings.complaint.whatsappTemplate || DEFAULT_TEMPLATE, dataMap);

    let emailStatus: { sent?: boolean; skipped?: boolean; error?: string } = { skipped: true };
    try {
      emailStatus = await sendEmailCopy(complaint, settings);
    } catch (error: any) {
      emailStatus = { error: error?.message || "Failed" };
    }

    return json({ ok: true, complaint, whatsappMessage, whatsappLink: `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`, emailStatus });
  }

  const session = await validateSession(req);
  if (!session) return json({ error: "Unauthorized" }, 401);

  if (!["superadmin", "admin", "editor"].includes(session.role)) {
    return json({ error: "Permission Denied" }, 403);
  }

  const complaints = ((await store.get("all", { type: "json" })) as Complaint[]) || [];

  if (method === "PUT") {
    const body = (await req.json()) as Partial<Complaint> & { complaintNo: string };
    const index = complaints.findIndex((item) => item.complaintNo === body.complaintNo);
    if (index < 0) return json({ error: "Not found" }, 404);
    complaints[index] = { ...complaints[index], ...body };
    await store.setJSON("all", complaints);
    return json({ ok: true, complaint: complaints[index] });
  }

  if (method === "DELETE") {
    const body = (await req.json()) as { complaintNo?: string };
    await store.setJSON("all", complaints.filter((item) => item.complaintNo !== body.complaintNo));
    return json({ ok: true });
=======
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
>>>>>>> codex/add-tailwind-css-integration-a0gjxg
  }

  return json({ error: "Method not allowed" }, 405);
};
