import { getStore } from "@netlify/blobs";
import {
  DEFAULT_EMAIL_TEMPLATE,
  DEFAULT_WHATSAPP_TEMPLATE,
} from "../../src/lib/enterpriseProtocol";

type Session = { username: string; role: string };

type EnterpriseConfig = {
  whatsappTemplate: string;
  emailTemplate: string;
  emailEnabled: boolean;
  slaMinutes: number;
  escalationThreshold: number;
  theme: {
    primary: string;
    accent: string;
    background: string;
    radius: string;
    font: string;
  };
};

const DEFAULT_CONFIG: EnterpriseConfig = {
  whatsappTemplate: DEFAULT_WHATSAPP_TEMPLATE,
  emailTemplate: DEFAULT_EMAIL_TEMPLATE,
  emailEnabled: true,
  slaMinutes: 30,
  escalationThreshold: 3,
  theme: {
    primary: "",
    accent: "",
    background: "",
    radius: "",
    font: "",
  },
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function validateSession(req: Request): Promise<Session | null> {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim();
  if (!token) return null;
  const store = getStore({ name: "sessions", consistency: "strong" });
  try {
    return (await store.get(`sess_${token}`, { type: "json" })) as Session | null;
  } catch {
    return null;
  }
}

export default async (req: Request) => {
  const store = getStore("enterprise_config");

  if (req.method === "GET") {
    try {
      const data = (await store.get("config", { type: "json" })) as EnterpriseConfig | null;
      return json(data || DEFAULT_CONFIG);
    } catch {
      return json(DEFAULT_CONFIG);
    }
  }

  if (req.method === "PUT") {
    const session = await validateSession(req);
    if (!session || !["superadmin", "admin"].includes(session.role)) {
      return json({ error: "Unauthorized" }, 401);
    }

    const current =
      ((await store.get("config", { type: "json" })) as EnterpriseConfig | null) || DEFAULT_CONFIG;
    const body = (await req.json().catch(() => ({}))) as Partial<EnterpriseConfig>;
    const updated: EnterpriseConfig = {
      whatsappTemplate: body.whatsappTemplate ?? current.whatsappTemplate,
      emailTemplate: body.emailTemplate ?? current.emailTemplate,
      emailEnabled: body.emailEnabled ?? current.emailEnabled,
      slaMinutes: body.slaMinutes ?? current.slaMinutes,
      escalationThreshold: body.escalationThreshold ?? current.escalationThreshold,
      theme: {
        ...current.theme,
        ...(body.theme || {}),
      },
    };

    await store.setJSON("config", updated);
    return json(updated);
  }

  return json({ error: "Method not allowed" }, 405);
};
