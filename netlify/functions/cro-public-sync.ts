import type { Context } from "@netlify/functions";
import { randomUUID } from "node:crypto";
import { croEnvironmentValue } from "./_shared/croEnvironment";
import {
  automaticCroConfig,
  getCroSyncStatus,
  isActiveCroSync,
  setCroSyncStatus,
  type CroSyncStatus,
} from "./_shared/croSync";
import { json } from "./_shared/security";

const SUCCESS_COOLDOWN_MS = 10 * 60 * 1000;
const ERROR_COOLDOWN_MS = 60 * 1000;

const finishedTime = (status: CroSyncStatus) => Date.parse(
  status.finishedAt || status.startedAt || status.queuedAt || "",
);

const nextAllowedTime = (status: CroSyncStatus) => {
  if (isActiveCroSync(status)) return null;
  const timestamp = finishedTime(status);
  if (!Number.isFinite(timestamp)) return null;
  const cooldown = status.state === "error" ? ERROR_COOLDOWN_MS : SUCCESS_COOLDOWN_MS;
  return timestamp + cooldown;
};

const publicMessage = (status: CroSyncStatus, available: boolean) => {
  if (!available) return "التحديث المباشر غير جاهز حاليًا.";
  if (status.state === "queued") return "تم استلام طلب التحديث.";
  if (status.state === "running") return "جاري تحديث بيانات الحجوزات.";
  if (status.state === "success") return "بيانات الحجوزات محدثة.";
  if (status.state === "error") return "تعذر إكمال آخر تحديث. يمكن المحاولة لاحقًا.";
  return "يمكن طلب تحديث بيانات الحجوزات.";
};

const publicStatus = (status: CroSyncStatus) => {
  const automation = automaticCroConfig();
  const active = isActiveCroSync(status);
  const retryAt = nextAllowedTime(status);
  const now = Date.now();
  return {
    available: automation.configured,
    state: active ? status.state : status.state || "idle",
    active,
    message: publicMessage(status, automation.configured),
    from: status.from || automation.from,
    to: status.to || automation.to,
    updatedAt: status.stats?.updatedAt || status.finishedAt || null,
    nextAllowedAt: retryAt && retryAt > now ? new Date(retryAt).toISOString() : null,
    stats: status.stats
      ? {
        total: status.stats.total,
        confirmed: status.stats.confirmed,
        cancelled: status.stats.cancelled,
        cancelRate: status.stats.cancelRate,
      }
      : null,
  };
};

export default async (req: Request, context: Context) => {
  if (req.method === "GET") return json(publicStatus(await getCroSyncStatus()));
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const automation = automaticCroConfig();
  const secret = croEnvironmentValue("CRO_SYNC_SECRET");
  const current = await getCroSyncStatus();
  if (!automation.configured || !secret) {
    return json({ ...publicStatus(current), ok: false }, 503);
  }

  if (isActiveCroSync(current)) {
    return json({ ...publicStatus(current), ok: true, alreadyRunning: true }, 202);
  }

  const retryAt = nextAllowedTime(current);
  if (retryAt && retryAt > Date.now()) {
    return json({ ...publicStatus(current), ok: true, cooldown: true }, 429);
  }

  const attemptId = randomUUID();
  const queued = await setCroSyncStatus({
    state: "queued",
    attemptId,
    source: "public",
    from: automation.from,
    to: automation.to,
    queuedAt: new Date().toISOString(),
    message: "بدأ طلب تحديث عام من صفحة التقارير.",
  });

  const backgroundUrl = new URL(
    "/.netlify/functions/cro-sync-background",
    new URL(req.url).origin || context.site.url,
  );
  try {
    const triggered = await fetch(backgroundUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CRO-Sync-Secret": secret,
      },
      body: JSON.stringify({
        attemptId,
        from: automation.from,
        to: automation.to,
      }),
    });
    if (!triggered.ok) throw new Error(`Background trigger returned ${triggered.status}`);
  } catch {
    const latest = await getCroSyncStatus();
    if (latest.attemptId === attemptId) {
      await setCroSyncStatus({
        ...queued,
        state: "error",
        finishedAt: new Date().toISOString(),
        message: "تعذر بدء تحديث الحجوزات.",
      });
    }
    return json({ ...publicStatus(await getCroSyncStatus()), ok: false }, 502);
  }

  return json({ ...publicStatus(queued), ok: true }, 202);
};

export const config = {
  rateLimit: {
    windowSize: 60,
    windowLimit: 20,
    aggregateBy: ["ip"],
  },
};
