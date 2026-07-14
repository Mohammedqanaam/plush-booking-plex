import { useMemo, useState } from "react";
import { BookOpenCheck, Filter, Paperclip, Search, Tags } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { branchRecords, branchesByBrand, globalReferences, quickIntents } from "@/data/knowledge";
import PageHeader from "@/components/PageHeader";

type ResultCategory = "سياسات" | "فروع" | "جهات اتصال" | "وجبات" | "غرف" | "مرافق" | "قاعات" | "إجراءات";
const categories: ResultCategory[] = ["سياسات", "فروع", "جهات اتصال", "وجبات", "غرف", "مرافق", "قاعات", "إجراءات"];

const KnowledgeBank = () => {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState<"الكل" | "Braira" | "Boudl" | "Aber" | "Narcissus" | "Z'MN">("الكل");
  const [branch, setBranch] = useState("الكل");
  const [category, setCategory] = useState<"الكل" | ResultCategory>("الكل");
  const [selected, setSelected] = useState<{ title: string; summary: string; details: string; tags: string[]; branch?: string; brand?: string } | null>(null);

  const branchOptions = useMemo(() => {
    if (brand === "الكل") return ["الكل", ...branchRecords.map((b) => b.branch)];
    return ["الكل", ...branchesByBrand[brand].map((b) => b.branch)];
  }, [brand]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const policyRows = globalReferences.map((row) => ({
      id: row.id,
      kind: "سياسات" as ResultCategory,
      title: row.title,
      summary: row.summary,
      details: `${row.responseProtocol}\n\nالخطوات الداخلية:\n- ${row.internalSteps.join("\n- ")}\n\nملاحظات: ${row.relatedNotes ?? "لا يوجد"}\nالمرفق: ${row.attachmentUrl ?? "غير متوفر"}`,
      tags: [row.category, "مرجع عام"],
      brand: undefined,
      branch: undefined,
    }));

    const branchRows = branchRecords.flatMap((row) => [
      { id: `${row.id}-overview`, kind: "فروع" as ResultCategory, title: `${row.branch} - نبذة`, summary: row.overview, details: `${row.city} - ${row.region}\n${row.notes}`, tags: [row.brand, row.city], brand: row.brand, branch: row.branch },
      { id: `${row.id}-contacts`, kind: "جهات اتصال" as ResultCategory, title: `${row.branch} - التواصل`, summary: `الاستقبال: ${row.receptionPhone}`, details: `الفندق: ${row.hotelPhone}\nالمبيعات: ${row.salesPhone}\nالقاعات: ${row.hallPhone}\nواتساب: ${row.whatsappNumber}`, tags: [row.brand, "التواصل"], brand: row.brand, branch: row.branch },
      { id: `${row.id}-meals`, kind: "وجبات" as ResultCategory, title: `${row.branch} - الوجبات`, summary: row.breakfastInfo, details: `الإفطار: ${row.breakfastInfo}\nالغداء: ${row.lunchInfo}\nالعشاء: ${row.dinnerInfo}`, tags: [row.brand, "الوجبات"], brand: row.brand, branch: row.branch },
      { id: `${row.id}-facilities`, kind: "مرافق" as ResultCategory, title: `${row.branch} - المرافق`, summary: row.poolInfo, details: `المسبح: ${row.poolInfo}\nالمطعم: ${row.restaurantInfo}\nالسبا: ${row.spaInfo}\nالنادي: ${row.gymInfo}`, tags: [row.brand, "المرافق"], brand: row.brand, branch: row.branch },
      { id: `${row.id}-rooms`, kind: "غرف" as ResultCategory, title: `${row.branch} - الغرف`, summary: row.roomTypes.join("، "), details: row.roomTypes.join("\n"), tags: [row.brand, "الغرف"], brand: row.brand, branch: row.branch },
      { id: `${row.id}-halls`, kind: "قاعات" as ResultCategory, title: `${row.branch} - القاعات`, summary: row.hallPackages.join(" / "), details: row.hallPackages.join("\n"), tags: [row.brand, "القاعات"], brand: row.brand, branch: row.branch },
      { id: `${row.id}-protocol`, kind: "إجراءات" as ResultCategory, title: `${row.branch} - الإجراءات`, summary: "آلية الرد المعتمدة لفريق الحجوزات", details: "اذكر السياسة وتفاصيل الفرع ورقم التواصل وحالة التصعيد.", tags: [row.brand, "إجراء"], brand: row.brand, branch: row.branch },
    ]);

    return [...policyRows, ...branchRows].filter((row) => {
      const matchBrand = brand === "الكل" || row.brand === brand;
      const matchBranch = branch === "الكل" || row.branch === branch;
      const matchCategory = category === "الكل" || row.kind === category;
      const blob = `${row.title} ${row.summary} ${row.details} ${row.tags.join(" ")}`.toLowerCase();
      const matchQuery = !q || blob.includes(q);
      return matchBrand && matchBranch && matchCategory && matchQuery;
    });
  }, [query, brand, branch, category]);

  return (
    <div className="page-wrap">
      <PageHeader title="بنك المعلومات" subtitle="بحث مصنف وسريع في البيانات الحالية." icon={BookOpenCheck} />

      <section className="page-surface space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>الصفحة للعرض فقط — مرجع سريع للمعلومات المعتمدة.</p>
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">{results.length} نتيجة</span>
        </div>
        <div className="grid md:grid-cols-4 gap-2">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="h-11 rounded-xl bg-secondary/70 border px-10 w-full" placeholder="ابحث بالكلمات والحروف" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select className="h-11 rounded-xl bg-secondary/70 border px-3" value={brand} onChange={(e) => { setBrand(e.target.value as typeof brand); setBranch("الكل"); }}>
            <option value="الكل">كل البراندات</option><option value="Braira">Braira</option><option value="Boudl">Boudl</option><option value="Aber">Aber</option><option value="Narcissus">Narcissus</option><option value="Z'MN">Z'MN</option>
          </select>
          <select className="h-11 rounded-xl bg-secondary/70 border px-3" value={branch} onChange={(e) => setBranch(e.target.value)}>{branchOptions.map((b) => <option key={b}>{b}</option>)}</select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Filter className="w-3.5 h-3.5" /> تصنيفات سريعة</span>
          <button onClick={() => setCategory("الكل")} className={`text-xs px-3 py-1.5 rounded-full border interactive ${category === "الكل" ? "border-primary text-primary bg-primary/10" : "hover:border-primary/60"}`}>الكل</button>
          {categories.map((item) => (
            <button key={item} onClick={() => setCategory(item)} className={`text-xs px-3 py-1.5 rounded-full border interactive ${category === item ? "border-primary text-primary bg-primary/10" : "hover:border-primary/60"}`}>
              {item}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Tags className="w-3.5 h-3.5" /> نوايا بحث سريعة</span>
          {quickIntents.map((intent) => (
            <button key={intent} onClick={() => setQuery(intent)} className="text-xs px-3 py-1.5 rounded-full border border-primary/18 bg-secondary/24 hover:border-primary/50 interactive">
              {intent}
            </button>
          ))}
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-3">
        {results.length ? results.map((item) => (
          <button key={item.id} className="page-surface min-h-[126px] text-right card-hover" onClick={() => setSelected(item)}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs px-2 py-1 rounded-full border border-primary/30 text-primary bg-primary/10">{item.kind}</span>
              <Paperclip className="w-4 h-4 text-muted-foreground" />
            </div>
            <h3 className="font-semibold leading-6 text-sm md:text-base">{item.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.summary}</p>
          </button>
        )) : <div className="md:col-span-2 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">لا توجد نتائج مطابقة. جرّب كلمات بحث أخرى أو غيّر الفلاتر.</div>}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl glass-card border-primary/20">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">{selected.brand ?? "مرجع عام"} · {selected.branch ?? "سياسة عامة"}</p>
              <div className="rounded-xl border border-primary/20 bg-secondary/24 p-3 whitespace-pre-line text-sm leading-7 max-h-[50vh] overflow-auto custom-scrollbar">
                {selected.details}
              </div>
              <div className="flex flex-wrap gap-2">
                {selected.tags.map((tag) => <span key={tag} className="text-xs px-2 py-1 rounded-full bg-secondary/70 border border-primary/18">{tag}</span>)}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KnowledgeBank;
