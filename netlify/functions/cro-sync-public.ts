import type { Config, Context } from "@netlify/functions";
import { randomUUID } from "node:crypto";
import {
  automaticCroConfig,
  getCroSyncStatus,
  isActiveCroSync,
  setCroSyncStatus,
  type CroSyncStatus,
  validCroDateRange,
} from "./_shared/croSync";
import { croEnvironmentValue } from "./_shared/croEnvironment";
import { json } from "./_shared/security";

const PUBLIC_SYNC_COOLDOWN_MS = 2 * 60 * 1000;

const publicStatus = (status: CroSyncStatus, accepted = false) => {
  const updatedAt = status.stats?.updatedAt || status.finishedAt || null;
  const state = status.state;
  const messages: Record<CroSyncStatus["state"], string> = {
    idle: "التقرير جاهز للتحديث.",
    queued: "تم استلام الطلب وبدأ التحديث في الخلفية.",
    running: "يجري تحديث بيانات التقرير في الخلفية.",
    success: "تم تحديث بيانات التقرير.",
    error: "تعذر إكمال التحديث حاليًا. حاول لاحقًا.",
  };
  return {
    ok: state !== "error",
    accepted,
    state,
    updatedAt,
    message: messages[state],
  };
};

const isSameSiteRequest = (req: Request) => (
  req.headers.get("x-report-sync") === "booking-reports"
  && req.headers.get("sec-fetch-site") !== "cross-site"
);

export default async (req: Request, context: Context) => {
  if (!isSameSiteRequest(req)) return json({ error: "الطلب غير مسموح." }, 403);
  if (req.method !== "GET" && req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const automation = automaticCroConfig();
  const secret = croEnvironmentValue("CRO_SYNC_SECRET");
  if (!automation.configured || !secret || !validCroDateRange(automation.from, automation.to)) {
    return json({
      ok: false,
      accepted: false,
      state: "unavailable",
      updatedAt: null,
      message: "التحديث غير متاح مؤقتًا.",
    }, 503);
  }

  const current = await getCroSyncStatus();
  if (req.method === "GET") {
    const stale = (current.state === "queued" || current.state === "running") && !isActiveCroSync(current);
    return json(stale ? publicStatus({ ...current, state: "error" }) : publicStatus(current));
  }

  if (isActiveCroSync(current)) return json(publicStatus(current), 202);

  const lastFinishedAt = Date.parse(current.finishedAt || current.stats?.updatedAt || "");
  if (current.state === "success" && Number.isFinite(lastFinishedAt) && Date.now() - lastFinishedAt < PUBLIC_SYNC_COOLDOWN_MS) {
    return json({
      ...publicStatus(current),
      state: "fresh",
      message: "بيانات التقرير محدثة بالفعل.",
    });
  }

  const attemptId = randomUUID();
  const queued = await setCroSyncStatus({
    state: "queued",
    attemptId,
    source: "viewer",
    from: automation.from,
    to: automation.to,
    queuedAt: new Date().toISOString(),
    message: "بدأ تحديث التقرير بطلب من صفحة العرض.",
  });

  const backgroundUrl = new URL("/.netlify/functions/cro-sync-background", new URL(req.url).origin || context.site.url);
  try {
    const triggered = await fetch(backgroundUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CRO-Sync-Secret": secret,
      },
      body: JSON.stringify({ attemptId, from: automation.from, to: automation.to }),
    });
    if (!triggered.ok) throw new Error(`Background trigger returned ${triggered.status}`);
  } catch {
    const failed = await setCroSyncStatus({
      ...queued,
      state: "error",
      finishedAt: new Date().toISOString(),
      message: "تعذر بدء تحديث التقرير في الخلفية.",
    });
    return json(publicStatus(failed), 502);
  }

  return json(publicStatus(queued, true), 202);
};

export const config: Config = {
  path: "/api/reports/sync",
  rateLimit: {
    windowSize: 60,
    windowLimit: 5,
    aggregateBy: ["ip"],
  },
};
