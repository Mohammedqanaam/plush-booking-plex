import { useMemo, useState } from "react";
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
        <p className="text-xs text-muted-foreground">مرجع تشغيلي سريع بديل للإكسل — اقتراحات فورية بدون تجربة شات.</p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="اكتب أول حرفين أو كلمة مثل: إلغاء، مدير، فطور"
          className="w-full h-11 rounded-lg bg-secondary border px-3"
        />
        <div className="flex flex-wrap gap-2">
          {quickIntents.map((intent) => (
            <button key={intent} onClick={() => setQuery(intent)} className="px-3 py-1.5 rounded-full text-xs bg-primary/10 border border-primary/20">
              {intent}
            </button>
          ))}
        </div>
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
