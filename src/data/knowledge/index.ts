import seed from "@/data/knowledge_bank_seed.json";
import { hotelBranches } from "@/data/hotels";

export type BrandKey = "Braira" | "Boudl" | "Aber" | "Narcissus" | "ZMN";
export type KnowledgeSection =
  | "Overview"
  | "Contacts"
  | "Meals"
  | "Facilities"
  | "Rooms"
  | "Halls & Packages"
  | "Policies"
  | "Response Protocols"
  | "Discounts"
  | "Attachments"
  | "Operational Notes";

export type KnowledgeCategory =
  | "سياسات"
  | "فروع"
  | "جهات اتصال"
  | "وجبات"
  | "غرف"
  | "مرافق"
  | "قاعات"
  | "خصومات"
  | "تعاميم"
  | "حلول"
  | "إجراءات";

export type AttachmentItem = {
  title: string;
  type: "pdf" | "png" | "jpg" | "jpeg" | "webp" | "mp4" | "mp3";
  url: string;
  source: "seed" | "official";
};

export type BranchRecord = {
  id: string;
  employeeKey: string;
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
  attachments: AttachmentItem[];
  sourceFiles: string[];
  visibility: "public" | "internal";
  priority: number;
};

export type KnowledgeItem = {
  id: string;
  category: KnowledgeCategory;
  section: KnowledgeSection;
  title: string;
  summary: string;
  details: string;
  brand?: BrandKey;
  branch?: string;
  tags: string[];
  relatedPhones: string[];
  attachments: AttachmentItem[];
  responseProtocol?: string;
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

const managerRows = (seed.managers || []) as Array<{ name: string; email: string; mobile: string; hotel: string; region: string }>;
const hallRows = (seed.hall_contacts || []) as Array<{ branch: string; hall_contact: string }>;
const mealRows = (seed.meal_info || []) as Array<{ branch: string; breakfast: string; lunch: string; dinner: string }>;
const roomRows = (seed.room_types || []) as Array<{ branch: string; room_type: string; room_size: string; room_description: string }>;
const branchSeedRows = (seed.branches || []) as Array<Record<string, string>>;

const normalizeArabic = (value: string) =>
  value
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();

const aliasPairs: Array<[string, string]> = [
  ["barirra", "braira"],
  ["qurtubah", "qurtbah"],
  ["al ahsa", "ahsa"],
  [" الاحساء", " الاحسا"],
  ["قرطبه", "قرطبة"],
];

const canonicalKey = (value: string) => {
  let normalized = normalizeArabic(value)
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  aliasPairs.forEach(([from, to]) => {
    normalized = normalized.replaceAll(from, to);
  });
  return normalized;
};

const brandMap: Record<string, BrandKey> = {
  بريرا: "Braira",
  بودل: "Boudl",
  عابر: "Aber",
  نارسس: "Narcissus",
  نارسيس: "Narcissus",
  "زمن": "ZMN",
  "z'mn": "ZMN",
};

const detectBrand = (branchName: string): BrandKey => {
  const normalized = normalizeArabic(branchName);
  if (normalized.includes("بريرا")) return "Braira";
  if (normalized.includes("بودل")) return "Boudl";
  if (normalized.includes("عابر")) return "Aber";
  if (normalized.includes("نارس")) return "Narcissus";
  if (normalized.includes("زمن") || normalized.includes("zmn") || normalized.includes("z'mn")) return "ZMN";

  const fromHotels = hotelBranches.find((item) => canonicalKey(item.name) === canonicalKey(branchName));
  return fromHotels ? brandMap[fromHotels.group] || "Boudl" : "Boudl";
};

const phoneFromHotels = new Map(hotelBranches.map((item) => [canonicalKey(item.name), item.phone]));
const managerByBranch = new Map(managerRows.map((row) => [canonicalKey(row.hotel), row]));
const hallByBranch = new Map(hallRows.map((row) => [canonicalKey(row.branch), row.hall_contact]));
const mealByBranch = new Map(mealRows.map((row) => [canonicalKey(row.branch), row]));
const roomsByBranch = roomRows.reduce((acc, room) => {
  const key = canonicalKey(room.branch);
  if (!acc.has(key)) acc.set(key, [] as typeof roomRows);
  acc.get(key)?.push(room);
  return acc;
}, new Map<string, typeof roomRows>());

export const globalReferences: GlobalReference[] = [
  {
    id: "cancellation-policy",
    title: "سياسة الإلغاء",
    category: "Cancellation Policy",
    summary: "يتم تطبيق سياسة الإلغاء حسب نوع السعر وقناة الحجز. تحقق من نافذة الإلغاء قبل تأكيد أي رسوم.",
    responseProtocol: "نراجع نوع الحجز أولًا، ثم نوضح آخر وقت للإلغاء المجاني، ثم نؤكد الرسوم المحتملة بشكل واضح ومهذب.",
    internalSteps: ["التحقق من رقم الحجز", "تحديد نوع السعر", "تأكيد موعد الإلغاء", "توثيق المحادثة بالنظام"],
    relatedNotes: "في حالات عدم الحضور يتم الرجوع إلى سياسة No Show المعتمدة.",
    attachmentUrl: "/docs/policies/cancellation-policy.pdf",
  },
  {
    id: "no-show-policy",
    title: "سياسة عدم الحضور",
    category: "No Show Policy",
    summary: "عدم حضور الضيف دون إلغاء مسبق قد يترتب عليه رسوم حسب سياسة السعر.",
    responseProtocol: "اشرح الفرق بين الإلغاء وعدم الحضور، مع توضيح سبب الرسوم استنادًا لنوع الحجز.",
    internalSteps: ["مراجعة وقت الوصول", "تأكيد السياسة", "تسجيل No Show", "التصعيد للحالات الاستثنائية"],
  },
  {
    id: "reservation-protocol",
    title: "بروتوكول الحجز المركزي",
    category: "Central Reservation Protocol",
    summary: "خطوات موحدة للتعامل مع الاستفسارات والحجوزات والتعديلات.",
    responseProtocol: "ترحيب + تحقق + عرض الخيارات + تأكيد السياسات + إغلاق احترافي.",
    internalSteps: ["التحية والتحقق", "تجميع البيانات", "عرض الخيارات", "التأكيد النهائي"],
  },
];

const regionMap: Record<string, string> = {
  الرياض: "الوسطى",
  جدة: "الغربية",
  الخبر: "الشرقية",
  الدمام: "الشرقية",
  الاحساء: "الشرقية",
  الأحساء: "الشرقية",
  القصيم: "القصيم",
  أبها: "الجنوبية",
};

const cityFromBranch = (branch: string) => {
  const match = hotelBranches.find((item) => canonicalKey(item.name) === canonicalKey(branch));
  return match?.city || "غير محدد";
};

export const branchRecords: BranchRecord[] = branchSeedRows
  .map((row, index) => {
    const branch = String(row.branch || "").replace(/\s+/g, " ").trim();
    if (!branch) return null;
    const key = canonicalKey(branch);
    const manager = managerByBranch.get(key);
    const meal = mealByBranch.get(key);
    const halls = hallByBranch.get(key) || "غير متوفر";
    const rooms = roomsByBranch.get(key) || [];
    const city = cityFromBranch(branch);

    return {
      id: `kb-${key}`,
      employeeKey: key,
      brand: detectBrand(branch),
      branch,
      city,
      region: regionMap[city] || "غير محدد",
      overview: `${branch} - ${city}`,
      receptionPhone: phoneFromHotels.get(key) || "غير متوفر",
      hotelPhone: phoneFromHotels.get(key) || "غير متوفر",
      salesPhone: halls,
      hallPhone: halls,
      whatsappNumber: manager?.mobile || "غير متوفر",
      managerName: manager?.name || "غير محدد",
      managerPhone: manager?.mobile || "غير متوفر",
      managerEmail: manager?.email || "غير متوفر",
      breakfastInfo: meal?.breakfast || row.breakfast || "غير متوفر",
      lunchInfo: meal?.lunch || "غير متوفر",
      dinnerInfo: meal?.dinner || "غير متوفر",
      poolInfo: row.pool || "غير متوفر",
      poolHours: row.pool || "غير محدد",
      coffeeShopInfo: row.coffee_shop || "غير متوفر",
      restaurantInfo: row.restaurant || "غير متوفر",
      restaurantHours: row.restaurant || "غير محدد",
      balconyInfo: row.view_balcony || "غير متوفر",
      parkingInfo: row.parking || "غير متوفر",
      kidsSectionInfo: row.kids_section || "غير متوفر",
      jacuzziInfo: row.jacuzzi_bathtub || "غير متوفر",
      bathtubInfo: row.jacuzzi_bathtub || "غير متوفر",
      spaInfo: row.spa || "غير متوفر",
      spaHours: row.spa || "غير محدد",
      laundryInfo: row.laundry || "غير متوفر",
      outdoorSeatingInfo: row.outdoor_seating || "غير متوفر",
      gymInfo: row.club || "غير متوفر",
      gymHours: row.club || "غير محدد",
      roomTypes: rooms.length ? rooms.map((room) => `${room.room_type} (${room.room_size})`).filter(Boolean) : ["غير متوفر"],
      hallPackages: [row.meeting_hall || "غير متوفر", row.wedding_package || "غير متوفر"],
      notes: "تمت تعبئة السجل من ملف seed التشغيلي الحالي المعتمد داخل المشروع.",
      attachments: [],
      sourceFiles: [seed.source_file || "knowledge_bank_seed.json"],
      visibility: "public",
      priority: 1000 - index,
    } as BranchRecord;
  })
  .filter((row): row is BranchRecord => Boolean(row));

const uniqueByKey = new Map<string, BranchRecord>();
branchRecords.forEach((row) => {
  if (!uniqueByKey.has(row.employeeKey)) uniqueByKey.set(row.employeeKey, row);
});

export const canonicalBranchRecords = [...uniqueByKey.values()].sort((a, b) => a.brand.localeCompare(b.brand) || a.branch.localeCompare(b.branch));

export const branchesByBrand: Record<BrandKey, BranchRecord[]> = {
  Braira: canonicalBranchRecords.filter((row) => row.brand === "Braira"),
  Boudl: canonicalBranchRecords.filter((row) => row.brand === "Boudl"),
  Aber: canonicalBranchRecords.filter((row) => row.brand === "Aber"),
  Narcissus: canonicalBranchRecords.filter((row) => row.brand === "Narcissus"),
  ZMN: canonicalBranchRecords.filter((row) => row.brand === "ZMN"),
};

export const quickIntents = ((seed.quickIntents || []) as string[]).filter(Boolean);

const protocolTemplate = (branch: string) =>
  `الرد المقترح للضيف:\nنشكر تواصلكم، وسيتم تزويدكم بالتفاصيل الدقيقة الخاصة بفرع ${branch}.\n\nآلية التنفيذ الداخلية:\n1) تأكيد الفرع ونوع الطلب.\n2) مراجعة السياسة أو الخدمة من بنك المعلومات.\n3) تزويد الضيف بالرد الرسمي وتوثيق المحادثة.`;

export const searchableKnowledgeItems: KnowledgeItem[] = canonicalBranchRecords.flatMap((row) => [
  {
    id: `${row.id}-overview`,
    category: "فروع" as const,
    section: "Overview" as const,
    title: `${row.branch} - نظرة عامة`,
    summary: `${row.brand} · ${row.city}`,
    details: `${row.overview}\nالمنطقة: ${row.region}\n${row.notes}`,
    brand: row.brand,
    branch: row.branch,
    tags: [row.brand, row.city, "branch-overview"],
    relatedPhones: [row.hotelPhone],
    attachments: row.attachments,
  },
  {
    id: `${row.id}-contacts`,
    category: "جهات اتصال" as const,
    section: "Contacts" as const,
    title: `${row.branch} - أرقام التواصل`,
    summary: `الاستقبال: ${row.receptionPhone}`,
    details: `فندق: ${row.hotelPhone}\nالمبيعات: ${row.salesPhone}\nالقاعات: ${row.hallPhone}\nالواتساب: ${row.whatsappNumber}\nالمدير: ${row.managerName}\nجوال المدير: ${row.managerPhone}\nبريد المدير: ${row.managerEmail}`,
    brand: row.brand,
    branch: row.branch,
    tags: [row.brand, "contacts", "phones"],
    relatedPhones: [row.hotelPhone, row.hallPhone, row.managerPhone],
    attachments: row.attachments,
  },
  {
    id: `${row.id}-meals`,
    category: "وجبات" as const,
    section: "Meals" as const,
    title: `${row.branch} - الوجبات`,
    summary: row.breakfastInfo,
    details: `الإفطار: ${row.breakfastInfo}\nالغداء: ${row.lunchInfo}\nالعشاء: ${row.dinnerInfo}`,
    brand: row.brand,
    branch: row.branch,
    tags: [row.brand, "meals", "breakfast"],
    relatedPhones: [row.hotelPhone],
    attachments: row.attachments,
  },
  {
    id: `${row.id}-facilities`,
    category: "مرافق" as const,
    section: "Facilities" as const,
    title: `${row.branch} - المرافق`,
    summary: row.poolInfo,
    details: `المسبح: ${row.poolInfo}\nالمطعم: ${row.restaurantInfo}\nالقهوة: ${row.coffeeShopInfo}\nالنادي: ${row.gymInfo}\nالسبا: ${row.spaInfo}\nمواقف السيارات: ${row.parkingInfo}\nقسم الأطفال: ${row.kidsSectionInfo}`,
    brand: row.brand,
    branch: row.branch,
    tags: [row.brand, "facilities"],
    relatedPhones: [row.hotelPhone],
    attachments: row.attachments,
  },
  {
    id: `${row.id}-rooms`,
    category: "غرف" as const,
    section: "Rooms" as const,
    title: `${row.branch} - الغرف`,
    summary: row.roomTypes[0],
    details: row.roomTypes.join("\n"),
    brand: row.brand,
    branch: row.branch,
    tags: [row.brand, "rooms"],
    relatedPhones: [row.hotelPhone],
    attachments: row.attachments,
  },
  {
    id: `${row.id}-halls`,
    category: "قاعات" as const,
    section: "Halls & Packages" as const,
    title: `${row.branch} - القاعات والباقات`,
    summary: row.hallPackages[0],
    details: `القاعات: ${row.hallPackages[0]}\nباقة العرسان: ${row.hallPackages[1]}\nرقم القاعات: ${row.hallPhone}`,
    brand: row.brand,
    branch: row.branch,
    tags: [row.brand, "halls", "packages"],
    relatedPhones: [row.hallPhone],
    attachments: row.attachments,
  },
  {
    id: `${row.id}-protocol`,
    category: "إجراءات" as const,
    section: "Response Protocols" as const,
    title: `${row.branch} - بروتوكول الرد`,
    summary: "نص جاهز لموظف الحجز المركزي.",
    details: protocolTemplate(row.branch),
    brand: row.brand,
    branch: row.branch,
    tags: [row.brand, "protocol"],
    relatedPhones: [row.hotelPhone, row.managerPhone],
    attachments: row.attachments,
    responseProtocol: protocolTemplate(row.branch),
  },
]);

export const policyKnowledgeItems: KnowledgeItem[] = globalReferences.map((row) => ({
  id: row.id,
  category: "سياسات",
  section: "Policies",
  title: row.title,
  summary: row.summary,
  details: `ملخص: ${row.summary}\n\nالخطوات الداخلية:\n- ${row.internalSteps.join("\n- ")}\n\nملاحظات: ${row.relatedNotes || "لا يوجد"}`,
  tags: [row.category, "policy"],
  relatedPhones: [],
  attachments: row.attachmentUrl
    ? [
        {
          title: row.title,
          type: "pdf",
          url: row.attachmentUrl,
          source: "official",
        },
      ]
    : [],
  responseProtocol: row.responseProtocol,
}));

export const knowledgeCatalog: Record<BrandKey, { brand: BrandKey; branches: BranchRecord[] }> = {
  Braira: { brand: "Braira", branches: branchesByBrand.Braira },
  Boudl: { brand: "Boudl", branches: branchesByBrand.Boudl },
  Aber: { brand: "Aber", branches: branchesByBrand.Aber },
  Narcissus: { brand: "Narcissus", branches: branchesByBrand.Narcissus },
  ZMN: { brand: "ZMN", branches: branchesByBrand.ZMN },
};

export const brandOptions: BrandKey[] = ["Braira", "Boudl", "Aber", "Narcissus", "ZMN"];

export const branchInventoryByBrand = {
  Braira: branchesByBrand.Braira.map((b) => b.branch),
  Boudl: branchesByBrand.Boudl.map((b) => b.branch),
  Aber: branchesByBrand.Aber.map((b) => b.branch),
  Narcissus: branchesByBrand.Narcissus.map((b) => b.branch),
  ZMN: branchesByBrand.ZMN.map((b) => b.branch),
};
