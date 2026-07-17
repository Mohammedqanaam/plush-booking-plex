import { hotelBranches } from "@/data/hotels";
import { masterHotels } from "@/data/hotelMasterData";
import knowledgeSeed from "@/data/knowledge_bank_seed.json";
import {
  getSheetHallContact,
  getSheetMealInfo,
  getSheetOperationalHotel,
  HOTEL_INFORMATION_SHEET_URL,
} from "@/data/sheetOperationalData";

export type BrandKey = "Braira" | "Boudl" | "Aber" | "Narcissus" | "Z'MN";

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
  roomSource: "internal" | "unverified";
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
  category: string;
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
  "زمـن": "Z'MN",
  "زمن": "Z'MN",
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
const normalizeKey = (name: string) => canonicalBranchName(name)
  .replace(/[أإآ]/g, "ا")
  .replace(/ى/g, "ي")
  .replace(/ة/g, "ه")
  .replace(/\s+/g, " ")
  .trim();
const masterByName = new Map(masterHotels.map((hotel) => [normalizeKey(hotel.name), hotel]));
const seedRoomTypesByBranch = new Map<string, string[]>();
for (const room of knowledgeSeed.room_types) {
  const key = normalizeKey(room.branch);
  const roomType = room.room_type
    .replace(/^Premuim\b/i, "Premium")
    .replace(/^Delux\b/i, "Deluxe")
    .trim();
  const label = room.room_size?.trim() ? `${roomType} · ${room.room_size.trim()}` : roomType;
  const current = seedRoomTypesByBranch.get(key) ?? [];
  if (!current.includes(label)) current.push(label);
  seedRoomTypesByBranch.set(key, current);
}

const asText = (value: unknown) => (typeof value === "string" ? value : "");

const cleanOperationalText = (value: unknown, fallback = "غير محدد") => {
  const text = asText(value).trim();
  if (!text || ["-", "--", "*"].includes(text)) return fallback;
  return text
    .replace(/افطار/g, "إفطار")
    .replace(/لايوجد/g, "لا يوجد")
    .replace(/غيرمحدد/g, "غير محدد")
    .replace(/24H/gi, "24 ساعة")
    .replace(/\s+/g, " ")
    .trim();
};

const parseHours = (value: unknown) => {
  const text = asText(value);
  const match = text.match(/\d[^/]*[-–][^/\n]+|24\s*ساعة|24H/i);
  return match ? match[0].trim() : "غير محدد";
};

const toBranchRecord = (item: (typeof hotelBranches)[number], idx: number): BranchRecord => {
  const canonicalName = canonicalBranchName(item.name);
  const lookupKey = normalizeKey(item.name);
  const master = masterByName.get(lookupKey);
  const operational = getSheetOperationalHotel(canonicalName);
  const meals = getSheetMealInfo(canonicalName);
  const hallContact = getSheetHallContact(canonicalName);
  const brand = brandMap[item.group] ?? "Boudl";
  const breakfast = cleanOperationalText(operational?.breakfast ?? item.breakfast, "غير متوفر");
  const mealBreakfast = cleanOperationalText(meals?.breakfast, "");
  const seedRoomTypes = seedRoomTypesByBranch.get(lookupKey) ?? [];
  const roomTypes = seedRoomTypes.length
    ? seedRoomTypes
    : master?.roomTypes?.split("،").map((type) => type.trim()).filter(Boolean) ?? [];

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
    hallPhone: cleanOperationalText(hallContact?.phone ?? master?.salesPhone, "غير متوفر"),
    whatsappNumber: master?.salesPhone ?? "غير متوفر",
    managerName: "غير محدد",
    managerPhone: "غير متوفر",
    managerEmail: "غير متوفر",
    breakfastInfo: mealBreakfast ? `${breakfast} | الأسعار: ${mealBreakfast}` : breakfast,
    lunchInfo: cleanOperationalText(meals?.lunch, "يرجى التحقق من الفرع"),
    dinnerInfo: cleanOperationalText(meals?.dinner, "يرجى التحقق من الفرع"),
    poolInfo: cleanOperationalText(operational?.pool ?? item.pool, "غير متوفر"),
    poolHours: parseHours(operational?.pool ?? item.pool),
    coffeeShopInfo: cleanOperationalText(operational?.coffeeShop ?? item.coffeeShop, "غير متوفر"),
    restaurantInfo: cleanOperationalText(operational?.restaurant ?? item.restaurant, "غير متوفر"),
    restaurantHours: parseHours(operational?.restaurant ?? item.restaurant),
    balconyInfo: cleanOperationalText(operational?.viewBalcony ?? item.balcony, "غير متوفر"),
    parkingInfo: cleanOperationalText(operational?.parking ?? master?.parking, "غير متوفر"),
    kidsSectionInfo: cleanOperationalText(operational?.kidsSection ?? item.kidsSection, "غير متوفر"),
    jacuzziInfo: cleanOperationalText(operational?.jacuzzi ?? item.jacuzzi, "غير متوفر"),
    bathtubInfo: cleanOperationalText(operational?.jacuzzi ?? item.jacuzzi).includes("بانيو") ? cleanOperationalText(operational?.jacuzzi ?? item.jacuzzi) : "حسب نوع الغرفة",
    spaInfo: cleanOperationalText(operational?.spa ?? item.spa, "غير متوفر"),
    spaHours: parseHours(operational?.spa ?? item.spa),
    laundryInfo: cleanOperationalText(operational?.laundry ?? item.laundry, "غير متوفر"),
    outdoorSeatingInfo: cleanOperationalText(operational?.outdoorSeating ?? item.outdoorSeating, "غير متوفر"),
    gymInfo: cleanOperationalText(operational?.gym ?? master?.gym, "غير متوفر"),
    gymHours: parseHours(operational?.gym ?? master?.gym ?? ""),
    roomTypes,
    roomSource: roomTypes.length ? "internal" : "unverified",
    hallPackages: [
      cleanOperationalText(operational?.meetingHall ?? master?.meetingHall, "غير متوفر"),
      cleanOperationalText(operational?.weddingPackage ?? master?.weddingPackage, "غير متوفر"),
    ],
    notes: operational
      ? "بيانات الخدمات من شيت معلومات الفروع. الأسعار والمواعيد المتغيرة تُراجع قبل تأكيدها للضيف."
      : "تم توحيد البيانات من الملفات الداخلية الحالية.",
    attachments: [],
    sourceFiles: operational
      ? [HOTEL_INFORMATION_SHEET_URL, "تبويب: hotels data"]
      : ["src/data/hotels.ts", "src/data/hotelMasterData.ts", "src/data/knowledge_bank_seed.json"],
    visibility: "public",
    priority: 1000 - idx,
  };
};

const deduped = new Map<string, BranchRecord>();
for (const [idx, row] of hotelBranches.entries()) {
  const branch = toBranchRecord(row, idx);
  const key = `${branch.brand}::${normalizeKey(branch.branch)}`;
  if (!deduped.has(key)) deduped.set(key, branch);
}
export const branchRecords: BranchRecord[] = [...deduped.values()].sort((a, b) => a.brand.localeCompare(b.brand) || a.branch.localeCompare(b.branch));

export const branchesByBrand: Record<BrandKey, BranchRecord[]> = {
  Braira: branchRecords.filter((row) => row.brand === "Braira"),
  Boudl: branchRecords.filter((row) => row.brand === "Boudl"),
  Aber: branchRecords.filter((row) => row.brand === "Aber"),
  Narcissus: branchRecords.filter((row) => row.brand === "Narcissus"),
  "Z'MN": branchRecords.filter((row) => row.brand === "Z'MN"),
};

export const quickIntents = ["سياسة الإلغاء", "رقم الاستقبال", "الإفطار", "المسبح", "الغرف"];

export const globalReferences: GlobalReference[] = [
  {
    id: "cancellation-policy",
    title: "سياسة الإلغاء",
    category: "سياسة الإلغاء",
    summary: "الإلغاء المجاني حتى 48 ساعة في المواسم وفترات الذروة، وحتى 24 ساعة خارج المواسم، ما لم تنص شروط السعر على غير ذلك.",
    responseProtocol: "تحقق من قناة الحجز ونوع السعر والموسم، ثم وضّح للضيف المهلة والرسوم قبل تنفيذ الإلغاء.",
    internalSteps: ["التحقق من رقم الحجز", "تأكيد نافذة الإلغاء", "تحديث الحالة في النظام", "إرسال تأكيد للضيف"],
    relatedNotes: "حجوزات منصات السفر الإلكترونية تُعالج من خلال المنصة الأصلية.",
  },
  {
    id: "no-show-policy",
    title: "سياسة عدم الحضور",
    category: "عدم الحضور",
    summary: "الحجز المسجل بحالة NS يُصنف عدم حضور ويُحتسب ضمن الحجوزات الملغاة.",
    responseProtocol: "وضّح الفرق بين الإلغاء المسبق وعدم الحضور، وراجع شروط السعر قبل تأكيد أي رسوم.",
    internalSteps: ["التحقق من تاريخ الوصول", "مراجعة شروط السعر", "تسجيل حالة NS", "تصعيد الحالات الاستثنائية"],
  },
  {
    id: "central-reservation-protocol",
    title: "خطوات الحجز المركزي",
    category: "إجراءات الحجز المركزي",
    summary: "إجراءات موحدة لموظفي الحجز المركزي للتعامل مع الاستفسارات والحجوزات والتعديلات.",
    responseProtocol: "ابدأ بالترحيب، ثم اجمع اسم الفرع وتاريخ الوصول وعدد الليالي والضيوف، واعرض الخيارات المتاحة بدقة.",
    internalSteps: ["الترحيب وتحديد الطلب", "جمع بيانات الإقامة", "تأكيد السعر والبيانات والسياسات", "تثبيت الحجز وتوضيح آلية السداد"],
  },
  {
    id: "response-scripts",
    title: "الردود الجاهزة",
    category: "نماذج الرد",
    summary: "نماذج مختصرة للسياسات والخدمات والتصعيد، مع ضرورة تخصيصها لكل حالة.",
    responseProtocol: "اختر الرد الأقرب، ثم راجعه وخصّصه باسم الضيف والفرع والسياسة قبل الإرسال.",
    internalSteps: ["تحديد نية العميل", "اختيار السكربت", "التخصيص", "التوثيق"],
  },
  {
    id: "reservation-status-mapping",
    title: "تصنيف حالات الحجوزات",
    category: "تقارير الحجوزات",
    summary: "الحالات M وO وN وI مؤكدة، والحالتان C وNS ملغاة.",
    responseProtocol: "لا تعتمد أي حالة أخرى تلقائيًا في التقرير قبل مراجعتها والتحقق من معناها.",
    internalSteps: ["قراءة رمز الحالة", "تطبيق التصنيف المعتمد", "استبعاد الرموز غير المعروفة", "مراجعة الإجماليات"],
  },
  {
    id: "payment-link-policy",
    title: "سياسة رابط الدفع",
    category: "السداد",
    summary: "يُرسل رابط الدفع آليًا برسالة نصية بعد تأكيد الحجز لضمان عدم إلغائه.",
    responseProtocol: "أبلغ الضيف بأن رسالة تأكيد الحجز ورابط الدفع ستصل آليًا، واطلب منه مراجعة البيانات والسياسات قبل السداد.",
    internalSteps: ["تأكيد بيانات الحجز", "التأكد من رقم الجوال", "توضيح مهلة السداد", "متابعة حالة الحجز عند الحاجة"],
  },
];

export const branchInventoryByBrand = {
  Braira: branchesByBrand.Braira.map((b) => b.branch),
  Boudl: branchesByBrand.Boudl.map((b) => b.branch),
  Aber: branchesByBrand.Aber.map((b) => b.branch),
  Narcissus: branchesByBrand.Narcissus.map((b) => b.branch),
  "Z'MN": branchesByBrand["Z'MN"].map((b) => b.branch),
};
