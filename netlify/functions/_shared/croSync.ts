import { getStore } from "@netlify/blobs";
import { croEnvironmentReady, croEnvironmentValue } from "./croEnvironment";

export type CroAutomaticMode = "rolling-month" | "fixed";

export const currentSaudiMonthRange = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "";
  const year = Number(value("year"));
  const month = Number(value("month"));
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("تعذر تحديد الشهر الحالي بتوقيت الرياض.");
  }
  const paddedMonth = String(month).padStart(2, "0");
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    from: `${year}-${paddedMonth}-01`,
    to: `${year}-${paddedMonth}-${String(lastDay).padStart(2, "0")}`,
  };
};

export type CroSyncState = "idle" | "queued" | "running" | "success" | "error";
export type CroSyncSource = "manual" | "automatic";

export type CroSyncStatus = {
  state: CroSyncState;
  attemptId?: string;
  source?: CroSyncSource;
  from?: string;
  to?: string;
  queuedAt?: string;
  startedAt?: string;
  finishedAt?: string;
  message?: string;
  stats?: {
    total: number;
    confirmed: number;
    cancelled: number;
    cancelRate: number;
    updatedAt: string;
  };
};

const store = () => getStore({ name: "cro-sync", consistency: "strong" });

export const getCroSyncStatus = async (): Promise<CroSyncStatus> => (
  (await store().get("latest", { type: "json" })) as CroSyncStatus | null
) || { state: "idle" };

export const setCroSyncStatus = async (status: CroSyncStatus) => {
  await store().setJSON("latest", status);
  return status;
};

export const isActiveCroSync = (status: CroSyncStatus, maxAgeMs = 20 * 60 * 1000) => {
  if (status.state !== "queued" && status.state !== "running") return false;
  const timestamp = Date.parse(status.startedAt || status.queuedAt || "");
  return Number.isFinite(timestamp) && Date.now() - timestamp < maxAgeMs;
};

export const validCroDateRange = (from?: string, to?: string) => Boolean(
  from
  && to
  && /^\d{4}-\d{2}-\d{2}$/.test(from)
  && /^\d{4}-\d{2}-\d{2}$/.test(to)
  && from <= to,
);

export const automaticCroConfig = () => {
  const requestedMode = croEnvironmentValue("CRO_AUTO_MODE");
  const mode: CroAutomaticMode = requestedMode === "fixed" ? "fixed" : "rolling-month";
  const rolling = currentSaudiMonthRange();
  const from = mode === "fixed" ? croEnvironmentValue("CRO_AUTO_FROM") || rolling.from : rolling.from;
  const to = mode === "fixed" ? croEnvironmentValue("CRO_AUTO_TO") || rolling.to : rolling.to;
  return {
    configured: Boolean(
      croEnvironmentValue("CRO_USERNAME")
      && croEnvironmentValue("CRO_PASSWORD")
      && croEnvironmentValue("CRO_SYNC_SECRET"),
    ),
    environmentReady: croEnvironmentReady(),
    mode,
    from,
    to,
    schedule: "*/30 * * * *",
  };
};
