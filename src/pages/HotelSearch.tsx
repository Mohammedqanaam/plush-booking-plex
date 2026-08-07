import { type ReactNode, useDeferredValue, useMemo, useState } from "react";
import { BedDouble, Building2, PhoneCall, Presentation, Search, ShieldCheck, UtensilsCrossed } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { knowledgeEntries, quickIntents } from "@/data/operations";

type GroupKey = "الكل" | "سياسات" | "فروع" | "جهات اتصال" | "وجبات" | "غرف" | "مرافق" | "قاعات";

const groupIcons: Record<GroupKey, ReactNode> = {
  "الكل": <Search className="w-4 h-4" />,
  "سياسات": <ShieldCheck className="w-4 h-4" />,
  "فروع": <Building2 className="w-4 h-4" />,
  "جهات اتصال": <PhoneCall className="w-4 h-4" />,
  "وجبات": <UtensilsCrossed className="w-4 h-4" />,
  "غرف": <BedDouble className="w-4 h-4" />,
  "مرافق": <Building2 className="w-4 h-4" />,
  "قاعات": <Presentation className="w-4 h-4" />,
};

const groups: GroupKey[] = ["الكل", "سياسات", "فروع", "جهات اتصال", "وجبات", "غرف", "مرافق", "قاعات"];
const searchableEntries = knowledgeEntries.map((entry) => ({
  entry,
  searchText: [entry.title, entry.summary, entry.body, entry.group, ...entry.tags, ...(entry.contacts || []).map((contact) => contact.value)].join(" ").toLowerCase(),
}));

const HotelSearch = () => {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<GroupKey>("الكل");
  const deferredQuery = useDeferredValue(query);

  const normalized = deferredQuery.trim().toLowerCase();
  const hasCriteria = query.trim().length > 0 || group !== "الكل";
  const results = useMemo(() => {
    if (!normalized && group === "الكل") return [];
    const filtered = searchableEntries.filter(({ entry, searchText }) => {
      const matchesQuery = !normalized || searchText.includes(normalized);
      const matchesGroup = group === "الكل" || entry.group === group;
      return matchesQuery && matchesGroup;
    }).slice(0, 40).map(({ entry }) => entry);

    const grouped = groups
      .filter((g) => g !== "الكل")
      .map((g) => ({
        group: g,
        items: filtered.filter((entry) => entry.group === g),
      }))
      .filter((bucket) => bucket.items.length > 0);

    return grouped;
  }, [group, normalized]);

  return (
    <div className="page-wrap">
      <PageHeader title="البحث" icon={Search} />

      <div className="page-surface">

        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="مثال: إلغاء، إفطار، بودل العليا…"
            className="w-full h-11 rounded-lg bg-secondary border px-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {quickIntents.map((intent) => (
            <button
              key={intent}
              onClick={() => setQuery(intent)}
              className="px-3 py-1.5 rounded-full text-xs border border-primary/20 bg-primary/10"
            >
              {intent}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
          {groups.map((g) => {
            const active = g === group;
            return (
              <button
                key={g}
                onClick={() => setGroup(g)}
                className={`whitespace-nowrap px-3 py-2 rounded-lg text-xs border ${active ? "gold-gradient text-white border-transparent" : "bg-white/80 text-foreground border-primary/20"}`}
              >
                <span className="inline-flex items-center gap-1">{groupIcons[g]}{g}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        {!hasCriteria ? (
          <div className="page-surface text-center text-sm text-muted-foreground">اكتب كلمة أو اختر تصنيفًا لعرض النتائج.</div>
        ) : results.length === 0 ? (
          <div className="page-surface text-sm text-muted-foreground">لا توجد نتيجة مطابقة. جرّب كلمة أقصر.</div>
        ) : (
          results.map((bucket) => (
            <section key={bucket.group} className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">{groupIcons[bucket.group]} {bucket.group}</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {bucket.items.map((entry) => (
                  <article key={entry.id} className="page-surface render-lazy">
                    <h4 className="font-semibold">{entry.title}</h4>
                    <p className="text-sm whitespace-pre-line leading-6 text-muted-foreground">{entry.body}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {entry.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-[11px] px-2 py-1 rounded bg-secondary border">{tag}</span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
};

export default HotelSearch;
