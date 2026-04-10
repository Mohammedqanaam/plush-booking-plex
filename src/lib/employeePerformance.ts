import { type AgentStats } from "@/lib/bookingProcessor";

export type EmployeeAdjustment = {
  baseConfirmed: number;
  baseCancelled: number;
  baseTotal: number;
  confirmedAdjustment: number;
  cancelledAdjustment: number;
  totalAdjustment: number;
  finalConfirmed: number;
  finalCancelled: number;
  finalTotal: number;
  adjustmentReason: string;
  notes: string;
  updatedBy: string;
  updatedAt: string;
};

export type EmployeeRow = {
  employeeKey: string;
  sourceName: string;
  displayName: string;
  canonicalName: string;
  confirmed: number;
  cancelled: number;
  total: number;
  cancelRate: number;
  hiddenFromPerformance: boolean;
  duplicateName: boolean;
  adjustment: EmployeeAdjustment;
};

const clampZero = (value: number) => Math.max(0, value);

const toComparableName = (value: string) =>
  value.replace(/\s+/g, " ").trim().toLowerCase()
    .replace(/[\u064B-\u0652]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

export const employeeKeyFromName = (value: string) =>
  toComparableName(value)
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");

export const normalizeAliases = (aliases?: Record<string, string>) => {
  const normalized: Record<string, string> = {};
  Object.entries(aliases || {}).forEach(([key, value]) => {
    const cleaned = String(value || "").replace(/\s+/g, " ").trim();
    if (!cleaned) return;
    const normalizedKey = employeeKeyFromName(key);
    if (!normalizedKey) return;
    normalized[normalizedKey] = cleaned;
  });
  return normalized;
};

export const normalizeAdjustments = (adjustments?: Record<string, Partial<EmployeeAdjustment>>) => {
  const normalized: Record<string, Partial<EmployeeAdjustment>> = {};
  Object.entries(adjustments || {}).forEach(([key, value]) => {
    const normalizedKey = employeeKeyFromName(key);
    if (!normalizedKey) return;
    normalized[normalizedKey] = value;
  });
  return normalized;
};

const buildAdjustment = (
  row: Pick<EmployeeRow, "confirmed" | "cancelled" | "total">,
  partial: Partial<EmployeeAdjustment> | undefined,
): EmployeeAdjustment => {
  const baseConfirmed = row.confirmed;
  const baseCancelled = row.cancelled;
  const baseTotal = row.total;
  const confirmedAdjustment = Number(partial?.confirmedAdjustment || 0);
  const cancelledAdjustment = Number(partial?.cancelledAdjustment || 0);
  const totalAdjustment = Number(partial?.totalAdjustment || 0);
  const finalConfirmed = clampZero(baseConfirmed + confirmedAdjustment);
  const finalCancelled = clampZero(baseCancelled + cancelledAdjustment);
  const finalTotal = clampZero(baseTotal + totalAdjustment);

  return {
    baseConfirmed,
    baseCancelled,
    baseTotal,
    confirmedAdjustment,
    cancelledAdjustment,
    totalAdjustment,
    finalConfirmed,
    finalCancelled,
    finalTotal,
    adjustmentReason: String(partial?.adjustmentReason || ""),
    notes: String(partial?.notes || ""),
    updatedBy: String(partial?.updatedBy || ""),
    updatedAt: String(partial?.updatedAt || ""),
  };
};

export const buildEmployeeRows = ({
  stats,
  hiddenEmployees,
  aliases,
  adjustments,
}: {
  stats: AgentStats[];
  hiddenEmployees: string[];
  aliases?: Record<string, string>;
  adjustments?: Record<string, Partial<EmployeeAdjustment>>;
}): EmployeeRow[] => {
  const aliasMap = normalizeAliases(aliases);
  const adjustmentMap = normalizeAdjustments(adjustments);
  const hiddenSet = new Set(hiddenEmployees.map((name) => employeeKeyFromName(name)).filter(Boolean));
  const byKey = new Map<string, AgentStats>();

  stats.forEach((entry) => {
    const sourceName = entry.agent.replace(/\s+/g, " ").trim();
    const key = employeeKeyFromName(sourceName);
    if (!key) return;
    const current = byKey.get(key);
    if (!current) {
      byKey.set(key, { ...entry, agent: sourceName });
      return;
    }
    byKey.set(key, {
      agent: current.agent,
      confirmed: current.confirmed + entry.confirmed,
      cancelled: current.cancelled + entry.cancelled,
      total: current.total + entry.total,
      cancelRate: 0,
    });
  });

  return Array.from(byKey.entries())
    .map(([employeeKey, value]) => {
      const displayName = aliasMap[employeeKey] || value.agent;
      const base = {
        confirmed: value.confirmed,
        cancelled: value.cancelled,
        total: value.total,
      };
      const adjustment = buildAdjustment(base, adjustmentMap[employeeKey]);
      const totalForRate = adjustment.finalTotal || adjustment.finalConfirmed + adjustment.finalCancelled;
      const cancelRate = totalForRate ? Number(((adjustment.finalCancelled / totalForRate) * 100).toFixed(1)) : 0;

      return {
        employeeKey,
        sourceName: value.agent,
        displayName,
        canonicalName: displayName,
        confirmed: adjustment.finalConfirmed,
        cancelled: adjustment.finalCancelled,
        total: adjustment.finalTotal,
        cancelRate,
        hiddenFromPerformance: hiddenSet.has(employeeKey),
        duplicateName: toComparableName(value.agent) === toComparableName(displayName),
        adjustment,
      };
    })
    .sort((a, b) => b.total - a.total);
};

export const extractAdjustmentPayload = (rows: EmployeeRow[]) => {
  const payload: Record<string, EmployeeAdjustment> = {};
  rows.forEach((row) => {
    payload[row.employeeKey] = row.adjustment;
  });
  return payload;
};
