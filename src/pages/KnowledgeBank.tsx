import { useDeferredValue, useMemo, useState } from "react";
import { BookOpenCheck, ExternalLink, Filter, Search, Tags } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { branchRecords, branchesByBrand, globalReferences, quickIntents } from "@/data/knowledge";
import PageHeader from "@/components/PageHeader";

type ResultCategory = "سياسات" | "فروع" | "جهات اتصال" | "وجبات" | "غرف" | "مرافق" | "قاعات";
const categories: ResultCategory[] = ["سياسات", "فروع", "جهات اتصال", "وجبات", "غرف", "مرافق", "قاعات"];
type SearchResult = {
  id: string;
  kind: ResultCategory;
  title: string;
  summary: string;
  details: string;
  tags: string[];
  branch?: string;
  brand?: string;
  sourceLabel?: string;
  sourceUrl?: string;
  verificationUrl?: string;
};

const unavailableValues = new Set(["", "غير متوفر", "غير محدد", "يرجى التحقق من الفرع"]);
const isAvailable = (value: string) => !unavailableValues.has(value.trim());
const detailLines = (items: Array<[string, string]>) => items
  .filter(([, value]) => isAvailable(value))
  .map(([label, value]) => `${label}: ${value}`);

const baseSearchRows: SearchResult[] = [
  ...globalReferences.map((row) => ({
    id: row.id,
    kind: "سياسات" as ResultCategory,
    title: row.title,
    summary: row.summary,
    details: [
      row.responseProtocol,
      `الخطوات:\n- ${row.internalSteps.join("\n- ")}`,
      row.relatedNotes ? `ملاحظة: ${row.relatedNotes}` : "",
    ].filter(Boolean).join("\n\n"),
    tags: [row.category, "مرجع عام"],
  })),
  ...branchRecords.flatMap((row) => {
    const contacts = detailLines([
      ["الاستقبال", row.receptionPhone],
      ["الفندق", row.hotelPhone],
      ["المبيعات", row.salesPhone],
      ["القاعات", row.hallPhone],
      ["واتساب", row.whatsappNumber],
    ]);
    const meals = detailLines([
      ["الإفطار", row.breakfastInfo],
      ["الغداء", row.lunchInfo],
      ["العشاء", row.dinnerInfo],
    ]);
    const facilities = detailLines([
      ["المسبح", row.poolInfo],
      ["المطعم", row.restaurantInfo],
      ["المقهى", row.coffeeShopInfo],
      ["المواقف", row.parkingInfo],
      ["السبا", row.spaInfo],
      ["النادي", row.gymInfo],
    ]);
    const halls = row.hallPackages.filter(isAvailable);
    const sheetSource = row.sourceFiles.find((source) => source.startsWith("http"));
    const rows: Array<SearchResult | null> = [
      {
        id: `${row.id}-overview`, kind: "فروع", title: row.branch, summary: `${row.city} · ${row.region}`,
        details: `${row.overview}\n${row.notes}`, tags: [row.brand, row.city], brand: row.brand, branch: row.branch,
        sourceLabel: sheetSource ? "شيت معلومات الفروع" : "ملف الفروع الداخلي", sourceUrl: sheetSource,
      },
      contacts.length ? {
        id: `${row.id}-contacts`, kind: "جهات اتصال", title: `تواصل ${row.branch}`, summary: contacts[0], details: contacts.join("\n"), tags: [row.brand, "تواصل"], brand: row.brand, branch: row.branch,
        sourceLabel: "شيت معلومات الفروع", sourceUrl: sheetSource,
      } : null,
      meals.length ? {
        id: `${row.id}-meals`, kind: "وجبات", title: `وجبات ${row.branch}`, summary: meals[0], details: meals.join("\n"), tags: [row.brand, "وجبات"], brand: row.brand, branch: row.branch,
        sourceLabel: "شيت معلومات الفروع", sourceUrl: sheetSource,
      } : null,
      facilities.length ? {
        id: `${row.id}-facilities`, kind: "مرافق", title: `مرافق ${row.branch}`, summary: facilities[0], details: facilities.join("\n"), tags: [row.brand, "مرافق"], brand: row.brand, branch: row.branch,
        sourceLabel: "شيت معلومات الفروع", sourceUrl: sheetSource,
      } : null,
      row.roomTypes.length ? {
        id: `${row.id}-rooms`, kind: "غرف", title: `غرف ${row.branch}`, summary: row.roomTypes.slice(0, 2).join("، "),
        details: `${row.roomTypes.map((room) => `• ${room}`).join("\n")}\n\nتحتاج هذه القائمة إلى مطابقة نهائية مع نظام الفندق قبل تأكيدها للضيف.`,
        tags: [row.brand, "غرف", "تحتاج تحقق"], brand: row.brand, branch: row.branch,
        sourceLabel: "ملف الغرف الداخلي — يحتاج تحقق", verificationUrl: "https://www.boudl.com/",
      } : null,
      halls.length ? {
        id: `${row.id}-halls`, kind: "قاعات", title: `قاعات ${row.branch}`, summary: halls[0], details: halls.map((hall) => `• ${hall}`).join("\n"), tags: [row.brand, "قاعات"], brand: row.brand, branch: row.branch,
        sourceLabel: "شيت معلومات الفروع", sourceUrl: sheetSource,
      } : null,
    ];
    return rows.filter((item): item is SearchResult => Boolean(item));
  }),
];
const searchRows = baseSearchRows.map((row) => ({
  ...row,
  searchText: `${row.title} ${row.summary} ${row.details} ${row.tags.join(" ")}`.toLowerCase(),
}));

const KnowledgeBank = () => {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState<"الكل" | "Braira" | "Boudl" | "Aber" | "Narcissus" | "Z'MN">("الكل");
  const [branch, setBranch] = useState("الكل");
  const [category, setCategory] = useState<"الكل" | ResultCategory>("الكل");
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const deferredQuery = useDeferredValue(query);

  const branchOptions = useMemo(() => {
    if (brand === "الكل") return ["الكل", ...branchRecords.map((b) => b.branch)];
    return ["الكل", ...branchesByBrand[brand].map((b) => b.branch)];
  }, [brand]);

  const results = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return searchRows.filter((row) => {
      const matchBrand = brand === "الكل" || row.brand === brand;
      const matchBranch = branch === "الكل" || row.branch === branch;
      const matchCategory = category === "الكل" || row.kind === category;
      const matchQuery = !q || row.searchText.includes(q);
      return matchBrand && matchBranch && matchCategory && matchQuery;
    });
  }, [deferredQuery, brand, branch, category]);

  const hasCriteria = query.trim().length > 0 || brand !== "الكل" || branch !== "الكل" || category !== "الكل";
  const visibleResults = hasCriteria ? results.slice(0, 60) : [];

  return (
    <div className="page-wrap">
      <PageHeader title="المعلومات" icon={BookOpenCheck} />

      <section className="page-surface space-y-3">
        {hasCriteria ? <div className="flex justify-end"><span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">{results.length} نتيجة</span></div> : null}
        <div className="grid md:grid-cols-4 gap-2">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="h-11 rounded-xl bg-secondary/70 border px-10 w-full" placeholder="مثال: إفطار، مسبح، بودل العليا…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select className="h-11 rounded-xl bg-secondary/70 border px-3" value={brand} onChange={(e) => { setBrand(e.target.value as typeof brand); setBranch("الكل"); }}>
            <option value="الكل">كل العلامات</option><option value="Braira">Braira</option><option value="Boudl">Boudl</option><option value="Aber">Aber</option><option value="Narcissus">Narcissus</option><option value="Z'MN">Z'MN</option>
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
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Tags className="w-3.5 h-3.5" /> بحث سريع</span>
          {quickIntents.map((intent) => (
            <button key={intent} onClick={() => setQuery(intent)} className="text-xs px-3 py-1.5 rounded-full border border-primary/18 bg-secondary/24 hover:border-primary/50 interactive">
              {intent}
            </button>
          ))}
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-3">
        {!hasCriteria ? (
          <div className="md:col-span-2 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">ابدأ بالبحث أو اختر علامة أو فرعًا.</div>
        ) : visibleResults.length ? visibleResults.map((item) => (
          <button key={item.id} className="page-surface render-lazy min-h-[126px] text-right card-hover" onClick={() => setSelected(item)}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs px-2 py-1 rounded-full border border-primary/30 text-primary bg-primary/10">{item.kind}</span>
            </div>
            <h3 className="font-semibold leading-6 text-sm md:text-base">{item.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.summary}</p>
          </button>
        )) : <div className="md:col-span-2 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">لا توجد نتيجة مطابقة. جرّب كلمة أقصر أو غيّر الفلاتر.</div>}
      </div>

      {results.length > visibleResults.length ? <p className="text-center text-xs text-muted-foreground">{visibleResults.length} من {results.length} نتيجة</p> : null}

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
              {selected.sourceLabel ? selected.sourceUrl ? (
                <a className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline" href={selected.sourceUrl} target="_blank" rel="noreferrer">
                  {selected.sourceLabel} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : <p className="text-xs text-muted-foreground">المصدر: {selected.sourceLabel}</p> : null}
              {selected.verificationUrl ? (
                <a className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline" href={selected.verificationUrl} target="_blank" rel="noreferrer">
                  التحقق من موقع بودل <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
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
