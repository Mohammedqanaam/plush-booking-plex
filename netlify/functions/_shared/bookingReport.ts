export type BookingRecord = Record<string, string | number | undefined>;

export type EmployeeReportSettings = {
  reportMonth?: string;
  reportYear?: string;
  hiddenEmployees?: string[];
  employeeDisplayNames?: Record<string, string>;
  employeeAdjustments?: Record<string, {
    confirmedAdjustment?: number;
    cancelledAdjustment?: number;
  }>;
};

export type PublicEmployeeReport = {
  id: string;
  name: string;
  confirmed: number;
  cancelled: number;
  total: number;
  confirmationRate: number;
};

export type PublicBookingReport = {
  generatedAt: string;
  updatedAt: string | null;
  period: { month: string; year: string; label: string };
  summary: {
    uploadedRecords: number;
    classifiedTotal: number;
    confirmed: number;
    cancelled: number;
    ignored: number;
    employeeCount: number;
    confirmationRate: number;
    cancelRate: number;
  };
  employees: PublicEmployeeReport[];
};

const normalizeKey = (value: string) =>
  value
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\s_\-/]+/g, "")
    .trim();

export const normalizeEmployeeId = (value: string) =>
  value.replace(/\s+/g, " ").trim().toLocaleLowerCase("en");

const getValue = (record: BookingRecord, keys: string[]): string => {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && String(value).trim()) return String(value);
  }

  const normalizedTargets = keys.map(normalizeKey);
  for (const [rawKey, rawValue] of Object.entries(record)) {
    if (rawValue === undefined || !String(rawValue).trim()) continue;
    const normalized = normalizeKey(rawKey);
    if (normalizedTargets.includes(normalized)) return String(rawValue);
    if (normalizedTargets.some((target) => normalized.includes(target) || target.includes(normalized))) {
      return String(rawValue);
    }
  }
  return "";
};

const getEmployeeName = (record: BookingRecord) =>
  getValue(record, [
    "Agent name",
    "Agent Name",
    "agent name",
    "Agent",
    "Employee",
    "Employee Name",
    "User Name",
    "اسم الموظف",
    "الموظف",
    "اسم المندوب",
    "المندوب",
  ]).replace(/\s+/g, " ").trim();

const getStatus = (record: BookingRecord) =>
  getValue(record, [
    "All stute",
    "All Stute",
    "all stute",
    "Status",
    "status",
    "Booking Status",
    "BookingStatus",
    "حالة الحجز",
    "الحالة",
  ]).trim().toUpperCase();

const classifyStatus = (status: string): "confirmed" | "cancelled" | "ignored" => {
  if (["M", "O", "N", "I"].includes(status)) return "confirmed";
  if (["C", "NS"].includes(status)) return "cancelled";
  return "ignored";
};

const toFiniteInteger = (value: unknown) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? Math.trunc(number) : 0;
};

const percentage = (part: number, total: number) =>
  total ? Number(((part / total) * 100).toFixed(1)) : 0;

export const buildPublicBookingReport = (
  bookings: BookingRecord[],
  settings: EmployeeReportSettings = {},
  updatedAt: string | null = null,
): PublicBookingReport => {
  const employeeMap = new Map<string, { sourceName: string; confirmed: number; cancelled: number }>();
  let confirmed = 0;
  let cancelled = 0;
  let ignored = 0;

  for (const booking of bookings) {
    const status = classifyStatus(getStatus(booking));
    if (status === "ignored") {
      ignored += 1;
      continue;
    }

    if (status === "confirmed") confirmed += 1;
    else cancelled += 1;

    const sourceName = getEmployeeName(booking);
    if (!sourceName) continue;
    const id = normalizeEmployeeId(sourceName);
    const current = employeeMap.get(id) || { sourceName, confirmed: 0, cancelled: 0 };
    if (status === "confirmed") current.confirmed += 1;
    else current.cancelled += 1;
    employeeMap.set(id, current);
  }

  const hidden = new Set((settings.hiddenEmployees || []).map(normalizeEmployeeId));
  const displayNames = settings.employeeDisplayNames || {};
  const adjustments = settings.employeeAdjustments || {};

  const employees = Array.from(employeeMap.entries())
    .filter(([id]) => !hidden.has(id))
    .map(([id, value]) => {
      const adjustment = adjustments[id] || {};
      const employeeConfirmed = Math.max(0, value.confirmed + toFiniteInteger(adjustment.confirmedAdjustment));
      const employeeCancelled = Math.max(0, value.cancelled + toFiniteInteger(adjustment.cancelledAdjustment));
      const total = employeeConfirmed + employeeCancelled;
      return {
        id,
        name: String(displayNames[id] || value.sourceName).trim() || value.sourceName,
        confirmed: employeeConfirmed,
        cancelled: employeeCancelled,
        total,
        confirmationRate: percentage(employeeConfirmed, total),
      };
    })
    .sort((a, b) => b.confirmed - a.confirmed || b.total - a.total || a.name.localeCompare(b.name, "ar"));

  const classifiedTotal = confirmed + cancelled;
  const month = String(settings.reportMonth || "").trim();
  const year = String(settings.reportYear || "").trim();
  const periodLabel = [month, year].filter(Boolean).join(" / ") || "جميع البيانات المتاحة";

  return {
    generatedAt: new Date().toISOString(),
    updatedAt,
    period: { month, year, label: periodLabel },
    summary: {
      uploadedRecords: bookings.length,
      classifiedTotal,
      confirmed,
      cancelled,
      ignored,
      employeeCount: employees.length,
      confirmationRate: percentage(confirmed, classifiedTotal),
      cancelRate: percentage(cancelled, classifiedTotal),
    },
    employees,
  };
};
