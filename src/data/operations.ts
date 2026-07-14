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
  brand?: "Boudl" | "Braira" | "Narcissus" | "Aber";
  branch?: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  contacts?: Array<{ label: string; value: string }>;
  priority?: number;
};

const branchEntries: KnowledgeEntry[] = branchRecords.flatMap((branch) => [
  {
    id: `${branch.id}-overview`,
    type: "branch_info" as const,
    category: "branch_info" as const,
    group: "فروع" as const,
    brand: branch.brand,
    branch: branch.branch,
    title: `${branch.branch} - نبذة`,
    summary: `${branch.city} · ${branch.region}`,
    body: `${branch.overview}\nالمدينة: ${branch.city}\nالمنطقة: ${branch.region}\nملاحظات: ${branch.notes}`,
    tags: [branch.brand, branch.city, "نبذة"],
    contacts: [{ label: "الاستقبال", value: branch.receptionPhone }],
    priority: branch.priority,
  },
  {
    id: `${branch.id}-facilities`,
    type: "branch_info" as const,
    category: "amenities" as const,
    group: "مرافق" as const,
    brand: branch.brand,
    branch: branch.branch,
    title: `${branch.branch} - المرافق`,
    summary: `مسبح: ${branch.poolInfo} · مطعم: ${branch.restaurantInfo}`,
    body: `المسبح: ${branch.poolInfo}\nالمطعم: ${branch.restaurantInfo}\nالكوفي شوب: ${branch.coffeeShopInfo}\nالسبا: ${branch.spaInfo}\nالنادي: ${branch.gymInfo}`,
    tags: [branch.brand, "المرافق"],
    priority: branch.priority,
  },
]);

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
