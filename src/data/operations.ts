import { branches } from "@/data/branches";
import { managers } from "@/data/hotelMasterData";

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

export const quickIntents = ["سياسة الإلغاء", "أرقام المدراء", "رقم الاستقبال", "الفطور", "المسبح", "المواقف"];

export type KnowledgeGroup = "سياسات" | "فروع" | "جهات اتصال" | "وجبات" | "غرف" | "تعاميم" | "إجراءات" | "حلول";
export type KnowledgeCategory = "branch_info" | "breakfast" | "amenities" | "policies" | "contacts";

export type KnowledgeEntry = {
  id: string;
  type: "faq" | "policy" | "procedure" | "branch_info" | "contact" | "circular" | "solution";
  category: KnowledgeCategory;
  group: KnowledgeGroup;
  brand?: "Boudl" | "Braira" | "Narcissus" | "Aber";
  branch?: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  contacts?: Array<{ label: string; value: string }>;
  priority?: number;
};

const mapBrand = (arabicBrand: string): KnowledgeEntry["brand"] => {
  if (arabicBrand.includes("بريرا")) return "Braira";
  if (arabicBrand.includes("بودل")) return "Boudl";
  if (arabicBrand.includes("نارس")) return "Narcissus";
  if (arabicBrand.includes("عابر")) return "Aber";
  return undefined;
};

const branchEntries: KnowledgeEntry[] = branches.flatMap((branch, idx) => {
  const brand = mapBrand(branch.brand);
  return [
    {
      id: `branch-info-${branch.id}`,
      type: "branch_info",
      category: "branch_info",
      group: "فروع",
      brand,
      branch: branch.name,
      title: `${branch.name} - معلومات الفرع`,
      summary: `${branch.city} · ${branch.verificationStatus}`,
      body: `المدينة: ${branch.city}\nالحالة: ${branch.verificationStatus}\nالمواقف: ${branch.services.parking}\nالغسيل: ${branch.services.laundry}`,
      tags: [branch.brand, branch.city, "فرع"],
      contacts: branch.contacts,
      priority: 100 + idx,
    },
    {
      id: `breakfast-${branch.id}`,
      type: "branch_info",
      category: "breakfast",
      group: "وجبات",
      brand,
      branch: branch.name,
      title: `${branch.name} - الإفطار`,
      summary: branch.services.breakfast,
      body: `الإفطار: ${branch.services.breakfast}`,
      tags: [branch.brand, "فطور"],
      contacts: branch.contacts,
      priority: 200 + idx,
    },
    {
      id: `amenities-${branch.id}`,
      type: "branch_info",
      category: "amenities",
      group: "فروع",
      brand,
      branch: branch.name,
      title: `${branch.name} - الخدمات`,
      summary: `مسبح: ${branch.services.pool} · سبا: ${branch.services.spa}`,
      body: `المسبح: ${branch.services.pool}\nالمطعم: ${branch.services.restaurant}\nالكوفي شوب: ${branch.services.coffeeShop}\nالسبا: ${branch.services.spa}\nالجاكوزي: ${branch.services.jacuzzi}`,
      tags: [branch.brand, "خدمات", "مرافق"],
      contacts: branch.contacts,
      priority: 300 + idx,
    },
  ];
});

const managerEntries: KnowledgeEntry[] = managers.map((manager, idx) => ({
  id: `manager-${idx + 1}`,
  type: "contact",
  category: "contacts",
  group: "جهات اتصال",
  title: `${manager.name} - ${manager.role}`,
  summary: `رقم التواصل: ${manager.phone}`,
  body: `${manager.role}\nرقم التواصل المباشر: ${manager.phone}`,
  tags: ["مدير", manager.role],
  contacts: [{ label: "رقم المدير", value: manager.phone }],
  priority: 20 + idx,
}));

const policyEntries: KnowledgeEntry[] = [
  {
    id: "policy-cancellation",
    type: "policy",
    category: "policies",
    group: "سياسات",
    title: "سياسة الإلغاء الموحدة",
    summary: "الإلغاء المجاني غالبًا حتى 24 ساعة قبل الوصول (حسب نوع الحجز).",
    body: "تأكيد نوع الحجز (مسترد/غير مسترد) وقناة الحجز قبل إعطاء الحكم النهائي.",
    tags: ["إلغاء", "سياسة", "حجز"],
    priority: 1,
  },
];

export const knowledgeEntries: KnowledgeEntry[] = [...policyEntries, ...managerEntries, ...branchEntries];
