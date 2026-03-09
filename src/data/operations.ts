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

export const knowledgeEntries = [
  { id: 1, group: "سياسات", title: "سياسة الإلغاء الموحدة", tags: ["إلغاء", "سياسة"], body: "الإلغاء المجاني قبل 24 ساعة من وقت الوصول." },
  { id: 2, group: "جهات اتصال", title: "رقم مدير فرع قريش", tags: ["مدير", "قريش"], body: "+966500000001" },
  { id: 3, group: "إجراءات", title: "خطوات التصعيد في الشكاوى", tags: ["شكاوى", "تصعيد"], body: "فتح شكوى > تحديد أهمية > إشعار المشرف > متابعة خلال 30 دقيقة." },
  { id: 4, group: "مرافق", title: "مواعيد الفطور", tags: ["فطور", "تشغيل"], body: "يوميًا من 6:30 ص حتى 10:30 ص." },
  { id: 5, group: "تعاميم", title: "تعميم تحديث سياسة الدفع", tags: ["دفع", "تعميم"], body: "قبول بطاقات مدى/فيزا/ماستر، الدفع المسبق للإقامات الطويلة." },
];
