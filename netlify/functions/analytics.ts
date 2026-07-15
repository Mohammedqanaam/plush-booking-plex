import type { Context } from "@netlify/functions";
import { getDeployStore, getStore } from "@netlify/blobs";
import { json, validateSession } from "./_shared/security";

type ClientInfo = {
  language?: string;
  languages?: string[];
  screen?: string;
  viewport?: string;
  timezone?: string;
  platform?: string;
  connection?: string;
  downlink?: number;
  saveData?: boolean;
  memory?: number;
  cpuCores?: number;
  touchPoints?: number;
  isPwa?: boolean;
};

type AnalyticsEvent = ClientInfo & {
  event?: "pageview" | "heartbeat";
  visitorId?: string;
  sessionId?: string;
  path?: string;
  referrer?: string;
};

type VisitorRecord = ClientInfo & {
  visitorId: string;
  views: number;
  pages: Record<string, number>;
  sessions: string[];
  device: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  ipMasked: string;
  country: string;
  city: string;
  region: string;
  geoTimezone: string;
  referrer: string;
  firstSeen: string;
  lastSeen: string;
};

type PresenceRecord = Omit<VisitorRecord, "views" | "pages" | "sessions" | "firstSeen"> & {
  path: string;
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

function versionFrom(userAgent: string, expression: RegExp) {
  return userAgent.match(expression)?.[1]?.replace(/_/g, ".").slice(0, 20) || "غير محدد";
}

function parseUserAgent(userAgent: string) {
  const device = /iPad|Tablet|Android(?!.*Mobile)/i.test(userAgent)
    ? "جهاز لوحي"
    : /Mobile|iPhone|Android/i.test(userAgent)
      ? "جوال"
      : "كمبيوتر";

  let browser = "أخرى";
  let browserVersion = "غير محدد";
  if (/Edg\//i.test(userAgent)) {
    browser = "Edge";
    browserVersion = versionFrom(userAgent, /Edg\/([\d.]+)/i);
  } else if (/OPR\//i.test(userAgent)) {
    browser = "Opera";
    browserVersion = versionFrom(userAgent, /OPR\/([\d.]+)/i);
  } else if (/CriOS|Chrome/i.test(userAgent)) {
    browser = "Chrome";
    browserVersion = versionFrom(userAgent, /(?:CriOS|Chrome)\/([\d.]+)/i);
  } else if (/FxiOS|Firefox/i.test(userAgent)) {
    browser = "Firefox";
    browserVersion = versionFrom(userAgent, /(?:FxiOS|Firefox)\/([\d.]+)/i);
  } else if (/Safari/i.test(userAgent)) {
    browser = "Safari";
    browserVersion = versionFrom(userAgent, /Version\/([\d.]+)/i);
  }

  let os = "أخرى";
  let osVersion = "غير محدد";
  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    os = "iOS";
    osVersion = versionFrom(userAgent, /OS ([\d_]+)/i);
  } else if (/Android/i.test(userAgent)) {
    os = "Android";
    osVersion = versionFrom(userAgent, /Android\s([\d.]+)/i);
  } else if (/Windows/i.test(userAgent)) {
    os = "Windows";
    osVersion = /Windows NT 10/i.test(userAgent) ? "10/11" : versionFrom(userAgent, /Windows NT\s([\d.]+)/i);
  } else if (/Mac OS|Macintosh/i.test(userAgent)) {
    os = "macOS";
    osVersion = versionFrom(userAgent, /Mac OS X\s([\d_]+)/i);
  } else if (/Linux/i.test(userAgent)) {
    os = "Linux";
  }

  return { device, browser, browserVersion, os, osVersion };
}

function maskIp(ip: string) {
  if (!ip) return "غير متاح";
  if (ip.includes(".")) {
    const parts = ip.split(".");
    return parts.length === 4 ? `${parts[0]}.${parts[1]}.*.*` : "IPv4 محمي";
  }
  const parts = ip.split(":").filter(Boolean);
  return parts.length ? `${parts.slice(0, 3).join(":")}:*:*` : "IPv6 محمي";
}

function cleanText(value: unknown, max = 80) {
  return String(value || "")
    .split("")
    .map((character) => {
      const code = character.charCodeAt(0);
      return code <= 31 || code === 127 ? " " : character;
    })
    .join("")
    .trim()
    .slice(0, max);
}

function cleanNumber(value: unknown, min: number, max: number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : undefined;
}

function cleanClientInfo(body: AnalyticsEvent): ClientInfo {
  return {
    language: cleanText(body.language, 20),
    languages: Array.isArray(body.languages) ? body.languages.slice(0, 5).map((value) => cleanText(value, 20)).filter(Boolean) : [],
    screen: cleanText(body.screen, 24),
    viewport: cleanText(body.viewport, 24),
    timezone: cleanText(body.timezone, 50),
    platform: cleanText(body.platform, 50),
    connection: cleanText(body.connection, 20),
    downlink: cleanNumber(body.downlink, 0, 1000),
    saveData: body.saveData === true,
    memory: cleanNumber(body.memory, 0, 64),
    cpuCores: cleanNumber(body.cpuCores, 0, 128),
    touchPoints: cleanNumber(body.touchPoints, 0, 20),
    isPwa: body.isPwa === true,
  };
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
    const agent = parseUserAgent(userAgent);
    const client = cleanClientInfo(body);
    const country = context.geo.country?.name || context.geo.country?.code || "غير محدد";
    const city = context.geo.city || "غير محدد";
    const region = context.geo.subdivision?.name || context.geo.subdivision?.code || "غير محدد";
    const geoTimezone = context.geo.timezone || "غير محدد";
    const network = { ipMasked: maskIp(context.ip || ""), country, city, region, geoTimezone };

    const presence: PresenceRecord = {
      visitorId,
      ...agent,
      ...client,
      ...network,
      referrer: referrerHost(body.referrer),
      path,
      lastSeen: now,
    };
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
        ...agent,
        ...client,
        ...network,
        referrer: referrerHost(body.referrer),
        firstSeen: now,
        lastSeen: now,
      };

      record.views += 1;
      increment(record.pages, path);
      record.lastSeen = now;
      Object.assign(record, agent, client, network);
      if (!record.sessions.includes(sessionId)) record.sessions = [...record.sessions, sessionId].slice(-30);
      await store.setJSON(key, record);
    }

    return json({ ok: true }, 202);
  }

  if (req.method === "GET") {
    const session = await validateSession(req);
    if (!session) return json({ error: "Unauthorized" }, 401);

    const url = new URL(req.url);
    const detailed = url.searchParams.get("detail") === "ghost";
    if (detailed && !["superadmin", "admin"].includes(session.role)) {
      return json({ error: "Permission Denied" }, 403);
    }

    const requestedDays = Number(url.searchParams.get("days") || 30);
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
    const totalsByVisitor = new Map<string, { views: number; sessions: Set<string>; pages: Record<string, number>; firstSeen: string }>();
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
      const total = totalsByVisitor.get(record.visitorId) || { views: 0, sessions: new Set<string>(), pages: {}, firstSeen: record.firstSeen };
      total.views += record.views || 0;
      for (const id of record.sessions || []) total.sessions.add(id);
      for (const [page, count] of Object.entries(record.pages || {})) {
        increment(pages, page, count);
        increment(total.pages, page, count);
      }
      if (record.firstSeen < total.firstSeen) total.firstSeen = record.firstSeen;
      totalsByVisitor.set(record.visitorId, total);
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

    const recentVisitors = detailed
      ? [...latestByVisitor.values()].sort((a, b) => b.lastSeen.localeCompare(a.lastSeen)).slice(0, 150).map((record) => {
          const totals = totalsByVisitor.get(record.visitorId);
          return {
            ...record,
            views: totals?.views || record.views || 0,
            sessionCount: totals?.sessions.size || record.sessions?.length || 0,
            pages: totals?.pages || record.pages || {},
            firstSeen: totals?.firstSeen || record.firstSeen,
            sessions: undefined,
          };
        })
      : undefined;

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
      recentVisitors,
      privacy: {
        ipMode: "masked",
        preciseLocation: false,
        fingerprinting: false,
      },
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
