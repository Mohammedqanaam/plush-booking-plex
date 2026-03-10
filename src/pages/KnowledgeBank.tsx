import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { quickIntents, knowledgeEntries, type KnowledgeEntry, type KnowledgeGroup } from "@/data/operations";
import { branches } from "@/data/branches";

const groups: Array<"الكل" | KnowledgeGroup> = ["الكل", "سياسات", "فروع", "جهات اتصال", "وجبات", "غرف", "تعاميم", "إجراءات", "حلول"];

const searchableText = (entry: KnowledgeEntry) => [entry.title, entry.summary, entry.body, entry.group, entry.category, entry.branch || "", ...(entry.tags || [])].join(" ").toLowerCase();

const KnowledgeBank = () => {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<"الكل" | KnowledgeGroup>("الكل");
  const [branch, setBranch] = useState("الكل");
  const [selected, setSelected] = useState<KnowledgeEntry | null>(null);

  const branchOptions = useMemo(() => ["الكل", ...Array.from(new Set(branches.map((item) => item.name)))], []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return knowledgeEntries.filter((entry) => {
      const matchGroup = group === "الكل" || entry.group === group;
      const matchBranch = branch === "الكل" || entry.branch === branch;
      const matchText = !q || searchableText(entry).includes(q);
      return matchGroup && matchBranch && matchText;
    });
  }, [group, branch, query]);

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <div className="glass-card p-4 space-y-3">
        <h2 className="text-2xl font-bold">بنك المعلومات</h2>
        <p className="text-xs text-muted-foreground">
          الصفحة للعرض فقط. إضافة أو تعديل أو حذف السجلات يتم فقط من لوحة الأدمن بعد تسجيل الدخول.
          {" "}
          <Link className="underline" to="/admin/login">تسجيل دخول الأدمن</Link>
        </p>
        <div className="grid md:grid-cols-4 gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بحث" className="h-10 rounded-lg bg-secondary border px-3 md:col-span-2" />
          <select className="h-10 rounded-lg bg-secondary border px-2" value={group} onChange={(e) => setGroup(e.target.value as "الكل" | KnowledgeGroup)}>{groups.map((item) => <option key={item}>{item}</option>)}</select>
          <select className="h-10 rounded-lg bg-secondary border px-2" value={branch} onChange={(e) => setBranch(e.target.value)}>{branchOptions.map((item) => <option key={item}>{item}</option>)}</select>
        </div>
        <div className="flex flex-wrap gap-2">{quickIntents.map((intent) => <button key={intent} onClick={() => setQuery(intent)} className="text-xs px-3 py-1 rounded-full border">{intent}</button>)}</div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {filtered.map((entry) => (
          <article key={entry.id} className="glass-card p-4 space-y-2">
            <div className="flex justify-between items-center gap-2"><p className="text-xs text-primary">{entry.category}</p></div>
            <button className="text-right w-full" onClick={() => setSelected(entry)}><h4 className="font-semibold">{entry.title}</h4><p className="text-sm text-muted-foreground">{entry.summary}</p></button>
          </article>
        ))}
      </div>

      {selected ? <div className="glass-card p-4 space-y-1"><h4 className="font-semibold">{selected.title}</h4><p className="text-xs text-muted-foreground">{selected.group} · {selected.branch ?? "عام"}</p><p className="whitespace-pre-line text-sm">{selected.body}</p></div> : null}
    </div>
  );
};

export default KnowledgeBank;
