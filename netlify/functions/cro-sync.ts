import type { Context } from "@netlify/functions";
import { randomUUID } from "node:crypto";
import {
  automaticCroConfig,
  getCroSyncStatus,
  isActiveCroSync,
  setCroSyncStatus,
  validCroDateRange,
} from "./_shared/croSync";
import { json, validateSession } from "./_shared/security";

type SyncRequest = {
  from?: string;
  to?: string;
  archiveOnly?: boolean;
  username?: string;
  password?: string;
};

const canSync = (role: string) => ["superadmin", "admin", "editor"].includes(role);

export default async (req: Request, context: Context) => {
  const session = await validateSession(req);
  if (!session) return json({ error: "Unauthorized" }, 401);
  if (!canSync(session.role)) return json({ error: "Permission Denied" }, 403);

  if (req.method === "GET") {
    return json({
      status: await getCroSyncStatus(),
      automation: automaticCroConfig(),
    });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const body = await req.json().catch(() => ({})) as SyncRequest;
  if (!validCroDateRange(body.from, body.to)) {
    return json({ error: "اختر تاريخ بداية ونهاية صحيحين للمزامنة." }, 400);
  }

  const current = await getCroSyncStatus();
  if (isActiveCroSync(current)) {
    return json({ ok: true, alreadyRunning: true, status: current, automation: automaticCroConfig() }, 202);
  }

  const attemptId = randomUUID();
  const queuedAt = new Date().toISOString();
  const queued = await setCroSyncStatus({
    state: "queued",
    attemptId,
    source: "manual",
    from: body.from,
    to: body.to,
    queuedAt,
    message: body.archiveOnly ? "تمت إضافة أرشفة الفترة السابقة إلى قائمة التنفيذ." : "تمت إضافة التحديث إلى قائمة التنفيذ.",
  });

  const authorization = req.headers.get("authorization") || "";
  const backgroundUrl = new URL("/.netlify/functions/cro-sync-background", new URL(req.url).origin || context.site.url);
  try {
    const triggered = await fetch(backgroundUrl, {
      method: "POST",
      headers: {
        "Authorization": authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        attemptId,
        from: body.from,
        to: body.to,
        archiveOnly: Boolean(body.archiveOnly),
        username: body.username,
        password: body.password,
      }),
    });
    if (!triggered.ok) throw new Error(`Background trigger returned ${triggered.status}`);
  } catch {
    const failed = await setCroSyncStatus({
      ...queued,
      state: "error",
      finishedAt: new Date().toISOString(),
      message: "تعذر بدء مهمة التحديث في الخلفية. حاول مرة أخرى.",
    });
    return json({ error: failed.message, status: failed, automation: automaticCroConfig() }, 502);
  }

  return json({ ok: true, status: queued, automation: automaticCroConfig() }, 202);
};
