import { FileBadge2, FileText, FolderKanban } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const items = [
  { title: "سياسة الإلغاء", type: "نص", category: "إلغاء", updated: "آخر تحديث: فبراير 2026" },
  { title: "سياسة الدفع", type: "PDF", category: "دفع", updated: "آخر تحديث: يناير 2026" },
  { title: "سياسة الدخول والخروج", type: "صورة", category: "تشغيل", updated: "آخر تحديث: مارس 2026" },
  { title: "تعميم العروض الموسمية", type: "PDF", category: "عروض", updated: "آخر تحديث: مارس 2026" },
];

const Policies = () => (
  <div className="page-wrap">
    <PageHeader title="التعاميم والسياسات" subtitle="مرجع موحد للتعليمات التشغيلية بطريقة واضحة وسريعة القراءة." icon={FileText} />

    <section className="page-surface space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="icon-chip"><FolderKanban className="w-4 h-4" /></span>
        سياسات معروضة وفق تصنيفات التشغيل اليومية.
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((item) => (
          <article key={item.title} className="rounded-2xl border border-primary/18 bg-secondary/24 p-4 card-hover space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs px-2 py-1 rounded-full border border-primary/30 text-primary bg-primary/10">{item.category}</span>
              <FileBadge2 className="w-4 h-4 text-muted-foreground" />
            </div>
            <h3 className="font-semibold leading-7">{item.title}</h3>
            <p className="text-xs text-muted-foreground">النوع: {item.type}</p>
            <p className="text-xs text-muted-foreground">{item.updated}</p>
          </article>
        ))}
      </div>
    </section>
  </div>
);

export default Policies;
