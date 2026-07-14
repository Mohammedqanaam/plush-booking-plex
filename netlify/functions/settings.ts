import { getStore } from "@netlify/blobs";
import { json, validateSession } from "./_shared/security";
type SiteSettings = {
  siteTitle: string;
  bannerText: string;
  reportMonth: string;
  reportYear: string;
  hiddenEmployees: string[];
  complaintEmail: string;
  complaintEmailWebhook: string;
  complaintWhatsappNumber: string;
  employeeAdjustments: Record<string, {
    confirmedAdjustment?: number;
    cancelledAdjustment?: number;
    adjustmentReason?: string;
    notes?: string;
    updatedBy?: string;
    updatedAt?: string;
  }>;
};

const DEFAULT_SETTINGS: SiteSettings = {
  siteTitle: "Worm-AI",
  bannerText: "",
  reportMonth: "",
  reportYear: "",
  hiddenEmployees: [],
  complaintEmail: "",
  complaintEmailWebhook: "",
  complaintWhatsappNumber: "",
  employeeAdjustments: {},
};

export default async (req: Request) => {
  const store = getStore("settings");

  if (req.method === "GET") {
    const current = ((await store.get("site", { type: "json" })) as Partial<SiteSettings> | null) || {};
    const settings = { ...DEFAULT_SETTINGS, ...current };
    const session = await validateSession(req);
    if (session) return json(settings);
    return json({
      siteTitle: settings.siteTitle,
      bannerText: settings.bannerText,
      reportMonth: settings.reportMonth,
      reportYear: settings.reportYear,
    });
  }

  if (req.method === "PUT") {
    const session = await validateSession(req);
    if (!session) return json({ error: "Unauthorized" }, 401);
    if (!["superadmin", "admin", "editor"].includes(session.role)) return json({ error: "Permission Denied" }, 403);

    const body = (await req.json().catch(() => ({}))) as Partial<SiteSettings>;
    const current = ((await store.get("site", { type: "json" })) as SiteSettings | null) || DEFAULT_SETTINGS;

    const updated: SiteSettings = {
      siteTitle: body.siteTitle !== undefined ? String(body.siteTitle) : current.siteTitle,
      bannerText: body.bannerText !== undefined ? String(body.bannerText) : current.bannerText,
      reportMonth: body.reportMonth !== undefined ? String(body.reportMonth) : current.reportMonth,
      reportYear: body.reportYear !== undefined ? String(body.reportYear) : current.reportYear,
      hiddenEmployees: Array.isArray(body.hiddenEmployees) ? body.hiddenEmployees.map(String) : current.hiddenEmployees,
      complaintEmail: body.complaintEmail !== undefined ? String(body.complaintEmail) : current.complaintEmail,
      complaintEmailWebhook: body.complaintEmailWebhook !== undefined ? String(body.complaintEmailWebhook) : current.complaintEmailWebhook,
      complaintWhatsappNumber: body.complaintWhatsappNumber !== undefined ? String(body.complaintWhatsappNumber) : current.complaintWhatsappNumber,
      employeeAdjustments: typeof body.employeeAdjustments === "object" && body.employeeAdjustments ? body.employeeAdjustments : current.employeeAdjustments,
    };

    await store.setJSON("site", updated);
    return json(updated);
  }

  return json({ error: "Method not allowed" }, 405);
};
