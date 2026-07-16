import { timingSafeEqual } from "node:crypto";
import { saveBookingCsv } from "./_shared/bookingCsv";
import {
  getCroSyncStatus,
  setCroSyncStatus,
  validCroDateRange,
} from "./_shared/croSync";
import { validateSession } from "./_shared/security";
import { croEnvironmentValue } from "./_shared/croEnvironment";
import { downloadCroBookings, type CroRequest } from "./cro-export";

type BackgroundRequest = CroRequest & {
  attemptId?: string;
};

const canSync = (role: string) => ["superadmin", "admin", "editor"].includes(role);

const secretsMatch = (provided: string, expected: string) => {
  if (!provided || !expected) return false;
  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);
  return providedBytes.length === expectedBytes.length && timingSafeEqual(providedBytes, expectedBytes);
};

const decodeCsv = (payload: ArrayBuffer) => {
  const bytes = new Uint8Array(payload);
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder("utf-16le").decode(bytes);
  return new TextDecoder("utf-8").decode(bytes);
};

export default async (req: Request) => {
  if (req.method !== "POST") return new Response(null, { status: 405 });

  const session = await validateSession(req);
  const providedSecret = req.headers.get("x-cro-sync-secret") || "";
  const expectedSecret = croEnvironmentValue("CRO_SYNC_SECRET");
  if ((!session || !canSync(session.role)) && !secretsMatch(providedSecret, expectedSecret)) {
    return new Response(null, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as BackgroundRequest;
  const current = await getCroSyncStatus();
  if (
    !body.attemptId
    || current.attemptId !== body.attemptId
    || current.state !== "queued"
    || !validCroDateRange(body.from, body.to)
  ) {
    return new Response(null, { status: 409 });
  }

  const startedAt = new Date().toISOString();
  await setCroSyncStatus({
    ...current,
    state: "running",
    startedAt,
    message: "جاري جلب حجوزات Check-Out من CRO وتحديث التقارير.",
  });

  try {
    const exported = await downloadCroBookings(body);
    const payload = await exported.arrayBuffer();
    const csvText = decodeCsv(payload);
    if (!csvText.includes(",") || !/\r?\n/.test(csvText)) {
      throw new Error("ملف CRO المستلم ليس بصيغة CSV صالحة للتحديث التلقائي.");
    }

    const stats = await saveBookingCsv(csvText);
    const latest = await getCroSyncStatus();
    if (latest.attemptId === body.attemptId) {
      await setCroSyncStatus({
        ...latest,
        state: "success",
        finishedAt: new Date().toISOString(),
        message: "تم تحديث تقارير الحجوزات مباشرة من CRO.",
        stats,
      });
    }
  } catch (error) {
    const latest = await getCroSyncStatus();
    if (latest.attemptId === body.attemptId) {
      await setCroSyncStatus({
        ...latest,
        state: "error",
        finishedAt: new Date().toISOString(),
        message: error instanceof Error
          ? error.message
          : "تعذر تحديث تقارير الحجوزات من CRO.",
      });
    }
  }

  return new Response(null, { status: 204 });
};
