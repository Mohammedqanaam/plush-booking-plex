import { getStore } from "@netlify/blobs";

type Session = { username: string; role: string };
type SiteSettings = { siteTitle: string; bannerText: string };
type EnterpriseSettings = {
  whatsappTemplate: string;
  emailTemplate: string;
  emailEnabled: boolean;
  slaHours: number;
  escalationThreshold: number;
  theme: {
    primary: string;
    accent: string;
    background: string;
    borderRadius: string;
    fontStyle: string;
  };
};

type SettingsPayload = SiteSettings & { enterprise?: EnterpriseSettings };

const DEFAULT_SETTINGS: SettingsPayload = {
  siteTitle: "WORM-AI",
  bannerText: "",
  enterprise: {
    whatsappTemplate:
      "Complaint No: {{complaintNo}}\nBrand: {{brand}}\nBranch: {{branch}}\nCategory: {{mainCategory}}\nSub-category: {{subCategory}}\n\nGuest Name: {{guestFullName}}\nBooking Mobile: {{bookingMobile}}\nSuite No: {{suiteNumber}}\nCheck-in Date: {{checkInDate}}\nGuest In-House: {{inHouse}}\nPriority: {{priority}}\n\nPlease handle according to operational protocol.",
    emailTemplate: "",
    emailEnabled: true,
    slaHours: 2,
    escalationThreshold: 3,
    theme: {
      primary: "42 90% 55%",
      accent: "42 80% 48%",
      background: "270 60% 5%",
      borderRadius: "0.75rem",
      fontStyle: "IBM Plex Sans Arabic",
    },
  },
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
      const settings = (await store.get("site", { type: "json" })) as SettingsPayload | null;
      return json({ ...DEFAULT_SETTINGS, ...settings, enterprise: { ...DEFAULT_SETTINGS.enterprise, ...(settings?.enterprise || {}) } });
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

    let body: Partial<SettingsPayload>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid request" }, 400);
    }

    let current: SettingsPayload;
    try {
      current = ((await store.get("site", { type: "json" })) as SettingsPayload) || DEFAULT_SETTINGS;
    } catch {
      current = DEFAULT_SETTINGS;
    }

    const updated: SettingsPayload = {
      siteTitle: body.siteTitle !== undefined ? body.siteTitle : current.siteTitle,
      bannerText: body.bannerText !== undefined ? body.bannerText : current.bannerText,
      enterprise: {
        ...DEFAULT_SETTINGS.enterprise!,
        ...(current.enterprise || {}),
        ...(body.enterprise || {}),
        theme: {
          ...DEFAULT_SETTINGS.enterprise!.theme,
          ...(current.enterprise?.theme || {}),
          ...(body.enterprise?.theme || {}),
        },
      },
    };

    await store.setJSON("site", updated);
    return json(updated);
  }

  return json({ error: "Method not allowed" }, 405);
};
