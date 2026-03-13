import { useMemo, useState } from "react";
import { BookOpenCheck, Filter, Search, Tags } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { branchRecords, branchesByBrand, globalReferences, quickIntents } from "@/data/knowledge";
import PageHeader from "@/components/PageHeader";

type ResultCategory = "سياسات" | "فروع" | "جهات اتصال" | "وجبات" | "غرف" | "مرافق" | "قاعات" | "إجراءات";
const categories: ResultCategory[] = ["سياسات", "فروع", "جهات اتصال", "وجبات", "غرف", "مرافق", "قاعات", "إجراءات"];

const KnowledgeBank = () => {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState<"الكل" | "Braira" | "Boudl" | "Aber" | "Narcissus">("الكل");
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
      tags: [row.category, "global-reference"],
      brand: undefined,
      branch: undefined,
    }));

    const branchRows = branchRecords.flatMap((row) => [
      { id: `${row.id}-overview`, kind: "فروع" as ResultCategory, title: `${row.branch} - نبذة`, summary: row.overview, details: `${row.city} - ${row.region}\n${row.notes}`, tags: [row.brand, row.city], brand: row.brand, branch: row.branch },
      { id: `${row.id}-contacts`, kind: "جهات اتصال" as ResultCategory, title: `${row.branch} - التواصل`, summary: `استقبال: ${row.receptionPhone}`, details: `hotel: ${row.hotelPhone}\nsales: ${row.salesPhone}\nhall: ${row.hallPhone}\nwhatsapp: ${row.whatsappNumber}`, tags: [row.brand, "contacts"], brand: row.brand, branch: row.branch },
      { id: `${row.id}-meals`, kind: "وجبات" as ResultCategory, title: `${row.branch} - الوجبات`, summary: row.breakfastInfo, details: `Breakfast: ${row.breakfastInfo}\nLunch: ${row.lunchInfo}\nDinner: ${row.dinnerInfo}`, tags: [row.brand, "meals"], brand: row.brand, branch: row.branch },
      { id: `${row.id}-facilities`, kind: "مرافق" as ResultCategory, title: `${row.branch} - المرافق`, summary: row.poolInfo, details: `Pool: ${row.poolInfo}\nRestaurant: ${row.restaurantInfo}\nSpa: ${row.spaInfo}\nGym: ${row.gymInfo}`, tags: [row.brand, "facilities"], brand: row.brand, branch: row.branch },
      { id: `${row.id}-rooms`, kind: "غرف" as ResultCategory, title: `${row.branch} - الغرف`, summary: row.roomTypes.join("، "), details: row.roomTypes.join("\n"), tags: [row.brand, "rooms"], brand: row.brand, branch: row.branch },
      { id: `${row.id}-halls`, kind: "قاعات" as ResultCategory, title: `${row.branch} - القاعات`, summary: row.hallPackages.join(" / "), details: row.hallPackages.join("\n"), tags: [row.brand, "halls"], brand: row.brand, branch: row.branch },
      { id: `${row.id}-protocol`, kind: "إجراءات" as ResultCategory, title: `${row.branch} - الإجراءات`, summary: "بروتوكول رد الكول سنتر", details: "اذكر السياسة + تفاصيل الفرع + رقم التواصل + حالة التصعيد.", tags: [row.brand, "protocol"], brand: row.brand, branch: row.branch },
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
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      <PageHeader title="بنك المعلومات" subtitle="بحث سريع ومصنف لسياسات التشغيل وبيانات الفروع." icon={BookOpenCheck} />

      <section className="page-surface">
        <div className="grid md:grid-cols-4 gap-2">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="h-11 rounded-xl bg-secondary border px-10 w-full" placeholder="ابحث بالكلمات والحروف" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select className="h-11 rounded-xl bg-secondary border px-2" value={brand} onChange={(e) => { setBrand(e.target.value as typeof brand); setBranch("الكل"); }}>
            <option value="الكل">كل البراندات</option><option value="Braira">Braira</option><option value="Boudl">Boudl</option><option value="Aber">Aber</option><option value="Narcissus">Narcissus</option>
          </select>
          <select className="h-11 rounded-xl bg-secondary border px-2" value={branch} onChange={(e) => setBranch(e.target.value)}>{branchOptions.map((b) => <option key={b}>{b}</option>)}</select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Filter className="w-3.5 h-3.5" /> تصنيفات</span>
          {categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`text-xs px-3 py-1.5 rounded-full border ${category === item ? "border-primary text-primary" : "hover:border-primary/60"}`}>{item}</button>)}
          <button onClick={() => setCategory("الكل")} className="text-xs px-3 py-1.5 rounded-full border hover:border-primary/60">الكل</button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Tags className="w-3.5 h-3.5" /> Quick intent</span>
          {quickIntents.map((intent) => <button key={intent} onClick={() => setQuery(intent)} className="text-xs px-3 py-1.5 rounded-full border hover:border-primary/50">{intent}</button>)}
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-3">
        {results.length ? results.map((item) => (
          <button key={item.id} className="page-surface text-right hover:border-primary/40 interactive" onClick={() => setSelected(item)}>
            <p className="text-xs text-primary">{item.kind}</p>
            <h3 className="font-semibold">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.summary}</p>
          </button>
        )) : <div className="md:col-span-2 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">لا توجد نتائج مطابقة. جرّب كلمات بحث أخرى.</div>}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected ? <><DialogHeader><DialogTitle>{selected.title}</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">{selected.brand ?? "Global"} · {selected.branch ?? "General"}</p><p className="whitespace-pre-line text-sm">{selected.details}</p><div className="flex flex-wrap gap-2">{selected.tags.map((tag) => <span key={tag} className="text-xs px-2 py-1 rounded bg-secondary border">{tag}</span>)}</div></> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KnowledgeBank;
