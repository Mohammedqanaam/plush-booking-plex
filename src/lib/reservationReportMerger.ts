import { classifyBookingStatus } from "@/lib/bookingProcessor";

export type ReservationReportSource = "CRO" | "UNO" | "UNKNOWN";
export type RawReservationRow = Record<string, unknown>;

export type ParsedReservationReport = {
  fileName: string;
  source: ReservationReportSource;
  rows: RawReservationRow[];
};

export type MergedReservationRow = {
  "Reservation Number": string;
  "Agent name": string;
  Status: string;
  "Original Status": string;
  "Guest Name": string;
  Mobile: string;
  Hotel: string;
  "Booking Date": string;
  "Arrival Date": string;
  "Departure Date": string;
  "Room Type": string;
  Source: string;
  Conflict: string;
};

export type ReservationMergeResult = {
  rows: MergedReservationRow[];
  csv: string;
  files: Array<{ fileName: string; source: ReservationReportSource; rows: number }>;
  stats: {
    files: number;
    inputRows: number;
    uniqueRows: number;
    duplicatesRemoved: number;
    statusConflicts: number;
    withoutReservationNumber: number;
    confirmed: number;
    cancelled: number;
    ignored: number;
    sourceRows: Record<ReservationReportSource, number>;
  };
};

type NormalizedReservation = {
  reservationNumber: string;
  agent: string;
  status: string;
  originalStatus: string;
  guestName: string;
  mobile: string;
  hotel: string;
  bookingDate: string;
  arrivalDate: string;
  departureDate: string;
  roomType: string;
  updatedAt: string;
  sources: Set<ReservationReportSource>;
  conflict: boolean;
};

const MAX_REPORT_BYTES = 25 * 1024 * 1024;

const RESERVATION_NUMBER_KEYS = [
  "Reservation Number", "Reservation No", "Reservation #", "Reservation ID", "ReservationId",
  "Confirmation Number", "Confirmation No", "Confirmation #", "Booking Number", "Booking No", "Booking ID",
  "Reference Number", "Reference No", "Res No", "CRS Confirmation No", "رقم الحجز", "رقم التأكيد",
];
const AGENT_KEYS = [
  "Agent name", "Agent Name", "Agent", "Employee", "Employee Name", "User Name", "Username", "User",
  "Created By", "Created User", "Booked By", "Booking User", "Reservation Agent", "Reservation By",
  "Call Center Agent", "اسم الموظف", "الموظف", "اسم المندوب", "المندوب",
];
const STATUS_KEYS = [
  "All stute", "All Stute", "St", "Status", "Booking Status", "BookingStatus", "Reservation Status",
  "ReservationStatus", "حالة الحجز", "الحالة",
];
const GUEST_KEYS = ["Guest Name", "Guest", "Customer Name", "Primary Guest", "اسم الضيف", "اسم العميل"];
const MOBILE_KEYS = ["Mobile", "Mobile Number", "Phone", "Phone Number", "Guest Mobile", "Contact Number", "رقم الجوال", "رقم التواصل"];
const HOTEL_KEYS = ["Hotel", "Hotel Name", "Property", "Property Name", "Branch", "Branch Name", "Hotel Code", "Property Code", "الفندق", "الفرع"];
const BOOKING_DATE_KEYS = ["Booking Date", "Reservation Date", "Booked On", "Created Date", "Creation Date", "Create Date", "تاريخ الحجز"];
const ARRIVAL_KEYS = ["Arrival", "Arrival Date", "Check In", "Check-in", "Checkin", "Check In Date", "تاريخ الوصول", "تاريخ الدخول"];
const DEPARTURE_KEYS = ["Departure", "Departure Date", "Check Out", "Check-out", "Checkout", "Check Out Date", "تاريخ المغادرة", "تاريخ الخروج"];
const ROOM_TYPE_KEYS = ["Room Type", "RoomType", "Room Category", "Accommodation", "نوع الغرفة"];
const UPDATED_AT_KEYS = ["Updated At", "Updated Date", "Last Updated", "Modified At", "Modified Date", "Last Modification", "تاريخ التحديث"];

const ALL_HEADER_ALIASES = [
  ...RESERVATION_NUMBER_KEYS,
  ...AGENT_KEYS,
  ...STATUS_KEYS,
  ...GUEST_KEYS,
  ...MOBILE_KEYS,
  ...HOTEL_KEYS,
  ...BOOKING_DATE_KEYS,
  ...ARRIVAL_KEYS,
  ...DEPARTURE_KEYS,
  ...ROOM_TYPE_KEYS,
  ...UPDATED_AT_KEYS,
];

const normalizeKey = (value: string) => value
  .replace(/^\uFEFF/, "")
  .toLocaleLowerCase("en")
  .replace(/[\u064B-\u0652]/g, "")
  .replace(/[أإآ]/g, "ا")
  .replace(/ة/g, "ه")
  .replace(/ى/g, "ي")
  .replace(/[^a-z0-9\u0600-\u06FF]+/gi, "")
  .trim();

const NORMALIZED_HEADERS = new Set(ALL_HEADER_ALIASES.map(normalizeKey));

const valueText = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();

const getValue = (row: RawReservationRow, aliases: string[]): string => {
  for (const alias of aliases) {
    const value = valueText(row[alias]);
    if (value) return value;
  }

  const targets = aliases.map(normalizeKey);
  for (const [rawKey, rawValue] of Object.entries(row)) {
    const value = valueText(rawValue);
    if (!value) continue;
    const key = normalizeKey(rawKey);
    if (targets.includes(key)) return value;
    if (targets.some((target) => target.length >= 5 && key.length >= 5 && (target.includes(key) || key.includes(target)))) return value;
  }
  return "";
};

export const normalizeReservationStatus = (value: unknown): string => {
  const original = valueText(value);
  const upper = original.toUpperCase().replace(/[_.-]+/g, " ").replace(/\s+/g, " ").trim();
  if (["M", "O", "N", "I", "C", "NS"].includes(upper)) return upper;
  if (/NO\s*SHOW|NOSHOW|عدم\s*حضور/i.test(original)) return "NS";
  if (/CANCEL|CANCELED|CANCELLED|ملغ|الغاء|إلغاء/i.test(original)) return "C";
  if (/MODIF|AMEND|تعديل|معدل/i.test(original)) return "M";
  if (/CHECK\s*IN|CHECKED\s*IN|IN\s*HOUSE|INHOUSE|داخل\s*الفندق/i.test(original)) return "I";
  if (/CHECK\s*OUT|CHECKED\s*OUT|COMPLETED|DEPARTED|مغادر/i.test(original)) return "O";
  if (/CONFIRM|BOOKED|NEW|مؤكد|محجوز/i.test(original)) return "N";
  return upper;
};

export const detectReservationReportSource = (fileName: string, rows: RawReservationRow[]): ReservationReportSource => {
  const normalizedName = fileName.toLowerCase();
  if (/\buno\b|completed[-_ ]?reservations|rategain/.test(normalizedName)) return "UNO";
  if (/\bcro\b|windsurfer|shr[-_ ]?cro/.test(normalizedName)) return "CRO";

  const headers = new Set(rows.slice(0, 10).flatMap((row) => Object.keys(row).map(normalizeKey)));
  if (headers.has(normalizeKey("All stute")) || headers.has(normalizeKey("Agent name"))) return "CRO";
  const unoSignals = ["Created By", "Reservation Status", "Property Name"].filter((key) => headers.has(normalizeKey(key))).length;
  return unoSignals >= 2 ? "UNO" : "UNKNOWN";
};

const buildRowsFromMatrix = (matrix: unknown[][]): RawReservationRow[] => {
  if (!matrix.length) return [];
  const searchLimit = Math.min(matrix.length, 20);
  let headerIndex = -1;
  let bestScore = 0;

  for (let index = 0; index < searchLimit; index += 1) {
    const cells = (matrix[index] || []).map(valueText);
    const score = cells.reduce((total, cell) => total + (NORMALIZED_HEADERS.has(normalizeKey(cell)) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      headerIndex = index;
    }
  }

  if (headerIndex < 0 || bestScore < 2) {
    headerIndex = matrix.findIndex((row) => (row || []).filter((cell) => valueText(cell)).length >= 2);
  }
  if (headerIndex < 0) return [];

  const seen = new Map<string, number>();
  const headers = (matrix[headerIndex] || []).map((cell, index) => {
    const base = valueText(cell) || `Column ${index + 1}`;
    const count = (seen.get(base) || 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base} (${count})`;
  });

  return matrix.slice(headerIndex + 1).flatMap((cells) => {
    if (!(cells || []).some((cell) => valueText(cell))) return [];
    const row: RawReservationRow = {};
    headers.forEach((header, index) => {
      row[header] = valueText(cells?.[index]);
    });
    return [row];
  });
};

export const parseReservationReportFile = async (file: File): Promise<ParsedReservationReport> => {
  if (file.size > MAX_REPORT_BYTES) throw new Error(`${file.name}: حجم الملف أكبر من 25 MB.`);

  const XLSX = await import("@e965/xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false, raw: false });
  let bestRows: RawReservationRow[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false, blankrows: false });
    const rows = buildRowsFromMatrix(matrix);
    if (rows.length > bestRows.length) bestRows = rows;
  }

  if (!bestRows.length) throw new Error(`${file.name}: لم يتم العثور على صفوف حجوزات.`);
  return { fileName: file.name, source: detectReservationReportSource(file.name, bestRows), rows: bestRows };
};

const normalizeRow = (row: RawReservationRow, source: ReservationReportSource): NormalizedReservation | null => {
  const originalStatus = getValue(row, STATUS_KEYS);
  const normalized: NormalizedReservation = {
    reservationNumber: getValue(row, RESERVATION_NUMBER_KEYS),
    agent: getValue(row, AGENT_KEYS),
    status: normalizeReservationStatus(originalStatus),
    originalStatus,
    guestName: getValue(row, GUEST_KEYS),
    mobile: getValue(row, MOBILE_KEYS),
    hotel: getValue(row, HOTEL_KEYS),
    bookingDate: getValue(row, BOOKING_DATE_KEYS),
    arrivalDate: getValue(row, ARRIVAL_KEYS),
    departureDate: getValue(row, DEPARTURE_KEYS),
    roomType: getValue(row, ROOM_TYPE_KEYS),
    updatedAt: getValue(row, UPDATED_AT_KEYS),
    sources: new Set([source]),
    conflict: false,
  };
  return Object.values(normalized).some((value) => typeof value === "string" && value) ? normalized : null;
};

const statusCategory = (status: string) => classifyBookingStatus(status);

const timeValue = (value: string) => {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const completeness = (row: NormalizedReservation) => [
  row.reservationNumber, row.agent, row.status, row.guestName, row.mobile, row.hotel,
  row.bookingDate, row.arrivalDate, row.departureDate, row.roomType, row.updatedAt,
].filter(Boolean).length;

const mergeDuplicate = (current: NormalizedReservation, incoming: NormalizedReservation): NormalizedReservation => {
  const currentCategory = statusCategory(current.status);
  const incomingCategory = statusCategory(incoming.status);
  const conflict = current.conflict || incoming.conflict
    || (currentCategory !== "ignored" && incomingCategory !== "ignored" && currentCategory !== incomingCategory);

  const currentTime = timeValue(current.updatedAt);
  const incomingTime = timeValue(incoming.updatedAt);
  let preferred = current;
  let secondary = incoming;

  if ((incomingTime && (!currentTime || incomingTime > currentTime))
    || (!incomingTime && !currentTime && incomingCategory === "cancelled" && currentCategory === "confirmed")
    || (currentCategory === "ignored" && incomingCategory !== "ignored")
    || (currentCategory === incomingCategory && completeness(incoming) > completeness(current))) {
    preferred = incoming;
    secondary = current;
  }

  const combined: NormalizedReservation = { ...preferred, sources: new Set([...current.sources, ...incoming.sources]), conflict };
  const fillKeys: Array<keyof Pick<NormalizedReservation, "reservationNumber" | "agent" | "status" | "originalStatus" | "guestName" | "mobile" | "hotel" | "bookingDate" | "arrivalDate" | "departureDate" | "roomType" | "updatedAt">> = [
    "reservationNumber", "agent", "status", "originalStatus", "guestName", "mobile", "hotel",
    "bookingDate", "arrivalDate", "departureDate", "roomType", "updatedAt",
  ];
  fillKeys.forEach((key) => {
    if (!combined[key] && secondary[key]) combined[key] = secondary[key];
  });
  return combined;
};

const CSV_HEADERS: Array<keyof MergedReservationRow> = [
  "Reservation Number", "Agent name", "Status", "Original Status", "Guest Name", "Mobile", "Hotel",
  "Booking Date", "Arrival Date", "Departure Date", "Room Type", "Source", "Conflict",
];

const csvCell = (value: string) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export const reservationRowsToCsv = (rows: MergedReservationRow[]) => `\uFEFF${[
  CSV_HEADERS.map(csvCell).join(","),
  ...rows.map((row) => CSV_HEADERS.map((header) => csvCell(row[header])).join(",")),
].join("\r\n")}`;

export const mergeReservationReports = (reports: ParsedReservationReport[]): ReservationMergeResult => {
  const merged = new Map<string, NormalizedReservation>();
  let inputRows = 0;
  let duplicatesRemoved = 0;
  let withoutReservationNumber = 0;
  let syntheticId = 0;
  const sourceRows: Record<ReservationReportSource, number> = { CRO: 0, UNO: 0, UNKNOWN: 0 };

  reports.forEach((report) => {
    sourceRows[report.source] += report.rows.length;
    report.rows.forEach((rawRow) => {
      const row = normalizeRow(rawRow, report.source);
      if (!row) return;
      inputRows += 1;
      const reservationKey = normalizeKey(row.reservationNumber);
      const key = reservationKey ? `reservation:${reservationKey}` : `row:${syntheticId++}`;
      if (!reservationKey) withoutReservationNumber += 1;
      const existing = merged.get(key);
      if (existing) {
        duplicatesRemoved += 1;
        merged.set(key, mergeDuplicate(existing, row));
      } else {
        merged.set(key, row);
      }
    });
  });

  const rows: MergedReservationRow[] = Array.from(merged.values()).map((row) => ({
    "Reservation Number": row.reservationNumber,
    "Agent name": row.agent,
    Status: row.status,
    "Original Status": row.originalStatus,
    "Guest Name": row.guestName,
    Mobile: row.mobile,
    Hotel: row.hotel,
    "Booking Date": row.bookingDate,
    "Arrival Date": row.arrivalDate,
    "Departure Date": row.departureDate,
    "Room Type": row.roomType,
    Source: Array.from(row.sources).filter((source) => source !== "UNKNOWN").sort().join(" + ") || "UNKNOWN",
    Conflict: row.conflict ? "YES" : "",
  }));

  let confirmed = 0;
  let cancelled = 0;
  let ignored = 0;
  let statusConflicts = 0;
  rows.forEach((row) => {
    const category = classifyBookingStatus(row.Status);
    if (category === "confirmed") confirmed += 1;
    else if (category === "cancelled") cancelled += 1;
    else ignored += 1;
    if (row.Conflict) statusConflicts += 1;
  });

  return {
    rows,
    csv: reservationRowsToCsv(rows),
    files: reports.map((report) => ({ fileName: report.fileName, source: report.source, rows: report.rows.length })),
    stats: {
      files: reports.length,
      inputRows,
      uniqueRows: rows.length,
      duplicatesRemoved,
      statusConflicts,
      withoutReservationNumber,
      confirmed,
      cancelled,
      ignored,
      sourceRows,
    },
  };
};
