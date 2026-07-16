import type { Config, Context } from "@netlify/functions";
import { randomUUID } from "node:crypto";
import {
  automaticCroConfig,
  getCroSyncStatus,
  isActiveCroSync,
  setCroSyncStatus,
  validCroDateRange,
} from "./_shared/croSync";

export default async (req: Request, context: Context) => {
  const automation = automaticCroConfig();
  const secret = Netlify.env.get("CRO_SYNC_SECRET") || "";
  if (!automation.configured || !secret || !validCroDateRange(automation.from, automation.to)) {
    return new Response(null, { status: 204 });
  }

  const stopAfter = Date.parse(`${automation.to}T23:59:59Z`) + (2 * 24 * 60 * 60 * 1000);
  if (Date.now() > stopAfter) return new Response(null, { status: 204 });

  const current = await getCroSyncStatus();
  if (isActiveCroSync(current)) return new Response(null, { status: 202 });

  const attemptId = randomUUID();
  const queued = await setCroSyncStatus({
    state: "queued",
    attemptId,
    source: "automatic",
    from: automation.from,
    to: automation.to,
    queuedAt: new Date().toISOString(),
    message: "بدأ موعد التحديث التلقائي من CRO.",
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
    await setCroSyncStatus({
      ...queued,
      state: "error",
      finishedAt: new Date().toISOString(),
      message: "تعذر بدء التحديث التلقائي في الخلفية.",
    });
    return new Response(null, { status: 502 });
  }

  return new Response(null, { status: 202 });
};

export const config: Config = {
  schedule: "@hourly",
};
