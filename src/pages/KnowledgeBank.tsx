import { useMemo, useState } from "react";
import { quickIntents, knowledgeEntries, type KnowledgeEntry, type KnowledgeGroup } from "@/data/operations";

const groups: Array<"الكل" | KnowledgeGroup> = ["الكل", "سياسات", "فروع", "جهات اتصال", "وجبات", "غرف", "تعاميم", "إجراءات", "حلول"];
const brands = ["الكل", "Boudl", "Braira", "Narcissus", "Aber"] as const;

const searchableText = (entry: KnowledgeEntry) => [
  entry.title,
  entry.summary,
  entry.body,
  entry.group,
  entry.category,
  entry.brand || "",
  entry.branch || "",
  ...(entry.tags || []),
  ...(entry.contacts || []).map((c) => `${c.label} ${c.value}`),
  entry.policy_text || "",
  entry.response_protocol || "",
  entry.internal_protocol || "",
].join(" ").toLowerCase();

const KnowledgeBank = () => {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<"الكل" | KnowledgeGroup>("الكل");
  const [brand, setBrand] = useState<(typeof brands)[number]>("الكل");
  const [selected, setSelected] = useState<KnowledgeEntry | null>(null);

  const branches = useMemo(() => {
    const set = new Set(
      knowledgeEntries
        .filter((entry) => (brand === "الكل" ? true : entry.brand === brand))
        .map((entry) => entry.branch)
        .filter(Boolean) as string[],
    );
    return ["الكل", ...Array.from(set)];
  }, [brand]);
  const [branch, setBranch] = useState<string>("الكل");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return knowledgeEntries
      .filter((entry) => {
        const groupMatch = group === "الكل" || entry.group === group;
        const brandMatch = brand === "الكل" || entry.brand === brand;
        const branchMatch = branch === "الكل" || entry.branch === branch;
        const textMatch = !q || searchableText(entry).includes(q);
        return groupMatch && brandMatch && branchMatch && textMatch;
      })
      .sort((a, b) => (a.priority || 999) - (b.priority || 999));
  }, [query, group, brand, branch]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return knowledgeEntries.filter((entry) => searchableText(entry).includes(q)).slice(0, 8);
  }, [query]);

  const groupedResults = useMemo(
    () => groups.filter((g) => g !== "الكل").map((g) => ({ group: g, items: filtered.filter((entry) => entry.group === g) })).filter((b) => b.items.length > 0),
    [filtered],
  );

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <div className="glass-card p-4 space-y-3">
        <h2 className="text-2xl font-bold">بنك المعلومات</h2>
        <p className="text-xs text-muted-foreground">مرجع تشغيلي سريع بديل الإكسل: بحث ذكي + فلاتر + سجلات معرفة تفصيلية.</p>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث: سياسة الإلغاء، مدير، فطور، فرع..."
          className="w-full h-11 rounded-lg bg-secondary border px-3"
        />

        {suggestions.length > 0 && (
          <div className="rounded-lg border bg-secondary/40 p-2">
            <p className="text-xs text-muted-foreground mb-1">اقتراحات فورية</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button key={`s-${s.id}`} className="text-xs px-2 py-1 rounded border bg-background" onClick={() => { setQuery(s.title); setSelected(s); }}>
                  {s.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {quickIntents.map((intent) => (
            <button key={intent} onClick={() => setQuery(intent)} className="px-3 py-1.5 rounded-full text-xs bg-primary/10 border border-primary/20">
              {intent}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-3 gap-2">
          <select className="h-10 rounded-lg bg-secondary border px-2" value={group} onChange={(e) => setGroup(e.target.value as typeof group)}>
            {groups.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <select className="h-10 rounded-lg bg-secondary border px-2" value={brand} onChange={(e) => { setBrand(e.target.value as typeof brand); setBranch("الكل"); }}>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className="h-10 rounded-lg bg-secondary border px-2" value={branch} onChange={(e) => setBranch(e.target.value)}>
            {branches.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {groupedResults.map((bucket) => (
          <section key={bucket.group} className="space-y-2">
            <h3 className="font-semibold text-sm">{bucket.group}</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {bucket.items.map((entry) => (
                <button key={entry.id} onClick={() => setSelected(entry)} className="glass-card p-4 text-right space-y-2">
                  <p className="text-xs text-primary">{entry.category}</p>
                  <h4 className="font-semibold">{entry.title}</h4>
                  <p className="text-sm text-muted-foreground">{entry.summary}</p>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-end md:items-center justify-center" onClick={() => setSelected(null)}>
          <div className="w-full max-w-2xl max-h-[85vh] overflow-auto glass-card p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{selected.title}</h3>
              <button className="text-xs border rounded px-2 py-1" onClick={() => setSelected(null)}>إغلاق</button>
            </div>
            <p className="text-xs text-primary">{selected.group} · {selected.category}</p>
            <p className="text-sm">{selected.summary}</p>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{selected.body}</p>
            {selected.policy_text ? <div className="rounded border p-2"><p className="text-xs text-muted-foreground">ملخص السياسة</p><p className="text-sm">{selected.policy_text}</p></div> : null}
            {selected.response_protocol ? <div className="rounded border p-2"><p className="text-xs text-muted-foreground">آلية الرد على الضيف</p><p className="text-sm">{selected.response_protocol}</p></div> : null}
            {selected.internal_protocol ? <div className="rounded border p-2"><p className="text-xs text-muted-foreground">البروتوكول الداخلي المختصر</p><p className="text-sm">{selected.internal_protocol}</p></div> : null}
            {selected.contacts?.length ? <div className="rounded border p-2"><p className="text-xs text-muted-foreground">الأرقام المرتبطة</p>{selected.contacts.map((c) => <p key={`${c.label}-${c.value}`} className="text-sm">{c.label}: {c.value}</p>)}</div> : null}
            {selected.attachment ? <a href={selected.attachment.url || "#"} target="_blank" rel="noreferrer" className="inline-block h-9 px-3 leading-9 rounded border">{selected.attachment.label || "فتح المرفق"}</a> : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBank;
