import { branchRecords, globalReferences, quickIntents as kbQuickIntents } from "@/data/knowledge";

export type ThemePreset = {
  id: string;
  name: string;
  description: string;
};

export const themePresets: ThemePreset[] = [
  { id: "executive-dark-glass", name: "Executive Dark Glass", description: "رسمي، راقٍ، قوي" },
  { id: "luxury-lavender", name: "Luxury Lavender", description: "فاخر، مريح، جميل" },
  { id: "hospitality-premium-gold", name: "Hospitality Premium Gold", description: "فندقي دافئ ولمسات ذهبية" },
  { id: "signature-cosmic", name: "Signature Cosmic Res", description: "هوية كونية حية بوهج سيان/بنفسجي" },
  { id: "signature-obsidian", name: "Signature Royal Obsidian", description: "أسود ملكي بطبقات أوبسيديان" },
];

export const quickIntents = kbQuickIntents;

export type KnowledgeGroup = "سياسات" | "فروع" | "جهات اتصال" | "وجبات" | "غرف" | "مرافق" | "قاعات" | "تعاميم" | "إجراءات";
export type KnowledgeCategory = "branch_info" | "meals" | "amenities" | "policies" | "contacts" | "rooms" | "halls";

export type KnowledgeEntry = {
  id: string;
  type: "policy" | "procedure" | "branch_info" | "contact";
  category: KnowledgeCategory;
  group: KnowledgeGroup;
  brand?: "Boudl" | "Braira" | "Narcissus" | "Aber" | "Z'MN";
  branch?: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  contacts?: Array<{ label: string; value: string }>;
  priority?: number;
};

const unavailableValues = new Set(["", "غير متوفر", "غير محدد", "يرجى التحقق من الفرع"]);
const isAvailable = (value: string) => !unavailableValues.has(value.trim());
const availableLines = (items: Array<[string, string]>) => items
  .filter(([, value]) => isAvailable(value))
  .map(([label, value]) => `${label}: ${value}`);

const branchEntries: KnowledgeEntry[] = branchRecords.flatMap((branch) => {
  const contactLines = availableLines([
    ["الاستقبال", branch.receptionPhone],
    ["الفندق", branch.hotelPhone],
    ["المبيعات", branch.salesPhone],
    ["القاعات", branch.hallPhone],
  ]);
  const mealLines = availableLines([
    ["الإفطار", branch.breakfastInfo],
    ["الغداء", branch.lunchInfo],
    ["العشاء", branch.dinnerInfo],
  ]);
  const facilityLines = availableLines([
    ["المسبح", branch.poolInfo],
    ["المطعم", branch.restaurantInfo],
    ["المقهى", branch.coffeeShopInfo],
    ["المواقف", branch.parkingInfo],
    ["السبا", branch.spaInfo],
    ["النادي", branch.gymInfo],
  ]);
  const hallPackages = branch.hallPackages.filter(isAvailable);
  const contacts = [branch.receptionPhone, branch.hotelPhone, branch.salesPhone, branch.hallPhone]
    .filter(isAvailable)
    .filter((value, index, values) => values.indexOf(value) === index)
    .map((value, index) => ({ label: index === 0 ? "الاستقبال" : "رقم إضافي", value }));

  const rows: Array<KnowledgeEntry | null> = [
    {
    id: `${branch.id}-overview`,
    type: "branch_info" as const,
    category: "branch_info" as const,
    group: "فروع" as const,
    brand: branch.brand,
    branch: branch.branch,
    title: branch.branch,
    summary: `${branch.city} · ${branch.region}`,
    body: `المدينة: ${branch.city}\nالمنطقة: ${branch.region}`,
    tags: [branch.brand, branch.city, "نبذة"],
    contacts: [{ label: "الاستقبال", value: branch.receptionPhone }],
    priority: branch.priority,
    },
    contactLines.length ? {
      id: `${branch.id}-contacts`,
      type: "contact" as const,
      category: "contacts" as const,
      group: "جهات اتصال" as const,
      brand: branch.brand,
      branch: branch.branch,
      title: `تواصل ${branch.branch}`,
      summary: contactLines[0],
      body: contactLines.join("\n"),
      tags: [branch.brand, branch.city, "اتصال"],
      contacts,
      priority: branch.priority,
    } : null,
    mealLines.length ? {
      id: `${branch.id}-meals`,
      type: "branch_info" as const,
      category: "meals" as const,
      group: "وجبات" as const,
      brand: branch.brand,
      branch: branch.branch,
      title: `وجبات ${branch.branch}`,
      summary: mealLines[0],
      body: mealLines.join("\n"),
      tags: [branch.brand, branch.city, "وجبات"],
      priority: branch.priority,
    } : null,
    facilityLines.length ? {
    id: `${branch.id}-facilities`,
    type: "branch_info" as const,
    category: "amenities" as const,
    group: "مرافق" as const,
    brand: branch.brand,
    branch: branch.branch,
    title: `مرافق ${branch.branch}`,
    summary: facilityLines[0],
    body: facilityLines.join("\n"),
    tags: [branch.brand, "المرافق"],
    priority: branch.priority,
    } : null,
    branch.roomTypes.length ? {
      id: `${branch.id}-rooms`,
      type: "branch_info" as const,
      category: "rooms" as const,
      group: "غرف" as const,
      brand: branch.brand,
      branch: branch.branch,
      title: `غرف ${branch.branch}`,
      summary: branch.roomTypes.slice(0, 2).join("، "),
      body: branch.roomTypes.join("\n"),
      tags: [branch.brand, branch.city, "تحتاج تحقق"],
      priority: branch.priority,
    } : null,
    hallPackages.length ? {
      id: `${branch.id}-halls`,
      type: "branch_info" as const,
      category: "halls" as const,
      group: "قاعات" as const,
      brand: branch.brand,
      branch: branch.branch,
      title: `قاعات ${branch.branch}`,
      summary: hallPackages[0],
      body: hallPackages.join("\n"),
      tags: [branch.brand, branch.city, "قاعات"],
      priority: branch.priority,
    } : null,
  ];

  return rows.filter((row): row is KnowledgeEntry => Boolean(row));
});

const policyEntries: KnowledgeEntry[] = globalReferences.map((policy, idx) => ({
  id: policy.id,
  type: "policy",
  category: "policies",
  group: "سياسات",
  title: policy.title,
  summary: policy.summary,
  body: `${policy.responseProtocol}\n\nالخطوات الداخلية:\n- ${policy.internalSteps.join("\n- ")}`,
  tags: ["سياسة", policy.category],
  priority: idx + 1,
}));

export const knowledgeEntries: KnowledgeEntry[] = [...policyEntries, ...branchEntries];
