import type { Config } from "@netlify/functions";
import { randomUUID } from "node:crypto";
import {
  getBookingPhoneArchiveStatus,
  searchBookingPhoneArchive,
} from "./_shared/bookingPhoneArchive";
import { normalizeSaudiMobile } from "./_shared/croPhoneSearch";
import { json, validateSession } from "./_shared/security";

const canSearch = (role: string) => role === "superadmin" || role === "admin";
const recentSearches = () => {
  const state = globalThis as typeof globalThis & { __croArchiveSearches?: Map<string, number> };
  if (!state.__croArchiveSearches) state.__croArchiveSearches = new Map<string, number>();
  return state.__croArchiveSearches;
};

export default async (req: Request) => {
  const session = await validateSession(req);
  if (!session) return json({ error: "الجلسة غير صالحة." }, 401);
  if (!canSearch(session.role)) return json({ error: "هذه الخاصية متاحة للمشرف فقط." }, 403);

  if (req.method === "GET") {
    return json({
      source: "cro-archive",
      linkedSystem: "OPERA",
      readOnly: true,
      archive: await getBookingPhoneArchiveStatus(),
    });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const now = Date.now();
  const searches = recentSearches();
  const previousSearch = searches.get(session.username) || 0;
  if (now - previousSearch < 1_500) {
    return json({ error: "انتظر لحظة قبل إعادة البحث." }, 429);
  }
  searches.set(session.username, now);

  const body = await req.json().catch(() => ({})) as { mobile?: unknown };
  const mobile = typeof body.mobile === "string" ? normalizeSaudiMobile(body.mobile) : null;
  if (!mobile) {
    return json({ error: "أدخل رقم جوال سعودي صحيحًا بصيغة 5xxxxxxxx أو 05xxxxxxxx." }, 400);
  }

  const requestId = randomUUID();
  try {
    const result = await searchBookingPhoneArchive(mobile);
    if (!result.status.configured) {
      return json({
        error: "أرشيف البحث الآمن غير مهيأ على السيرفر.",
        code: "ARCHIVE_NOT_CONFIGURED",
        requestId,
      }, 503);
    }
    if (!result.status.periodCount) {
      return json({
        error: "لم تُؤرشف أي فترة بعد. افتح مزامنة CRO واختر «أرشفة فترة سابقة» أولًا.",
        code: "ARCHIVE_EMPTY",
        requestId,
      }, 409);
    }
    if (!result.status.indexedMobiles && result.status.latestPeriodPhoneColumnCount === 0) {
      return json({
        error: "تقرير CRO المؤرشف لا يحتوي عمود رقم جوال، لذلك لا يمكن تنفيذ البحث بهذه البيانات.",
        code: "PHONE_COLUMN_MISSING",
        requestId,
      }, 422);
    }

    const reservations = result.reservations.map(({ periodKey: _periodKey, ...reservation }) => reservation);
    console.info("CRO archive reservation search", {
      requestId,
      admin: session.username,
      resultCount: reservations.length,
      periodCount: result.status.periodCount,
    });
    return json({
      source: "cro-archive",
      linkedSystem: "OPERA",
      reservations,
      totalResults: reservations.length,
      searchedAt: new Date().toISOString(),
      requestId,
      readOnly: true,
      archive: result.status,
    });
  } catch (error) {
    console.error("CRO archive reservation search failed", {
      requestId,
      admin: session.username,
      code: error instanceof Error ? error.name : "UNKNOWN",
    });
    return json({ error: "تعذر البحث في أرشيف الحجوزات حاليًا.", requestId }, 502);
  }
};

export const config: Config = {
  path: "/api/admin/opera-search",
};
