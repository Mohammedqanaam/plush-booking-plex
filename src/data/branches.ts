import { masterHotels, type MasterHotel } from "@/data/hotelMasterData";

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
  return clean;
};

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

export const branches: Branch[] = masterHotels.map((hotel, index) => {
  const contacts: BranchContact[] = [];
  const hotelPhones = hotel.hotelPhone ? normalizeContactNumbers(hotel.hotelPhone) : [];
  const salesPhones = hotel.salesPhone ? normalizeContactNumbers(hotel.salesPhone) : [];
  hotelPhones.forEach((phone) => contacts.push({ label: "رقم الاستقبال", value: phone }));
  salesPhones.forEach((phone) => contacts.push({ label: "رقم المبيعات", value: phone }));

  return {
    id: hotel.id,
    name: hotel.name.trim(),
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
    sourceRowRef: `masterHotels[${index}]`,
    verificationStatus: computeStatus(hotel),
  };
});
