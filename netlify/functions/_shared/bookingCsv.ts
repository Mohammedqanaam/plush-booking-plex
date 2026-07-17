import { getStore } from "@netlify/blobs";
import { updateBookingPhoneArchive, type PhoneArchiveStatus } from "./bookingPhoneArchive";

export type BookingRecord = Record<string, string>;

export type BookingStats = {
  total: number;
  confirmed: number;
  cancelled: number;
  cancelRate: number;
  updatedAt: string;
};
export type BookingSaveResult = BookingStats & { archive?: PhoneArchiveStatus };
export type BookingSaveOptions = { updateCurrent?: boolean; archivePeriod?: { from: string; to: string } };

export class BookingCsvError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "BookingCsvError";
    this.status = status;
  }
}

const MAX_CSV_BYTES = 5 * 1024 * 1024;
const MAX_CSV_ROWS = 50_000;

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

const parseRow = (line: string): string[] => {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (character === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }

  fields.push(current.trim());
  return fields;
};

export const parseBookingCsv = (text: string): BookingRecord[] => {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = parseRow(lines[0]).map((header) => header.replace(/^\uFEFF/, "").trim());
  return lines.slice(1).map((line) => {
    const values = parseRow(line);
    const record: BookingRecord = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || "";
    });
    return record;
  });
};

const getRecordValue = (record: BookingRecord, keys: string[]): string => {
  for (const key of keys) {
    if (record[key] && String(record[key]).trim()) return String(record[key]);
  }

  const normalizedTargets = keys.map(normalizeKey);
  for (const [rawKey, rawValue] of Object.entries(record)) {
    if (!String(rawValue).trim()) continue;
    const normalized = normalizeKey(rawKey);
    if (normalizedTargets.includes(normalized)) return String(rawValue);
    if (normalizedTargets.some((target) => (
      target.length >= 4
      && normalized.length >= 4
      && (normalized.includes(target) || target.includes(normalized))
    ))) {
      return String(rawValue);
    }
  }

  return "";
};

const bookingStatus = (record: BookingRecord) => getRecordValue(record, [
  "St",
  "All stute",
  "All Stute",
  "Status",
  "Booking Status",
  "BookingStatus",
  "حالة الحجز",
  "الحالة",
]);

const classifyStatus = (status: string): "confirmed" | "cancelled" | "ignored" => {
  const normalized = status.trim().toUpperCase();
  if (["M", "O", "N", "I"].includes(normalized)) return "confirmed";
  if (["C", "NS"].includes(normalized)) return "cancelled";
  if (/CONFIRMED?|مؤكد/i.test(status)) return "confirmed";
  if (/CANCEL|NO[\s-]?SHOW|ملغي|إلغاء|الغاء/i.test(status)) return "cancelled";
  return "ignored";
};

export const calculateBookingStats = (bookings: BookingRecord[]) => {
  let confirmed = 0;
  let cancelled = 0;

  for (const booking of bookings) {
    const category = classifyStatus(bookingStatus(booking));
    if (category === "confirmed") confirmed += 1;
    if (category === "cancelled") cancelled += 1;
  }

  return {
    total: bookings.length,
    confirmed,
    cancelled,
    cancelRate: bookings.length ? Number(((cancelled / bookings.length) * 100).toFixed(1)) : 0,
  };
};

export const saveBookingCsv = async (csvText: string, options: BookingSaveOptions = {}): Promise<BookingSaveResult> => {
  if (!csvText.trim()) throw new BookingCsvError("ملف الحجوزات فارغ.", 400);
  if (new TextEncoder().encode(csvText).byteLength > MAX_CSV_BYTES) {
    throw new BookingCsvError("حجم ملف الحجوزات يتجاوز 5 MB.", 413);
  }

  const bookings = parseBookingCsv(csvText);
  if (!bookings.length) throw new BookingCsvError("لم يتم العثور على بيانات صالحة في ملف الحجوزات.", 400);
  if (bookings.length > MAX_CSV_ROWS) {
    throw new BookingCsvError("عدد سجلات الحجوزات يتجاوز 50,000 سجل.", 413);
  }

  const stats: BookingStats = {
    ...calculateBookingStats(bookings),
    updatedAt: new Date().toISOString(),
  };
  const archive = options.archivePeriod ? await updateBookingPhoneArchive(bookings, options.archivePeriod.from, options.archivePeriod.to) : undefined;
  if (options.updateCurrent !== false) {
    const store = getStore("bookings"); await store.setJSON("data", bookings); await store.setJSON("stats", stats);
  }
  return { ...stats, ...(archive ? { archive } : {}) };
};
