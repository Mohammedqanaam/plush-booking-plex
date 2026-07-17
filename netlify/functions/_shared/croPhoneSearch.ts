import { createHmac } from "node:crypto";

export type CroBookingRecord = Record<string, string | number | undefined>;
export type CroReservationSummary = {
  confirmationNumber: string; reservationId: string; guestName: string; status: string;
  bookedDate: string; arrivalDate: string; departureDate: string; hotelId: string;
  hotelName: string; roomType: string; roomNumber: string; numberOfRooms: number | null;
};
export type IndexedCroReservation = CroReservationSummary & {
  periodKey: string; archivedFrom: string; archivedTo: string;
};

const PHONE_COLUMN_PATTERN = /(phone|mobile|telephone|cellphone|cellular|contactphone|guestcontact|جوال|هاتف|تليفون|تلفون|رقمالتواصل)/i;
const normalizeArabicDigits = (value: string) => value
  .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
  .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
const normalizeKey = (value: string) => value.replace(/^\uFEFF/, "").toLowerCase()
  .replace(/[\u064B-\u0652]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي")
  .replace(/[^a-z0-9\u0600-\u06ff]+/g, "").trim();

export const normalizeSaudiMobile = (value: string): string | null => {
  let digits = normalizeArabicDigits(value).replace(/\D/g, "");
  if (digits.startsWith("00966")) digits = digits.slice(2);
  if (/^05\d{8}$/.test(digits)) digits = "966" + digits.slice(1);
  if (/^5\d{8}$/.test(digits)) digits = "966" + digits;
  return /^9665\d{8}$/.test(digits) ? digits : null;
};
export const isPhoneColumn = (header: string) => {
  const normalized = normalizeKey(header);
  return PHONE_COLUMN_PATTERN.test(normalized) || /^(tel|telno|telnum|telnumber|contact|contactno|contactnumber)$/.test(normalized);
};
export const findPhoneColumns = (records: CroBookingRecord[]): string[] => {
  const columns = new Set<string>();
  for (const record of records.slice(0, 250)) for (const key of Object.keys(record)) if (isPhoneColumn(key)) columns.add(key);
  return Array.from(columns);
};
export const extractSaudiMobiles = (value: unknown): string[] => {
  if (typeof value !== "string" && typeof value !== "number") return [];
  const text = normalizeArabicDigits(String(value));
  const candidates = new Set<string>();
  const full = normalizeSaudiMobile(text); if (full) candidates.add(full);
  for (const match of text.match(/(?:\+?966|00966|0)?5(?:[\s()./-]*\d){8}/g) || []) {
    const normalized = normalizeSaudiMobile(match); if (normalized) candidates.add(normalized);
  }
  return Array.from(candidates);
};
const recordValue = (record: CroBookingRecord, keys: string[]): string => {
  for (const key of keys) { const value = record[key]; if (value !== undefined && String(value).trim()) return String(value).trim(); }
  const targets = keys.map(normalizeKey);
  for (const [key, value] of Object.entries(record)) if (value !== undefined && String(value).trim() && targets.includes(normalizeKey(key))) return String(value).trim();
  return "";
};
const numberValue = (value: string) => value.trim() && Number.isFinite(Number(value)) ? Number(value) : null;
export const summarizeCroReservation = (record: CroBookingRecord): CroReservationSummary => {
  const first = recordValue(record, ["First", "First Name", "Given Name", "الاسم الأول", "الاسم"]);
  const last = recordValue(record, ["Last", "Last Name", "Surname", "اسم العائلة", "العائلة"]);
  const direct = recordValue(record, ["Guest Name", "Guest", "Customer Name", "اسم الضيف", "اسم العميل"]);
  return {
    confirmationNumber: recordValue(record, ["Confirmation Number", "Confirmation No", "Confirmation", "Conf No", "Conf #", "رقم التأكيد"]),
    reservationId: recordValue(record, ["Resv ID", "Reservation ID", "Reservation Number", "Reservation No", "Res ID", "رقم الحجز"]),
    guestName: direct || [first, last].filter(Boolean).join(" "),
    status: recordValue(record, ["St", "Status", "Booking Status", "All stute", "الحالة", "حالة الحجز"]),
    bookedDate: recordValue(record, ["Booked Time", "Booking Date", "Booked Date", "تاريخ الحجز"]),
    arrivalDate: recordValue(record, ["Check In", "Check-In", "CheckIn", "Arrival Date", "Arrival", "تاريخ الوصول"]),
    departureDate: recordValue(record, ["Check Out", "Check-Out", "CheckOut", "Departure Date", "Departure", "تاريخ المغادرة"]),
    hotelId: recordValue(record, ["Hotel ID", "Hotel Code", "Property ID", "كود الفندق"]),
    hotelName: recordValue(record, ["Hotel", "Hotel Name", "Property", "اسم الفندق", "الفرع"]),
    roomType: recordValue(record, ["Room Type", "Room", "Room Code", "نوع الغرفة"]),
    roomNumber: recordValue(record, ["Room Number", "Room No", "Room #", "رقم الغرفة"]),
    numberOfRooms: numberValue(recordValue(record, ["Rooms", "Number of Rooms", "No. Rooms", "عدد الغرف"])),
  };
};
export const mobileLookupKey = (mobile: string, secret: string) => {
  const normalized = normalizeSaudiMobile(mobile);
  return normalized && secret ? createHmac("sha256", secret).update(normalized).digest("hex") : null;
};
export const buildPeriodPhoneEntries = (records: CroBookingRecord[], period: { key: string; from: string; to: string }, secret: string) => {
  const phoneColumns = findPhoneColumns(records); const entries: Record<string, IndexedCroReservation[]> = {}; let indexedReservations = 0;
  for (const record of records) {
    const keys = new Set<string>();
    for (const column of phoneColumns) for (const mobile of extractSaudiMobiles(record[column])) { const key = mobileLookupKey(mobile, secret); if (key) keys.add(key); }
    if (!keys.size) continue;
    const reservation = { ...summarizeCroReservation(record), periodKey: period.key, archivedFrom: period.from, archivedTo: period.to };
    for (const key of keys) entries[key] = [...(entries[key] || []), reservation];
    indexedReservations += 1;
  }
  return { entries, phoneColumns, indexedReservations };
};
