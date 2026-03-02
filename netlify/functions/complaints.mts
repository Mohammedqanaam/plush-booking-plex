import { getStore } from "@netlify/blobs";

type Session = { username: string; role: string };
type BrandCode = "Boudl" | "Braira" | "Narcissus" | "Aber";

type Complaint = {
  complaintNo: string;
  brand: BrandCode;
  branch: string;
  mainCategory: string;
  subCategory: string;
  urgent: boolean;
  guestFullName: string;
  bookingMobile: string;
  contactMobile: string;
  suiteNumber: string;
  checkInDate: string;
  inHouse: "Yes" | "No";
  notes: string;
  createdAt: string;
};

type EnterpriseSettings = {
  complaint: {
    whatsappTemplate: string;
    emailTemplate: string;
    emailEnabled: boolean;
    escalationThreshold: number;
    slaHours: number;
  };
};

const DEFAULT_TEMPLATE = `Complaint No: {{complaintNo}}\nBrand: {{brand}}\nBranch: {{branch}}\nCategory: {{mainCategory}}\nSub-category: {{subCategory}}\n\nGuest Name: {{guestFullName}}\nBooking Mobile: {{bookingMobile}}\nSuite No: {{suiteNumber}}\nCheck-in Date: {{checkInDate}}\nGuest In-House: {{inHouse}}\nPriority: {{priority}}\n\nPlease handle according to operational protocol.`;

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
      brand: complaint.brand,
      branch: complaint.branch,
      mainCategory: complaint.mainCategory,
      subCategory: complaint.subCategory,
      guestFullName: complaint.guestFullName,
      bookingMobile: complaint.bookingMobile,
      suiteNumber: complaint.suiteNumber,
      checkInDate: complaint.checkInDate,
      inHouse: complaint.inHouse,
      priority: complaint.urgent ? "Urgent" : "Normal",
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

  return json({ error: "Method not allowed" }, 405);
};
