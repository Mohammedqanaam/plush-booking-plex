import { getStore } from "@netlify/blobs";
import { croEnvironmentValue } from "./croEnvironment";
import { buildPeriodPhoneEntries, mobileLookupKey, type CroBookingRecord, type IndexedCroReservation } from "./croPhoneSearch";

type ArchivePeriod = { key: string; from: string; to: string; recordCount: number; indexedReservations: number; phoneColumnCount: number; updatedAt: string };
type PhoneArchive = { version: 1; updatedAt: string; periods: Record<string, ArchivePeriod>; entries: Record<string, IndexedCroReservation[]> };
export type PhoneArchiveStatus = {
  configured: boolean; searchAvailable: boolean; periodCount: number; indexedReservations: number;
  indexedMobiles: number; earliestFrom: string | null; latestTo: string | null; updatedAt: string | null;
  latestPeriodPhoneColumnCount: number;
};
const EPOCH = new Date(0).toISOString(); const MAX_PERIODS = 60;
const store = () => getStore({ name: "booking-phone-index", consistency: "strong" });
const secret = () => croEnvironmentValue("PHONE_SEARCH_SECRET") || croEnvironmentValue("CRO_SYNC_SECRET");
const empty = (): PhoneArchive => ({ version: 1, updatedAt: EPOCH, periods: {}, entries: {} });
const read = async () => {
  const value = await store().get("v1", { type: "json" }) as Partial<PhoneArchive> | null;
  return value?.version === 1 && value.periods && value.entries ? value as PhoneArchive : empty();
};
const removePeriod = (archive: PhoneArchive, key: string) => {
  delete archive.periods[key];
  for (const [hash, reservations] of Object.entries(archive.entries)) {
    const retained = reservations.filter((item) => item.periodKey !== key);
    if (retained.length) archive.entries[hash] = retained; else delete archive.entries[hash];
  }
};
const identity = (item: IndexedCroReservation) => [item.reservationId, item.confirmationNumber, item.hotelId || item.hotelName, item.arrivalDate, item.departureDate].join("|");
const sortDate = (item: IndexedCroReservation) => item.departureDate || item.arrivalDate || item.bookedDate;
const status = (archive: PhoneArchive, configured: boolean): PhoneArchiveStatus => {
  const periods = Object.values(archive.periods).sort((a, b) => a.from.localeCompare(b.from));
  const indexedReservations = periods.reduce((sum, period) => sum + period.indexedReservations, 0);
  const indexedMobiles = Object.keys(archive.entries).length;
  return { configured, searchAvailable: configured && indexedMobiles > 0, periodCount: periods.length, indexedReservations,
    indexedMobiles, earliestFrom: periods[0]?.from || null,
    latestTo: periods.reduce<string | null>((latest, item) => !latest || item.to > latest ? item.to : latest, null),
    updatedAt: archive.updatedAt === EPOCH ? null : archive.updatedAt,
    latestPeriodPhoneColumnCount: periods[periods.length - 1]?.phoneColumnCount || 0 };
};
export const updateBookingPhoneArchive = async (records: CroBookingRecord[], from: string, to: string) => {
  const archive = await read(); const keySecret = secret(); if (!keySecret) return status(archive, false);
  const periodKey = `${from}_${to}`; const built = buildPeriodPhoneEntries(records, { key: periodKey, from, to }, keySecret);
  if (!built.phoneColumns.length) return { ...status(archive, true), latestPeriodPhoneColumnCount: 0 };
  removePeriod(archive, periodKey);
  for (const [hash, additions] of Object.entries(built.entries)) {
    const unique = new Map<string, IndexedCroReservation>();
    for (const item of [...(archive.entries[hash] || []), ...additions]) unique.set(`${item.periodKey}|${identity(item)}`, item);
    archive.entries[hash] = Array.from(unique.values()).sort((a, b) => sortDate(b).localeCompare(sortDate(a))).slice(0, 100);
  }
  archive.periods[periodKey] = { key: periodKey, from, to, recordCount: records.length, indexedReservations: built.indexedReservations,
    phoneColumnCount: built.phoneColumns.length, updatedAt: new Date().toISOString() };
  const periods = Object.values(archive.periods).sort((a, b) => a.from.localeCompare(b.from));
  while (periods.length > MAX_PERIODS) { const oldest = periods.shift(); if (oldest) removePeriod(archive, oldest.key); }
  archive.updatedAt = new Date().toISOString(); await store().setJSON("v1", archive); return status(archive, true);
};
export const getBookingPhoneArchiveStatus = async () => status(await read(), Boolean(secret()));
export const searchBookingPhoneArchive = async (mobile: string) => {
  const archive = await read(); const keySecret = secret(); const hash = keySecret ? mobileLookupKey(mobile, keySecret) : null;
  const unique = new Map<string, IndexedCroReservation>();
  for (const item of hash ? archive.entries[hash] || [] : []) { const id = identity(item); const current = unique.get(id); if (!current || item.archivedTo > current.archivedTo) unique.set(id, item); }
  return { status: status(archive, Boolean(keySecret)), reservations: Array.from(unique.values()).sort((a, b) => sortDate(b).localeCompare(sortDate(a))).slice(0, 50) };
};
