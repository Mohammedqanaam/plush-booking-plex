import { getStore } from "@netlify/blobs";
import { createHmac } from "node:crypto";
import type { Config, Context } from "@netlify/functions";

const DEFAULT_SETTINGS = {
  siteTitle: "WORM-AI",
  bannerText: "",
};

function getSecret(): string {
  return Netlify.env.get("ADMIN_SECRET") || "worm-ai-default-secret-2026";
}

function getAuthSession(
  req: Request
): { username: string; role: string } | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.slice(7);
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payload, sig] = parts;
    const expected = createHmac("sha256", getSecret())
      .update(payload)
      .digest("hex");
    if (sig !== expected) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return null;
  }
}

export default async (req: Request, context: Context) => {
  const store = getStore({ name: "settings", consistency: "strong" });

  if (req.method === "GET") {
    const settings = await store.get("site", { type: "json" });
    return Response.json({ settings: settings || DEFAULT_SETTINGS });
  }

  if (req.method === "POST") {
    const session = getAuthSession(req);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "superadmin") {
      return Response.json({ error: "Permission denied" }, { status: 403 });
    }

    let body: { siteTitle?: string; bannerText?: string };
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const current =
      ((await store.get("site", { type: "json" })) as typeof DEFAULT_SETTINGS) ||
      DEFAULT_SETTINGS;

    const updated = {
      siteTitle:
        body.siteTitle !== undefined ? body.siteTitle : current.siteTitle,
      bannerText:
        body.bannerText !== undefined ? body.bannerText : current.bannerText,
    };

    await store.setJSON("site", updated);
    return Response.json({ settings: updated });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
};

export const config: Config = {
  path: "/api/settings",
};
