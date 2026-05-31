import { type ReactNode, useMemo, useState } from "react";
import { Building2, FileText, LifeBuoy, PhoneCall, Search, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { knowledgeEntries, quickIntents } from "@/data/operations";

type GroupKey = "الكل" | "أسئلة وأجوبة" | "سياسات" | "إجراءات" | "فروع" | "جهات اتصال" | "مرافق" | "تعاميم" | "حلول";

const groupAliases: Record<string, GroupKey> = {
  "سياسات": "سياسات",
  "إجراءات": "إجراءات",
  "جهات اتصال": "جهات اتصال",
  "مرافق": "مرافق",
  "تعاميم": "تعاميم",
};

const groupIcons: Record<GroupKey, ReactNode> = {
  "الكل": <Search className="w-4 h-4" />,
  "أسئلة وأجوبة": <LifeBuoy className="w-4 h-4" />,
  "سياسات": <ShieldCheck className="w-4 h-4" />,
  "إجراءات": <Wrench className="w-4 h-4" />,
  "فروع": <Building2 className="w-4 h-4" />,
  "جهات اتصال": <PhoneCall className="w-4 h-4" />,
  "مرافق": <Building2 className="w-4 h-4" />,
  "تعاميم": <FileText className="w-4 h-4" />,
  "حلول": <LifeBuoy className="w-4 h-4" />,
};

const groups: GroupKey[] = ["الكل", "أسئلة وأجوبة", "سياسات", "إجراءات", "فروع", "جهات اتصال", "مرافق", "تعاميم", "حلول"];

const HotelSearch = () => {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<GroupKey>("الكل");

  const normalized = query.trim().toLowerCase();
  const results = useMemo(() => {
    const filtered = knowledgeEntries.filter((entry) => {
      const haystack = [entry.title, entry.body, entry.group, ...entry.tags].join(" ").toLowerCase();
      const matchesQuery = !normalized || haystack.includes(normalized);
      const mappedGroup = groupAliases[entry.group] || "أسئلة وأجوبة";
      const matchesGroup = group === "الكل" || mappedGroup === group;
      return matchesQuery && matchesGroup;
    });

    const grouped = groups
      .filter((g) => g !== "الكل")
      .map((g) => ({
        group: g,
        items: filtered.filter((entry) => (groupAliases[entry.group] || "أسئلة وأجوبة") === g),
      }))
      .filter((bucket) => bucket.items.length > 0);

    return grouped;
  }, [group, normalized]);

  return (
    <div className="page-wrap">
      <PageHeader title="مستكشف المعلومات التشغيلي" subtitle="بحث تشغيلي فوري مع تصنيفات واضحة واقتراحات سريعة." icon={Sparkles} />

      <div className="page-surface">

        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="اكتب أول حرفين أو ثلاث: إلغاء، مدير، فطور، استلام..."
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
                className={`whitespace-nowrap px-3 py-2 rounded-lg text-xs border ${active ? "gold-gradient text-primary-foreground border-transparent" : "bg-secondary border-border"}`}
              >
                <span className="inline-flex items-center gap-1">{groupIcons[g]}{g}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        {results.length === 0 ? (
          <div className="page-surface text-sm text-muted-foreground">لا توجد نتائج مطابقة. جرّب كلمات أقصر أو اختر تصنيفًا مختلفًا.</div>
        ) : (
          results.map((bucket) => (
            <section key={bucket.group} className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">{groupIcons[bucket.group]} {bucket.group}</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {bucket.items.map((entry) => (
                  <article key={entry.id} className="page-surface">
                    <p className="text-xs text-primary">{entry.group}</p>
                    <h4 className="font-semibold">{entry.title}</h4>
                    <p className="text-sm text-muted-foreground">{entry.body}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {entry.tags.map((tag) => (
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
