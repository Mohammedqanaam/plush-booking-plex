import { managers, masterHotels } from "@/data/hotelMasterData";

export type ThemePreset = {
  id: string;
  name: string;
  description: string;
};

export const themePresets: ThemePreset[] = [
  { id: "executive-dark-glass", name: "Executive Dark Glass", description: "رسمي، راقٍ، قوي" },
  { id: "luxury-lavender", name: "Luxury Lavender", description: "فاخر، مريح، جميل" },
  { id: "hospitality-premium-gold", name: "Hospitality Premium Gold", description: "فندقي دافئ ولمسات ذهبية" },
  { id: "signature-cosmic", name: "Signature Cosmic Worm-AI", description: "هوية كونية حية بوهج سيان/بنفسجي" },
  { id: "signature-obsidian", name: "Signature Royal Obsidian", description: "أسود ملكي بطبقات أوبسيديان" },
];

export const quickIntents = [
  "سياسة الإلغاء",
  "أرقام المدراء",
  "رقم الاستقبال",
  "الفطور",
  "المسبح",
  "المواقف",
  "الدفع",
  "الدخول والخروج",
  "التعامل مع الشكوى",
];

export type KnowledgeGroup = "سياسات" | "فروع" | "جهات اتصال" | "وجبات" | "غرف" | "تعاميم" | "إجراءات" | "حلول";

export type KnowledgeEntry = {
  id: string;
  type: "faq" | "policy" | "procedure" | "branch_info" | "contact" | "circular" | "solution";
  category: string;
  group: KnowledgeGroup;
  brand?: "Boudl" | "Braira" | "Narcissus" | "Aber";
  branch?: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  contacts?: Array<{ label: string; value: string }>;
  policy_text?: string;
  response_protocol?: string;
  internal_protocol?: string;
  attachment?: { type: "pdf" | "image" | "text"; url?: string; label?: string };
  priority?: number;
};

const mapBrand = (arabicBrand: string): KnowledgeEntry["brand"] => {
  if (arabicBrand.includes("بريرا")) return "Braira";
  if (arabicBrand.includes("بودل")) return "Boudl";
  if (arabicBrand.includes("نارس")) return "Narcissus";
  if (arabicBrand.includes("عابر")) return "Aber";
  return undefined;
};

const branchEntries: KnowledgeEntry[] = masterHotels.flatMap((hotel, idx) => {
  const brand = mapBrand(hotel.brand);
  const contacts = [
    hotel.hotelPhone ? { label: "رقم الاستقبال", value: hotel.hotelPhone } : null,
    hotel.salesPhone ? { label: "رقم المبيعات", value: hotel.salesPhone } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return [
    {
      id: `branch-${hotel.id}`,
      type: "branch_info",
      category: "بيانات الفرع",
      group: "فروع",
      brand,
      branch: hotel.name,
      title: `${hotel.name} - معلومات تشغيلية`,
      summary: `مدينة ${hotel.city} · فطور: ${hotel.breakfast} · مواقف: ${hotel.parking}`,
      body: `المدينة: ${hotel.city}\nالفطور: ${hotel.breakfast}\nالمسبح: ${hotel.pool}\nالمطعم: ${hotel.restaurant}\nالمواقف: ${hotel.parking}\nالقاعات: ${hotel.meetingHall}\nالصالة الرياضية: ${hotel.gym}`,
      tags: [hotel.brand, hotel.city, "فرع", "تشغيل"],
      contacts,
      priority: 100 + idx,
    },
    {
      id: `rooms-${hotel.id}`,
      type: "branch_info",
      category: "أنواع الغرف",
      group: "غرف",
      brand,
      branch: hotel.name,
      title: `${hotel.name} - أنواع الغرف`,
      summary: hotel.roomTypes || "لا توجد تفاصيل غرف محدثة.",
      body: hotel.roomTypes || "لا توجد تفاصيل غرف محدثة.",
      tags: [hotel.brand, "غرف", hotel.city],
      contacts,
      priority: 200 + idx,
    },
    {
      id: `food-${hotel.id}`,
      type: "branch_info",
      category: "الوجبات والمرافق",
      group: "وجبات",
      brand,
      branch: hotel.name,
      title: `${hotel.name} - الفطور والمرافق`,
      summary: `الفطور: ${hotel.breakfast}`,
      body: `الفطور: ${hotel.breakfast}\nالمقهى: ${hotel.coffeeShop}\nالمطعم: ${hotel.restaurant}\nجلسات خارجية: ${hotel.outdoorSeating}`,
      tags: [hotel.brand, "فطور", "مرافق", hotel.city],
      contacts,
      priority: 300 + idx,
    },
  ];
});

const managerEntries: KnowledgeEntry[] = managers.map((manager, idx) => ({
  id: `manager-${idx + 1}`,
  type: "contact",
  category: "إدارة وتشغيل",
  group: "جهات اتصال",
  title: `${manager.name} - ${manager.role}`,
  summary: `رقم التواصل: ${manager.phone}`,
  body: `${manager.role}\nرقم التواصل المباشر: ${manager.phone}`,
  tags: ["مدير", "اتصال", manager.role],
  contacts: [{ label: "رقم المدير", value: manager.phone }],
  priority: 20 + idx,
}));

const corePolicies: KnowledgeEntry[] = [
  {
    id: "policy-cancellation",
    type: "policy",
    category: "سياسة الإلغاء",
    group: "سياسات",
    title: "سياسة الإلغاء الموحدة",
    summary: "الإلغاء المجاني غالبًا حتى 24 ساعة قبل الوصول (حسب نوع الحجز).",
    body: "ينبغي دائمًا تأكيد نوع الحجز (مسترد/غير مسترد) وقناة الحجز قبل إعطاء الحكم النهائي للضيف.",
    tags: ["إلغاء", "سياسة", "حجز"],
    policy_text: "الإلغاء المجاني قبل 24 ساعة من وقت الوصول في الحجوزات المرنة، وبعدها تُطبق رسوم أول ليلة غالبًا.",
    response_protocol: "أستاذي/أستاذتي حسب سياسة الحجز الحالي، أقدر أتحقق لك الآن من إمكانية الإلغاء المجاني أو الرسوم المتوقعة.",
    internal_protocol: "1) تحقق من مصدر الحجز 2) تحقق من نوع السعر 3) راجع وقت الوصول 4) وثّق الرد في النظام.",
    attachment: { type: "pdf", url: "#", label: "فتح مستند سياسة الإلغاء" },
    priority: 1,
  },
  {
    id: "procedure-complaint",
    type: "procedure",
    category: "إجراءات الشكاوى",
    group: "إجراءات",
    title: "بروتوكول معالجة الشكوى أثناء المكالمة",
    summary: "استقبال - تصنيف - تحديد أهمية - تصعيد - متابعة.",
    body: "يتم فتح التذكرة مباشرة أثناء المكالمة مع جمع حقول الضيف والفرع والتصنيف، ثم إرسال ملخص فوري للمشرف.",
    tags: ["شكاوى", "إجراء", "تصعيد"],
    response_protocol: "أفهم ملاحظتك تمامًا، فتحت لك تذكرة الآن، وسأرفعها فورًا للمشرف المختص مع متابعة مباشرة.",
    internal_protocol: "1) تأكيد بيانات الحجز 2) تحديد التصنيف الرئيسي/الفرعي 3) تحديد الأولوية 4) إشعار المشرف خلال 5 دقائق.",
    attachment: { type: "text", label: "إرشادات تشغيل الشكاوى" },
    priority: 2,
  },
  {
    id: "solution-no-show",
    type: "solution",
    category: "حلول التشغيل",
    group: "حلول",
    title: "معالجة حالات No-Show",
    summary: "التحقق من توقيت الوصول وربط الحالة بمرجع الدفع.",
    body: "في حالات NS يتم التحقق من سياسة الحجز أولًا ثم توضيح الإجراء للضيف وتوثيق النتيجة في سجل الشكوى/الحجز.",
    tags: ["NS", "No Show", "حل"],
    response_protocol: "أقدر استفسارك، خليني أراجع حالة الحجز الآن وأعطيك الإجراء الدقيق حسب السياسة.",
    internal_protocol: "1) التحقق من حالة الحجز 2) مراجعة السداد 3) تطبيق السياسة 4) تحديث السجل.",
    priority: 3,
  },
  {
    id: "circular-payment",
    type: "circular",
    category: "تعاميم الدفع",
    group: "تعاميم",
    title: "تعميم تحديث سياسة الدفع",
    summary: "قبول مدى/فيزا/ماستر مع ضوابط الدفع المسبق للإقامات الطويلة.",
    body: "يعتمد الدفع المسبق على مدة الإقامة ونوع الحجز. يلزم توضيح الشروط للضيف قبل التأكيد.",
    tags: ["دفع", "تعميم", "بطاقات"],
    attachment: { type: "pdf", url: "#", label: "فتح تعميم سياسة الدفع" },
    priority: 4,
  },
];

export const knowledgeEntries: KnowledgeEntry[] = [
  ...corePolicies,
  ...managerEntries,
  ...branchEntries,
export const knowledgeEntries = [
  { id: 1, group: "سياسات", title: "سياسة الإلغاء الموحدة", tags: ["إلغاء", "سياسة"], body: "الإلغاء المجاني قبل 24 ساعة من وقت الوصول." },
  { id: 2, group: "جهات اتصال", title: "رقم مدير فرع قريش", tags: ["مدير", "قريش"], body: "+966500000001" },
  { id: 3, group: "إجراءات", title: "خطوات التصعيد في الشكاوى", tags: ["شكاوى", "تصعيد"], body: "فتح شكوى > تحديد أهمية > إشعار المشرف > متابعة خلال 30 دقيقة." },
  { id: 4, group: "مرافق", title: "مواعيد الفطور", tags: ["فطور", "تشغيل"], body: "يوميًا من 6:30 ص حتى 10:30 ص." },
  { id: 5, group: "تعاميم", title: "تعميم تحديث سياسة الدفع", tags: ["دفع", "تعميم"], body: "قبول بطاقات مدى/فيزا/ماستر، الدفع المسبق للإقامات الطويلة." },
];
