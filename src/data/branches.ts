import { masterHotels, type MasterHotel } from "@/data/hotelMasterData";
import { hotelBranches } from "@/data/hotels";
import { normalizeSheetHotelName, sheetOperationalHotels } from "@/data/sheetOperationalData";

export type BranchVerificationStatus = "verified" | "partially_verified" | "conflicting" | "missing_info";

export type BranchContact = {
  label: string;
  value: string;
};

export type BranchServices = {
  breakfast: string;
  pool: string;
  coffeeShop: string;
  restaurant: string;
  viewOrBalcony: string;
  parking: string;
  meetingRoom: string;
  weddingPackage: string;
  gym: string;
  laundry: string;
  outdoorSeating: string;
  spa: string;
  jacuzzi: string;
  kidsArea: string;
};

export type Branch = {
  id: string;
  name: string;
  city: string;
  brand: string;
  phone?: string;
  alternatePhone?: string;
  contacts: BranchContact[];
  services: BranchServices;
  notes?: string;
  sourceRowRef: string;
  verificationStatus: BranchVerificationStatus;
};

const EMPTY_MARKERS = new Set(["", "-", "--", "*", "غير متاح حالياً", "غير متاح"]);

const normalizePhone = (input: string): string => {
  const digits = input.replace(/[^\d+]/g, "");
  if (!digits) return input.trim();
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("966")) return `+${digits}`;
  if (digits.startsWith("0")) return `+966${digits.slice(1)}`;
  if (digits.length === 9) return `+966${digits}`;
  return digits;
};

const isValidNormalizedPhone = (value: string): boolean => {
  const digits = value.replace(/[^\d]/g, "");
  return digits.length >= 9 && digits.length <= 15;
};

const normalizeContactNumbers = (input: string): string[] =>
  input
    // Split on forward slash and Arabic comma to capture multi-number cells from the source sheet.
    .split(/[/،]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/(\+?\d[\d\s-]{7,}\d)/);
      if (!match) return "";
      return normalizePhone(match[1]);
    })
    .filter((value) => value && isValidNormalizedPhone(value));

const isMissing = (value: string) => EMPTY_MARKERS.has(value.trim());

const normalizeServiceValue = (value: string): string => {
  const clean = value.trim();
  if (isMissing(clean)) return "غير متوفر";
  if (["لايوجد", "لا يوجد", "لا"].includes(clean)) return "غير متوفر";
  if (["يوجد", "نعم"].includes(clean)) return "متوفر";
  return clean
    .replace(/افطار/g, "إفطار")
    .replace(/اطفال/g, "أطفال")
    .replace(/لايوجد/g, "لا يوجد")
    .replace(/غيرمحدد/g, "غير محدد")
    .replace(/24H/gi, "24 ساعة")
    .replace(/24س\b/g, "24 ساعة")
    .replace(/\s+/g, " ")
    .trim();
};

const hotelBranchByName = new Map(hotelBranches.map((hotel) => [normalizeSheetHotelName(hotel.name), hotel]));
const masterHotelByName = new Map(masterHotels.map((hotel) => [normalizeSheetHotelName(hotel.name), hotel]));

const inferBrand = (name: string) => {
  if (name.startsWith("بريرا")) return "بريرا";
  if (name.startsWith("عابر")) return "عابر";
  if (name.startsWith("نارس")) return "نارسيس";
  if (name.startsWith("زمن")) return "زمن";
  return "بودل";
};

const canonicalBranchName = (name: string) => name
  .replace(/قرطبه/g, "قرطبة")
  .replace(/المجمعه/g, "المجمعة")
  .replace(/الاحساء/g, "الأحساء")
  .replace(/مكة اجياد/g, "مكة أجياد")
  .replace(/^نارسس/g, "نارسيس")
  .replace(/\s+/g, " ")
  .trim()
  .replace(/^بودل الشاطي$/, "بودل الشاطئ")
  .replace(/^بودل روضة بريدة$/, "بودل الروضة")
  .replace(/^نارسيس الحمرا$/, "نارسيس الحمراء")
  .replace(/^نارسيس ذا رويال$/, "نارسيس رويال")
  .replace(/^نارسيس الرياض$/, "نارس الرياض");

const sheetHotels: MasterHotel[] = sheetOperationalHotels.map((row, index) => {
  const key = normalizeSheetHotelName(row.name);
  const master = masterHotelByName.get(key);
  const hotel = hotelBranchByName.get(key);
  return {
    id: master?.id ?? hotel?.id ?? `sheet-hotel-${index + 1}`,
    name: canonicalBranchName(row.name),
    brand: master?.brand ?? hotel?.group ?? inferBrand(row.name),
    city: master?.city ?? hotel?.city ?? "غير محدد",
    breakfast: row.breakfast,
    pool: row.pool,
    coffeeShop: row.coffeeShop,
    restaurant: row.restaurant,
    viewBalcony: row.viewBalcony,
    parking: row.parking,
    meetingHall: row.meetingHall,
    weddingPackage: row.weddingPackage,
    gym: row.gym,
    laundry: row.laundry,
    outdoorSeating: row.outdoorSeating,
    spa: row.spa,
    jacuzzi: row.jacuzzi,
    kidsSection: row.kidsSection,
    hotelPhone: master?.hotelPhone ?? hotel?.phone,
    salesPhone: master?.salesPhone,
    roomTypes: master?.roomTypes,
  };
});

const sheetHotelNames = new Set(sheetHotels.map((hotel) => normalizeSheetHotelName(hotel.name)));
const branchSourceHotels = [...sheetHotels, ...masterHotels.filter((hotel) => !sheetHotelNames.has(normalizeSheetHotelName(hotel.name)))];

const computeStatus = (hotel: MasterHotel): BranchVerificationStatus => {
  const values = [
    hotel.breakfast,
    hotel.pool,
    hotel.coffeeShop,
    hotel.restaurant,
    hotel.parking,
    hotel.meetingHall,
    hotel.weddingPackage,
    hotel.gym,
    hotel.laundry,
    hotel.outdoorSeating,
    hotel.spa,
    hotel.jacuzzi,
    hotel.kidsSection,
  ];

  const missingCount = values.filter((v) => isMissing(v)).length;
  const hasTemporaryServiceOutage = values.some((v) => /تحت الإنشاء|صيانة/.test(v));
  const hasConditionalService = values.some((v) => /حسب الإمكانية|غير محدد|\*/.test(v));

  if (hasTemporaryServiceOutage) return "conflicting";
  if (missingCount >= 6) return "missing_info";
  if (hasConditionalService) return "partially_verified";
  if (missingCount > 0) return "partially_verified";
  return "verified";
};

const branchRows: Branch[] = branchSourceHotels.map((hotel, index) => {
  const contacts: BranchContact[] = [];
  const hotelPhones = hotel.hotelPhone ? normalizeContactNumbers(hotel.hotelPhone) : [];
  const salesPhones = hotel.salesPhone ? normalizeContactNumbers(hotel.salesPhone) : [];
  hotelPhones.forEach((phone) => contacts.push({ label: "رقم الاستقبال", value: phone }));
  salesPhones.forEach((phone) => contacts.push({ label: "رقم المبيعات", value: phone }));

  return {
    id: hotel.id,
    name: canonicalBranchName(hotel.name),
    city: hotel.city.trim(),
    brand: hotel.brand.trim(),
    ...(hotelPhones[0] ? { phone: hotelPhones[0] } : {}),
    ...(salesPhones[0] ? { alternatePhone: salesPhones[0] } : {}),
    contacts,
    services: {
      breakfast: normalizeServiceValue(hotel.breakfast),
      pool: normalizeServiceValue(hotel.pool),
      coffeeShop: normalizeServiceValue(hotel.coffeeShop),
      restaurant: normalizeServiceValue(hotel.restaurant),
      viewOrBalcony: normalizeServiceValue(hotel.viewBalcony),
      parking: normalizeServiceValue(hotel.parking),
      meetingRoom: normalizeServiceValue(hotel.meetingHall),
      weddingPackage: normalizeServiceValue(hotel.weddingPackage),
      gym: normalizeServiceValue(hotel.gym),
      laundry: normalizeServiceValue(hotel.laundry),
      outdoorSeating: normalizeServiceValue(hotel.outdoorSeating),
      spa: normalizeServiceValue(hotel.spa),
      jacuzzi: normalizeServiceValue(hotel.jacuzzi),
      kidsArea: normalizeServiceValue(hotel.kidsSection),
    },
    sourceRowRef: index < sheetHotels.length ? `Google Sheets / hotels data / row ${index + 2}` : `masterHotels[${index - sheetHotels.length}]`,
    verificationStatus: computeStatus(hotel),
  };
});

const dedupedBranches = new Map<string, Branch>();
for (const branch of branchRows) {
  const key = normalizeSheetHotelName(canonicalBranchName(branch.name));
  if (!dedupedBranches.has(key)) dedupedBranches.set(key, branch);
}

export const branches: Branch[] = [...dedupedBranches.values()];
