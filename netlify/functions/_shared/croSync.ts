import { getStore } from "@netlify/blobs";
import { croEnvironmentReady, croEnvironmentValue } from "./croEnvironment";

export const DEFAULT_AUTO_FROM = "2026-07-01";
export const DEFAULT_AUTO_TO = "2026-07-31";

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

export const automaticCroConfig = () => ({
  configured: Boolean(
    croEnvironmentValue("CRO_USERNAME")
    && croEnvironmentValue("CRO_PASSWORD")
    && croEnvironmentValue("CRO_SYNC_SECRET"),
  ),
  environmentReady: croEnvironmentReady(),
  from: croEnvironmentValue("CRO_AUTO_FROM") || DEFAULT_AUTO_FROM,
  to: croEnvironmentValue("CRO_AUTO_TO") || DEFAULT_AUTO_TO,
  schedule: "*/30 * * * *",
});
