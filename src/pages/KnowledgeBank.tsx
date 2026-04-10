import { useMemo, useState } from "react";
import { BookOpenCheck, ChevronLeft, Filter, Paperclip, Phone, Search, Tags } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  brandOptions,
  branchInventoryByBrand,
  policyKnowledgeItems,
  quickIntents,
  searchableKnowledgeItems,
  type BrandKey,
  type KnowledgeCategory,
  type KnowledgeItem,
} from "@/data/knowledge";
import PageHeader from "@/components/PageHeader";

const categories: KnowledgeCategory[] = [
  "سياسات",
  "فروع",
  "جهات اتصال",
  "وجبات",
  "غرف",
  "مرافق",
  "قاعات",
  "خصومات",
  "تعاميم",
  "حلول",
  "إجراءات",
];

const KnowledgeBank = () => {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState<"الكل" | BrandKey>("الكل");
  const [branch, setBranch] = useState("الكل");
  const [category, setCategory] = useState<"الكل" | KnowledgeCategory>("الكل");
  const [selected, setSelected] = useState<KnowledgeItem | null>(null);

  const branchOptions = useMemo(() => {
    if (brand === "الكل") return ["الكل", ...new Set(searchableKnowledgeItems.map((item) => item.branch).filter(Boolean) as string[])];
    return ["الكل", ...branchInventoryByBrand[brand]];
  }, [brand]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const merged = [...policyKnowledgeItems, ...searchableKnowledgeItems];

    return merged.filter((row) => {
      const matchBrand = brand === "الكل" || row.brand === brand || (!row.brand && brand === "الكل");
      const matchBranch = branch === "الكل" || row.branch === branch;
      const matchCategory = category === "الكل" || row.category === category;
      const blob = `${row.title} ${row.summary} ${row.details} ${row.tags.join(" ")}`.toLowerCase();
      const matchQuery = !q || blob.includes(q);
      return matchBrand && matchBranch && matchCategory && matchQuery;
    });
  }, [query, brand, branch, category]);

  return (
    <div className="p-3 md:p-4 max-w-7xl mx-auto space-y-4 pb-28 md:pb-8">
      <PageHeader
        title="بنك المعلومات"
        subtitle="مرجع تشغيلي يومي لموظفي الحجز المركزي: بحث سريع + سياسات + فروع + إجراءات موحدة."
        icon={BookOpenCheck}
      />

      <section className="page-surface space-y-3">
        <p className="text-xs text-muted-foreground">
          الصفحة للعرض فقط كمصدر مرجعي تشغيلي، ومصدر البيانات المعروض حاليًا مبني على ملف البيانات الداخلي المزامن مع التشغيل، مع فصل واضح بين السياسات، الفروع، جهات الاتصال، والردود الجاهزة.
        </p>
        <div className="grid md:grid-cols-4 gap-2">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-11 rounded-xl bg-secondary/70 border px-10 w-full"
              placeholder="ابحث بالكلمات والحروف"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            className="h-11 rounded-xl bg-secondary/70 border px-3"
            value={brand}
            onChange={(e) => {
              setBrand(e.target.value as typeof brand);
              setBranch("الكل");
            }}
          >
            <option value="الكل">كل البراندات</option>
            {brandOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select className="h-11 rounded-xl bg-secondary/70 border px-3" value={branch} onChange={(e) => setBranch(e.target.value)}>
            {branchOptions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Filter className="w-3.5 h-3.5" /> تصنيفات سريعة
          </span>
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`text-xs px-3 py-1.5 rounded-full border interactive ${
                category === item ? "border-primary text-primary bg-primary/10" : "hover:border-primary/60"
              }`}
            >
              {item}
            </button>
          ))}
          <button onClick={() => setCategory("الكل")} className="text-xs px-3 py-1.5 rounded-full border hover:border-primary/60">
            الكل
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Tags className="w-3.5 h-3.5" /> Quick chips
          </span>
          {quickIntents.map((intent) => (
            <button
              key={intent}
              onClick={() => setQuery(intent)}
              className="text-xs px-3 py-1.5 rounded-full border border-border/70 bg-secondary/30 hover:border-primary/50"
            >
              {intent}
            </button>
          ))}
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-3">
        {results.length ? (
          results.map((item) => (
            <button key={item.id} className="page-surface text-right card-hover" onClick={() => setSelected(item)}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs px-2 py-1 rounded-full border border-primary/30 text-primary bg-primary/10">{item.category}</span>
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </div>
              <h3 className="font-semibold leading-7">{item.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.summary}</p>
              {item.relatedPhones.length ? (
                <p className="text-xs text-muted-foreground mt-2 inline-flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {item.relatedPhones[0]}
                </p>
              ) : null}
            </button>
          ))
        ) : (
          <div className="md:col-span-2 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            لا توجد نتائج مطابقة. جرّب كلمات بحث أخرى أو غيّر الفلاتر.
          </div>
        )}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                {selected.brand ?? "Global"} · {selected.branch ?? "General"} · {selected.section}
              </p>
              <div className="rounded-xl border border-border/60 bg-secondary/20 p-3 whitespace-pre-line text-sm leading-7 max-h-[48vh] overflow-auto custom-scrollbar">
                {selected.details}
              </div>

              {selected.responseProtocol ? (
                <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm">
                  <p className="font-semibold mb-1">بروتوكول الرد لموظف الكول سنتر</p>
                  <p className="whitespace-pre-line">{selected.responseProtocol}</p>
                </div>
              ) : null}

              {selected.attachments.length ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium inline-flex items-center gap-1">
                    <Paperclip className="w-4 h-4" /> المرفقات
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selected.attachments.map((attachment) => (
                      <a
                        key={`${selected.id}-${attachment.url}`}
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs px-3 py-1.5 rounded-full border border-border/70 hover:border-primary/50"
                      >
                        {attachment.title} ({attachment.type})
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {selected.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-1 rounded bg-secondary border border-border/70">
                    {tag}
                  </span>
                ))}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KnowledgeBank;
