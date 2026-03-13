import { hotelBranches } from "@/data/hotels";
import { masterHotels } from "@/data/hotelMasterData";

export type BrandKey = "Braira" | "Boudl" | "Aber" | "Narcissus";

export type BranchRecord = {
  id: string;
  brand: BrandKey;
  branch: string;
  city: string;
  region: string;
  overview: string;
  receptionPhone: string;
  hotelPhone: string;
  salesPhone: string;
  hallPhone: string;
  whatsappNumber: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
  breakfastInfo: string;
  lunchInfo: string;
  dinnerInfo: string;
  poolInfo: string;
  poolHours: string;
  coffeeShopInfo: string;
  restaurantInfo: string;
  restaurantHours: string;
  balconyInfo: string;
  parkingInfo: string;
  kidsSectionInfo: string;
  jacuzziInfo: string;
  bathtubInfo: string;
  spaInfo: string;
  spaHours: string;
  laundryInfo: string;
  outdoorSeatingInfo: string;
  gymInfo: string;
  gymHours: string;
  roomTypes: string[];
  hallPackages: string[];
  notes: string;
  attachments: Array<{ title: string; type: "pdf" | "image" | "circular"; url: string }>;
  sourceFiles: string[];
  visibility: "public" | "internal";
  priority: number;
};

export type GlobalReference = {
  id: string;
  title: string;
  category: "Cancellation Policy" | "No Show Policy" | "Central Reservation Protocol" | "Circulars" | "Response Scripts";
  summary: string;
  responseProtocol: string;
  internalSteps: string[];
  relatedNotes?: string;
  attachmentUrl?: string;
};

const brandMap: Record<string, BrandKey> = {
  "بريرا": "Braira",
  "بودل": "Boudl",
  "عابر": "Aber",
  "نارسس": "Narcissus",
  "نارسيس": "Narcissus",
};

const regionMap: Record<string, string> = {
  "الرياض": "الوسطى",
  "جدة": "الغربية",
  "الخبر": "الشرقية",
  "الدمام": "الشرقية",
  "الأحساء": "الشرقية",
  "الجبيل": "الشرقية",
  "القصيم": "القصيم",
  "المجمعة": "الوسطى",
  "وادي الدواسر": "الوسطى",
  "أبها": "الجنوبية",
  "خميس مشيط": "الجنوبية",
  "جازان": "الجنوبية",
  "مكة": "الغربية",
  "الطائف": "الغربية",
  "حفر الباطن": "الشرقية",
};

const normalizeName = (name: string) => name
  .replace(/[أإآ]/g, "ا")
  .replace(/ى/g, "ي")
  .replace(/ة/g, "ه")
  .replace(/\s+/g, " ")
  .trim()
  .replace("قرطبه", "قرطبة")
  .replace("نارسس", "نارسيس");
const masterByName = new Map(masterHotels.map((h) => [normalizeName(h.name), h]));

const asText = (value: unknown) => (typeof value === "string" ? value : "");

const parseHours = (value: unknown) => {
  const text = asText(value);
  const match = text.match(/\d[^/]*[-–][^/\n]+|24\s*ساعة|24H/i);
const parseHours = (value: string) => {
  const match = value.match(/\d[^/]*[-–][^/\n]+|24\s*ساعة|24H/i);
  return match ? match[0].trim() : "غير محدد";
};

const toBranchRecord = (item: (typeof hotelBranches)[number], idx: number): BranchRecord => {
  const canonicalName = normalizeName(item.name);
  const master = masterByName.get(canonicalName);
  const brand = brandMap[item.group] ?? "Boudl";

  return {
    id: item.id,
    brand,
    branch: canonicalName,
    city: item.city,
    region: regionMap[item.city] ?? "غير محدد",
    overview: `${canonicalName} - ${item.city}`,
    receptionPhone: item.phone || "غير متوفر",
    hotelPhone: master?.hotelPhone ?? item.phone ?? "غير متوفر",
    salesPhone: master?.salesPhone ?? "غير متوفر",
    hallPhone: master?.salesPhone ?? "غير متوفر",
    whatsappNumber: master?.salesPhone ?? "غير متوفر",
    managerName: "غير محدد",
    managerPhone: "غير متوفر",
    managerEmail: "غير متوفر",
    breakfastInfo: asText(item.breakfast) || "غير متوفر",
    lunchInfo: "منيو حسب الطلب",
    dinnerInfo: "منيو حسب الطلب",
    poolInfo: asText(item.pool) || "غير متوفر",
    poolHours: parseHours(item.pool),
    coffeeShopInfo: asText(item.coffeeShop) || "غير متوفر",
    restaurantInfo: asText(item.restaurant) || "غير متوفر",
    restaurantHours: parseHours(item.restaurant),
    balconyInfo: asText(item.balcony) || "غير متوفر",
    parkingInfo: master?.parking ?? "غير متوفر",
    kidsSectionInfo: asText(item.kidsSection) || "غير متوفر",
    jacuzziInfo: asText(item.jacuzzi) || "غير متوفر",
    bathtubInfo: asText(item.jacuzzi).includes("بانيو") ? asText(item.jacuzzi) : "حسب نوع الغرفة",
    spaInfo: asText(item.spa) || "غير متوفر",
    spaHours: parseHours(item.spa),
    laundryInfo: asText(item.laundry) || "غير متوفر",
    outdoorSeatingInfo: asText(item.outdoorSeating) || "غير متوفر",
    breakfastInfo: item.breakfast,
    lunchInfo: "منيو حسب الطلب",
    dinnerInfo: "منيو حسب الطلب",
    poolInfo: item.pool,
    poolHours: parseHours(item.pool),
    coffeeShopInfo: item.coffeeShop,
    restaurantInfo: item.restaurant,
    restaurantHours: parseHours(item.restaurant),
    balconyInfo: item.balcony,
    parkingInfo: master?.parking ?? "غير متوفر",
    kidsSectionInfo: item.kidsSection,
    jacuzziInfo: item.jacuzzi,
    bathtubInfo: item.jacuzzi.includes("بانيو") ? item.jacuzzi : "حسب نوع الغرفة",
    spaInfo: item.spa,
    spaHours: parseHours(item.spa),
    laundryInfo: item.laundry,
    outdoorSeatingInfo: item.outdoorSeating,
    gymInfo: master?.gym ?? "غير متوفر",
    gymHours: parseHours(master?.gym ?? ""),
    roomTypes: master?.roomTypes ? master.roomTypes.split("،").map((t) => t.trim()).filter(Boolean) : ["غير متوفر"],
    hallPackages: [master?.meetingHall ?? "غير متوفر", master?.weddingPackage ?? "غير متوفر"],
    notes: "تم ترحيل البيانات من مصادر التشغيل الحالية مع توحيد أسماء الفروع.",
    attachments: [],
    sourceFiles: ["src/data/hotels.ts", "src/data/hotelMasterData.ts", "src/data/knowledge_bank_seed.json"],
    visibility: "public",
    priority: 1000 - idx,
  };
};

const deduped = new Map<string, BranchRecord>();
for (const [idx, row] of hotelBranches.entries()) {
  const branch = toBranchRecord(row, idx);
  const key = `${branch.brand}::${normalizeName(branch.branch)}`;
  if (!deduped.has(key)) deduped.set(key, branch);
}


const ensureBranch = (record: BranchRecord) => {
  const key = `${record.brand}::${normalizeName(record.branch)}`;
  if (!deduped.has(key)) deduped.set(key, record);
};

ensureBranch({
  ...toBranchRecord({ id: "nr-royal-alias", name: "نارسيس رويال", group: "نارسيس", city: "الرياض", phone: "114061515", pool: "غير محدد", breakfast: "غير محدد", restaurant: "غير محدد", coffeeShop: "غير محدد", balcony: "غير محدد", spa: "غير محدد", jacuzzi: "غير محدد", kidsSection: "غير محدد", laundry: "غير محدد", outdoorSeating: "غير محدد" }, 999),
  branch: "نارسيس رويال",
});
ensureBranch({
  ...toBranchRecord({ id: "nr-hamra-alias", name: "نارسيس الحمرا", group: "نارسيس", city: "جدة", phone: "122617700", pool: "غير محدد", breakfast: "غير محدد", restaurant: "غير محدد", coffeeShop: "غير محدد", balcony: "غير محدد", spa: "غير محدد", jacuzzi: "غير محدد", kidsSection: "غير محدد", laundry: "غير محدد", outdoorSeating: "غير محدد" }, 998),
  branch: "نارسيس الحمرا",
});
ensureBranch({
  ...toBranchRecord({ id: "nr-riyadh", name: "نارس الرياض", group: "نارسيس", city: "الرياض", phone: "112946300", pool: "--", breakfast: "--", restaurant: "--", coffeeShop: "--", balcony: "--", spa: "--", jacuzzi: "--", kidsSection: "--", laundry: "--", outdoorSeating: "--" }, 997),
  branch: "نارس الرياض",
});
ensureBranch({
  ...toBranchRecord({ id: "bd-shati-alias", name: "بودل الشاطي", group: "بودل", city: "الخبر", phone: "138091117", pool: "غير محدد", breakfast: "غير محدد", restaurant: "غير محدد", coffeeShop: "غير محدد", balcony: "غير محدد", spa: "غير محدد", jacuzzi: "غير محدد", kidsSection: "غير محدد", laundry: "غير محدد", outdoorSeating: "غير محدد" }, 996),
  branch: "بودل الشاطي",
});

export const branchRecords: BranchRecord[] = [...deduped.values()].sort((a, b) => a.brand.localeCompare(b.brand) || a.branch.localeCompare(b.branch));

export const branchesByBrand: Record<BrandKey, BranchRecord[]> = {
  Braira: branchRecords.filter((row) => row.brand === "Braira"),
  Boudl: branchRecords.filter((row) => row.brand === "Boudl"),
  Aber: branchRecords.filter((row) => row.brand === "Aber"),
  Narcissus: branchRecords.filter((row) => row.brand === "Narcissus"),
};

export const quickIntents = ["سياسة الإلغاء", "رقم الاستقبال", "الإفطار", "المسبح", "الغرف", "القاعات", "بروتوكول الرد"];

export const globalReferences: GlobalReference[] = [
  {
    id: "cancellation-policy",
    title: "سياسة الإلغاء",
    category: "Cancellation Policy",
    summary: "يتم تطبيق سياسة الإلغاء حسب نوع السعر وقناة الحجز، وغالبًا الإلغاء المجاني قبل 24 ساعة.",
    responseProtocol: "ابدأ بالتحقق من نوع الحجز (مسترد/غير مسترد) ثم اشرح للضيف آخر وقت للإلغاء دون رسوم.",
    internalSteps: ["التحقق من رقم الحجز", "تأكيد نافذة الإلغاء", "تحديث الحالة في النظام", "إرسال تأكيد للضيف"],
    relatedNotes: "في حال عدم الحضور تطبق سياسة No Show إن وجدت.",
    attachmentUrl: "/docs/policies/cancellation-policy.pdf",
  },
  {
    id: "no-show-policy",
    title: "سياسة عدم الحضور",
    category: "No Show Policy",
    summary: "عدم حضور الضيف بدون إلغاء مسبق قد ينتج عنه رسوم ليلة واحدة أو كامل الحجز حسب السياسة.",
    responseProtocol: "وضح للضيف الفرق بين الإلغاء وعدم الحضور، وراجع شروط الحجز قبل تأكيد أي رسوم.",
    internalSteps: ["التحقق من وقت الوصول", "مراجعة شروط السعر", "تسجيل الحالة No Show", "تصعيد الحالات الاستثنائية"],
  },
  {
    id: "central-reservation-protocol",
    title: "بروتوكول الحجز المركزي",
    category: "Central Reservation Protocol",
    summary: "إجراءات موحدة لموظفي الكول سنتر للتعامل مع الاستفسارات والحجوزات والتعديلات.",
    responseProtocol: "التزم بسيناريو الترحيب، ثم اجمع البيانات الأساسية، ثم اعرض الخيارات بدقة.",
    internalSteps: ["التحية والتحقق", "جمع البيانات", "تأكيد السعر والسياسات", "تثبيت الحجز"],
  },
  {
    id: "response-scripts",
    title: "الردود الجاهزة",
    category: "Response Scripts",
    summary: "نماذج ردود جاهزة للسياسات الشائعة، والخدمات، والتصعيد.",
    responseProtocol: "اختر النص الأقرب لحالة الضيف ثم خصّصه باسم الفرع والسياسة.",
    internalSteps: ["تحديد نية العميل", "اختيار السكربت", "التخصيص", "التوثيق"],
  },
];

export const branchInventoryByBrand = {
  Braira: branchesByBrand.Braira.map((b) => b.branch),
  Boudl: branchesByBrand.Boudl.map((b) => b.branch),
  Aber: branchesByBrand.Aber.map((b) => b.branch),
  Narcissus: branchesByBrand.Narcissus.map((b) => b.branch),
};
