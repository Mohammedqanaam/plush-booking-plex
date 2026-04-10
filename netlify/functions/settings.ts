import { getStore } from "@netlify/blobs";

type Session = { username: string; role: string };
type SiteSettings = {
  siteTitle: string;
  bannerText: string;
  reportMonth: string;
  reportYear: string;
  hiddenEmployees: string[];
  employeeAliases: Record<string, string>;
  employeeAdjustments: Record<string, Record<string, string | number>>;
  complaintEmail: string;
  complaintEmailWebhook: string;
  complaintWhatsappNumber: string;
};

const DEFAULT_SETTINGS: SiteSettings = {
  siteTitle: "Worm-AI",
  bannerText: "",
  reportMonth: "",
  reportYear: "",
  hiddenEmployees: [],
  employeeAliases: {},
  employeeAdjustments: {},
  complaintEmail: "",
  complaintEmailWebhook: "",
  complaintWhatsappNumber: "",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

async function validateSession(req: Request): Promise<Session | null> {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim();
  if (!token) return null;
  try {
    return (await getStore({ name: "sessions", consistency: "strong" }).get(`sess_${token}`, { type: "json" })) as Session | null;
  } catch {
    return null;
  }
}

export default async (req: Request) => {
  const store = getStore("settings");

  if (req.method === "GET") {
    const current = ((await store.get("site", { type: "json" })) as Partial<SiteSettings> | null) || {};
    return json({ ...DEFAULT_SETTINGS, ...current });
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
      employeeAliases:
        body.employeeAliases && typeof body.employeeAliases === "object"
          ? Object.fromEntries(Object.entries(body.employeeAliases).map(([key, value]) => [String(key), String(value)]))
          : current.employeeAliases,
      employeeAdjustments:
        body.employeeAdjustments && typeof body.employeeAdjustments === "object"
          ? Object.fromEntries(
              Object.entries(body.employeeAdjustments).map(([key, value]) => [
                String(key),
                typeof value === "object" && value !== null ? (value as Record<string, string | number>) : {},
              ]),
            )
          : current.employeeAdjustments,
      complaintEmail: body.complaintEmail !== undefined ? String(body.complaintEmail) : current.complaintEmail,
      complaintEmailWebhook: body.complaintEmailWebhook !== undefined ? String(body.complaintEmailWebhook) : current.complaintEmailWebhook,
      complaintWhatsappNumber: body.complaintWhatsappNumber !== undefined ? String(body.complaintWhatsappNumber) : current.complaintWhatsappNumber,
    };

    await store.setJSON("site", updated);
    return json(updated);
  }

  return json({ error: "Method not allowed" }, 405);
};
