import type { Context } from "@netlify/functions";
import { getDeployStore, getStore } from "@netlify/blobs";
import { json, validateSession } from "./_shared/security";

type AnalyticsEvent = {
  event?: "pageview" | "heartbeat";
  visitorId?: string;
  sessionId?: string;
  path?: string;
  referrer?: string;
};

type VisitorRecord = {
  visitorId: string;
  views: number;
  pages: Record<string, number>;
  sessions: string[];
  device: string;
  browser: string;
  os: string;
  country: string;
  city: string;
  referrer: string;
  firstSeen: string;
  lastSeen: string;
};

type PresenceRecord = Pick<VisitorRecord, "visitorId" | "device" | "browser" | "os" | "country" | "city"> & {
  path: string;
  lastSeen: string;
};

const ID_PATTERN = /^[a-zA-Z0-9_-]{16,80}$/;
const BOT_PATTERN = /bot|crawler|spider|headless|preview|lighthouse|uptime|monitoring/i;
const ONLINE_WINDOW_MS = 2 * 60 * 1000;

function analyticsStore(context: Context) {
  if (context.deploy.context === "production") {
    return getStore({ name: "site_analytics", consistency: "strong" });
  }
  return getDeployStore({ name: "site_analytics", deployID: context.deploy.id });
}

function parseUserAgent(userAgent: string) {
  const device = /iPad|Tablet|Android(?!.*Mobile)/i.test(userAgent)
    ? "جهاز لوحي"
    : /Mobile|iPhone|Android/i.test(userAgent)
      ? "جوال"
      : "كمبيوتر";

  const browser = /Edg\//i.test(userAgent)
    ? "Edge"
    : /OPR\//i.test(userAgent)
      ? "Opera"
      : /CriOS|Chrome/i.test(userAgent)
        ? "Chrome"
        : /FxiOS|Firefox/i.test(userAgent)
          ? "Firefox"
          : /Safari/i.test(userAgent)
            ? "Safari"
            : "أخرى";

  const os = /iPhone|iPad|iPod/i.test(userAgent)
    ? "iOS"
    : /Android/i.test(userAgent)
      ? "Android"
      : /Windows/i.test(userAgent)
        ? "Windows"
        : /Mac OS|Macintosh/i.test(userAgent)
          ? "macOS"
          : /Linux/i.test(userAgent)
            ? "Linux"
            : "أخرى";

  return { device, browser, os };
}

function cleanPath(value: unknown) {
  const path = String(value || "/").split("?")[0].split("#")[0];
  return path.startsWith("/") ? path.slice(0, 180) : "/";
}

function referrerHost(value: unknown) {
  if (!value) return "مباشر";
  try {
    return new URL(String(value)).hostname.replace(/^www\./, "").slice(0, 120) || "مباشر";
  } catch {
    return "مباشر";
  }
}

function dateKeys(days: number) {
  const keys: string[] = [];
  const now = new Date();
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setUTCDate(now.getUTCDate() - offset);
    keys.push(date.toISOString().slice(0, 10));
  }
  return keys;
}

function increment(target: Record<string, number>, key: string, amount = 1) {
  target[key] = (target[key] || 0) + amount;
}

export default async (req: Request, context: Context) => {
  const store = analyticsStore(context);

  if (req.method === "POST") {
    const userAgent = req.headers.get("user-agent") || "";
    if (!userAgent || BOT_PATTERN.test(userAgent)) return json({ ok: true });

    const body = (await req.json().catch(() => ({}))) as AnalyticsEvent;
    if (!ID_PATTERN.test(body.visitorId || "") || !ID_PATTERN.test(body.sessionId || "")) {
      return json({ error: "Invalid analytics identifiers" }, 400);
    }

    const event = body.event === "heartbeat" ? "heartbeat" : "pageview";
    const visitorId = body.visitorId as string;
    const sessionId = body.sessionId as string;
    const path = cleanPath(body.path);
    const now = new Date().toISOString();
    const { device, browser, os } = parseUserAgent(userAgent);
    const country = context.geo.country?.name || context.geo.country?.code || "غير محدد";
    const city = context.geo.city || "غير محدد";

    const presence: PresenceRecord = { visitorId, device, browser, os, country, city, path, lastSeen: now };
    await store.setJSON(`presence/${visitorId}`, presence);

    if (event === "pageview") {
      const day = now.slice(0, 10);
      const key = `daily/${day}/${visitorId}`;
      const existing = (await store.get(key, { type: "json" })) as VisitorRecord | null;
      const record: VisitorRecord = existing || {
        visitorId,
        views: 0,
        pages: {},
        sessions: [],
        device,
        browser,
        os,
        country,
        city,
        referrer: referrerHost(body.referrer),
        firstSeen: now,
        lastSeen: now,
      };

      record.views += 1;
      increment(record.pages, path);
      record.lastSeen = now;
      record.device = device;
      record.browser = browser;
      record.os = os;
      if (!record.sessions.includes(sessionId)) record.sessions = [...record.sessions, sessionId].slice(-30);
      await store.setJSON(key, record);
    }

    return json({ ok: true }, 202);
  }

  if (req.method === "GET") {
    const session = await validateSession(req);
    if (!session) return json({ error: "Unauthorized" }, 401);

    const requestedDays = Number(new URL(req.url).searchParams.get("days") || 30);
    const days = [7, 30, 90].includes(requestedDays) ? requestedDays : 30;
    const dates = dateKeys(days);
    const dailyLists = await Promise.all(dates.map((date) => store.list({ prefix: `daily/${date}/` })));
    const dailyKeys = dailyLists.flatMap((result) => result.blobs.map((blob) => blob.key));
    const records = (await Promise.all(dailyKeys.map((key) => store.get(key, { type: "json" })))).filter(Boolean) as VisitorRecord[];

    const presenceList = await store.list({ prefix: "presence/" });
    const presenceRecords = (await Promise.all(
      presenceList.blobs.map((blob) => store.get(blob.key, { type: "json" })),
    )).filter(Boolean) as PresenceRecord[];
    const online = presenceRecords
      .filter((record) => Date.now() - new Date(record.lastSeen).getTime() <= ONLINE_WINDOW_MS)
      .sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));

    const visitors = new Set<string>();
    const devices: Record<string, number> = {};
    const browsers: Record<string, number> = {};
    const operatingSystems: Record<string, number> = {};
    const pages: Record<string, number> = {};
    const referrers: Record<string, number> = {};
    const latestByVisitor = new Map<string, VisitorRecord>();
    const trend = Object.fromEntries(dates.map((date) => [date, { date, views: 0, visitors: 0 }]));
    let totalViews = 0;
    let sessions = 0;

    for (const record of records) {
      visitors.add(record.visitorId);
      totalViews += record.views || 0;
      sessions += record.sessions?.length || 0;
      increment(referrers, record.referrer || "مباشر");
      const latest = latestByVisitor.get(record.visitorId);
      if (!latest || record.lastSeen > latest.lastSeen) latestByVisitor.set(record.visitorId, record);
      for (const [path, count] of Object.entries(record.pages || {})) increment(pages, path, count);
      const date = record.firstSeen.slice(0, 10);
      if (trend[date]) {
        trend[date].views += record.views || 0;
        trend[date].visitors += 1;
      }
    }

    for (const record of latestByVisitor.values()) {
      increment(devices, record.device || "غير محدد");
      increment(browsers, record.browser || "غير محدد");
      increment(operatingSystems, record.os || "غير محدد");
    }

    const today = dates[dates.length - 1];
    return json({
      rangeDays: days,
      generatedAt: new Date().toISOString(),
      totalViews,
      uniqueVisitors: visitors.size,
      sessions,
      onlineCount: online.length,
      todayViews: trend[today]?.views || 0,
      todayVisitors: trend[today]?.visitors || 0,
      devices,
      browsers,
      operatingSystems,
      pages,
      referrers,
      trend: Object.values(trend),
      online: online.slice(0, 50),
    });
  }

  return json({ error: "Method not allowed" }, 405);
};

export const config = {
  rateLimit: {
    windowSize: 60,
    windowLimit: 600,
    aggregateBy: ["ip"],
  },
};
