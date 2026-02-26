import { getStore } from "@netlify/blobs";

type Session = { username: string; role: string };
type SiteSettings = {
  siteTitle: string;
  bannerText: string;
  reportMonth: string;
  reportYear: string;
  hiddenEmployees: string[];
};

const DEFAULT_SETTINGS: SiteSettings = {
  siteTitle: "Worm-AI",
  bannerText: "",
  reportMonth: "",
  reportYear: "",
  hiddenEmployees: [],
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function validateSession(req: Request): Promise<Session | null> {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "").trim();
  if (!token) return null;

  const sessionStore = getStore({ name: "sessions", consistency: "strong" });
  try {
    return (await sessionStore.get(`sess_${token}`, { type: "json" })) as Session | null;
  } catch {
    return null;
  }
}

export default async (req: Request) => {
  const method = req.method;
  const store = getStore("settings");

  if (method === "GET") {
    try {
      const settings = (await store.get("site", { type: "json" })) as SiteSettings | null;
      return json(settings || DEFAULT_SETTINGS);
    } catch {
      return json(DEFAULT_SETTINGS);
    }
  }

  if (method === "PUT") {
    const session = await validateSession(req);
    if (!session) return json({ error: "Unauthorized" }, 401);

    if (!["superadmin", "admin"].includes(session.role)) {
      return json({ error: "Permission Denied" }, 403);
    }

    let body: Partial<SiteSettings>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid request" }, 400);
    }

    let current: SiteSettings;
    try {
      current = ((await store.get("site", { type: "json" })) as SiteSettings) || DEFAULT_SETTINGS;
    } catch {
      current = DEFAULT_SETTINGS;
    }

    const updated: SiteSettings = {
      siteTitle: body.siteTitle !== undefined ? body.siteTitle : current.siteTitle,
      bannerText: body.bannerText !== undefined ? body.bannerText : current.bannerText,
      reportMonth: body.reportMonth !== undefined ? String(body.reportMonth) : current.reportMonth,
      reportYear: body.reportYear !== undefined ? String(body.reportYear) : current.reportYear,
      hiddenEmployees: Array.isArray(body.hiddenEmployees)
        ? body.hiddenEmployees.map((v) => String(v))
        : current.hiddenEmployees,
    };

    await store.setJSON("site", updated);
    return json(updated);
  }

  return json({ error: "Method not allowed" }, 405);
};
