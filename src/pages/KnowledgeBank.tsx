import { useMemo, useState } from "react";
import { quickIntents, knowledgeEntries, type KnowledgeEntry, type KnowledgeGroup } from "@/data/operations";

const groups: Array<"الكل" | KnowledgeGroup> = ["الكل", "سياسات", "فروع", "جهات اتصال", "وجبات", "غرف", "تعاميم", "إجراءات", "حلول"];

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
  const [selected, setSelected] = useState<KnowledgeEntry | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return knowledgeEntries.filter((entry) => {
      const groupMatch = group === "الكل" || entry.group === group;
      const textMatch = !q || searchableText(entry).includes(q);
      return groupMatch && textMatch;
    }).sort((a, b) => (a.priority || 999) - (b.priority || 999));
  }, [query, group]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return knowledgeEntries
      .filter((entry) => searchableText(entry).includes(q))
      .slice(0, 6);
  }, [query]);

  const groupedResults = useMemo(() => {
    return groups
      .filter((g) => g !== "الكل")
      .map((g) => ({ group: g, items: filtered.filter((entry) => entry.group === g) }))
      .filter((bucket) => bucket.items.length > 0);
  }, [filtered]);

import { quickIntents, knowledgeEntries } from "@/data/operations";

const KnowledgeBank = () => {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return knowledgeEntries;
    return knowledgeEntries.filter((entry) =>
      [entry.title, entry.body, entry.group, ...entry.tags].join(" ").toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <div className="glass-card p-4 space-y-2">
        <h2 className="text-2xl font-bold">بنك المعلومات</h2>
        <p className="text-xs text-muted-foreground">Operational Knowledge Explorer: بحث سريع + بروتوكول رد + تفاصيل تشغيلية + مرفقات.</p>
        <p className="text-xs text-muted-foreground">مرجع تشغيلي سريع بديل للإكسل — اقتراحات فورية بدون تجربة شات.</p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="اكتب أول حرفين أو كلمة مثل: إلغاء، مدير، فطور"
          className="w-full h-11 rounded-lg bg-secondary border px-3"
        />

        {suggestions.length > 0 && (
          <div className="rounded-lg border bg-secondary/50 p-2">
            <p className="text-xs text-muted-foreground mb-1">اقتراحات فورية</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((item) => (
                <button
                  key={`s-${item.id}`}
                  className="px-2 py-1 rounded-md text-xs border bg-background"
                  onClick={() => { setQuery(item.title); setSelected(item); }}
                >
                  {item.title}
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
        <div className="flex flex-wrap gap-2 pt-2">
          {groups.map((item) => (
            <button key={item} onClick={() => setGroup(item)} className={`px-3 py-1.5 rounded-full text-xs border ${group === item ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {groupedResults.map((bucket) => (
          <section key={bucket.group} className="space-y-2">
            <h3 className="font-semibold text-sm">{bucket.group}</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {bucket.items.map((entry) => (
                <button key={entry.id} onClick={() => setSelected(entry)} className="glass-card p-4 space-y-2 text-right">
                  <p className="text-xs text-primary">{entry.category}</p>
                  <h4 className="font-semibold">{entry.title}</h4>
                  <p className="text-sm text-muted-foreground">{entry.summary}</p>
                  <div className="flex gap-2 flex-wrap">
                    {entry.tags.slice(0, 4).map((tag) => <span key={tag} className="text-[11px] px-2 py-1 rounded bg-secondary">{tag}</span>)}
                  </div>
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
            {selected.policy_text && <div className="rounded border p-2"><p className="text-xs text-muted-foreground">ملخص السياسة</p><p className="text-sm">{selected.policy_text}</p></div>}
            {selected.response_protocol && <div className="rounded border p-2"><p className="text-xs text-muted-foreground">آلية الرد على الضيف</p><p className="text-sm">{selected.response_protocol}</p></div>}
            {selected.internal_protocol && <div className="rounded border p-2"><p className="text-xs text-muted-foreground">البروتوكول الداخلي المختصر</p><p className="text-sm">{selected.internal_protocol}</p></div>}
            {selected.contacts?.length ? <div className="rounded border p-2"><p className="text-xs text-muted-foreground">جهات الاتصال</p>{selected.contacts.map((c) => <p key={`${c.label}-${c.value}`} className="text-sm">{c.label}: {c.value}</p>)}</div> : null}
            {selected.attachment ? <a href={selected.attachment.url || "#"} target="_blank" rel="noreferrer" className="inline-block h-9 px-3 leading-9 rounded border">{selected.attachment.label || "فتح المرفق"}</a> : null}
          </div>
        </div>
      )}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {filtered.map((entry) => (
          <article key={entry.id} className="glass-card p-4 space-y-2">
            <p className="text-xs text-primary">{entry.group}</p>
            <h3 className="font-semibold">{entry.title}</h3>
            <p className="text-sm text-muted-foreground">{entry.body}</p>
            <div className="flex gap-2 flex-wrap">
              {entry.tags.map((tag) => <span key={tag} className="text-[11px] px-2 py-1 rounded bg-secondary">{tag}</span>)}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default KnowledgeBank;
