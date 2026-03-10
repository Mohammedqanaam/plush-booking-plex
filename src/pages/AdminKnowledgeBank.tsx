import { useMemo, useState } from "react";
import { quickIntents, knowledgeEntries, type KnowledgeEntry, type KnowledgeGroup } from "@/data/operations";
import { branches } from "@/data/branches";
import { getAdminSession, hasPermission } from "@/lib/adminAuth";

const groups: Array<"الكل" | KnowledgeGroup> = ["الكل", "سياسات", "فروع", "جهات اتصال", "وجبات", "غرف", "تعاميم", "إجراءات", "حلول"];
const searchableText = (entry: KnowledgeEntry) => [entry.title, entry.summary, entry.body, entry.group, entry.category, entry.branch || "", ...(entry.tags || [])].join(" ").toLowerCase();

const emptyDraft: Omit<KnowledgeEntry, "id"> = {
  type: "branch_info",
  category: "branch_info",
  group: "فروع",
  title: "",
  summary: "",
  body: "",
  tags: [],
};

const AdminKnowledgeBank = () => {
  const session = getAdminSession();
  const canManage = session ? hasPermission(session.role, "manage_knowledge") : false;

  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<"الكل" | KnowledgeGroup>("الكل");
  const [branch, setBranch] = useState("الكل");
  const [selected, setSelected] = useState<KnowledgeEntry | null>(null);
  const [entries, setEntries] = useState<KnowledgeEntry[]>(knowledgeEntries);
  const [draft, setDraft] = useState(emptyDraft);
<<<<<<< copilot/fix-branch-data-issues
  const [editingId, setEditingId] = useState<string | null>(null);
=======
>>>>>>> main

  const branchOptions = useMemo(() => ["الكل", ...Array.from(new Set(branches.map((item) => item.name)))], []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchGroup = group === "الكل" || entry.group === group;
      const matchBranch = branch === "الكل" || entry.branch === branch;
      const matchText = !q || searchableText(entry).includes(q);
      return matchGroup && matchBranch && matchText;
    });
  }, [entries, group, branch, query]);

<<<<<<< copilot/fix-branch-data-issues
  if (!canManage) return <div className="p-4">ليس لديك صلاحية إدارة بنك المعلومات.</div>;

  const upsertDraft = () => {
    if (!draft.title.trim()) return;
    if (editingId) {
      setEntries((prev) => prev.map((entry) => (entry.id === editingId ? { ...entry, ...draft, tags: draft.tags.length ? draft.tags : ["manual"] } : entry)));
      setEditingId(null);
      setDraft(emptyDraft);
      return;
    }
=======
  if (!canManage) {
    return <div className="p-4">ليس لديك صلاحية إدارة بنك المعلومات.</div>;
  }

  const upsertDraft = () => {
    if (!draft.title.trim()) return;
>>>>>>> main
    const id = `manual-${Date.now()}`;
    setEntries((prev) => [{ ...draft, id, tags: draft.tags.length ? draft.tags : ["manual"] }, ...prev]);
    setDraft(emptyDraft);
  };

<<<<<<< copilot/fix-branch-data-issues
  const deleteEntry = (id: string) => setEntries((prev) => prev.filter((entry) => entry.id !== id));
  const startEdit = (entry: KnowledgeEntry) => {
    setDraft({
      type: entry.type,
      category: entry.category,
      group: entry.group,
      brand: entry.brand,
      branch: entry.branch,
      title: entry.title,
      summary: entry.summary,
      body: entry.body,
      tags: entry.tags,
      contacts: entry.contacts,
      priority: entry.priority,
    });
    setEditingId(entry.id);
  };

=======
>>>>>>> main
  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <div className="glass-card p-4 space-y-3">
        <h2 className="text-2xl font-bold">إدارة بنك المعلومات (لوحة الأدمن)</h2>
        <div className="grid md:grid-cols-4 gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بحث" className="h-10 rounded-lg bg-secondary border px-3 md:col-span-2" />
          <select className="h-10 rounded-lg bg-secondary border px-2" value={group} onChange={(e) => setGroup(e.target.value as "الكل" | KnowledgeGroup)}>{groups.map((item) => <option key={item}>{item}</option>)}</select>
          <select className="h-10 rounded-lg bg-secondary border px-2" value={branch} onChange={(e) => setBranch(e.target.value)}>{branchOptions.map((item) => <option key={item}>{item}</option>)}</select>
        </div>
        <div className="flex flex-wrap gap-2">{quickIntents.map((intent) => <button key={intent} onClick={() => setQuery(intent)} className="text-xs px-3 py-1 rounded-full border">{intent}</button>)}</div>
      </div>

      <div className="glass-card p-4 space-y-2">
<<<<<<< copilot/fix-branch-data-issues
        <h3 className="font-semibold">إضافة سجل معرفة</h3>
=======
        <h3 className="font-semibold">إضافة سجل</h3>
>>>>>>> main
        <div className="grid gap-2 md:grid-cols-2">
          <input className="h-9 rounded border bg-secondary px-2" value={draft.title} onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))} placeholder="العنوان" />
          <select className="h-9 rounded border bg-secondary px-2" value={draft.category} onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value as KnowledgeEntry["category"] }))}>
            <option value="branch_info">branch_info</option><option value="breakfast">breakfast</option><option value="amenities">amenities</option><option value="policies">policies</option><option value="contacts">contacts</option>
          </select>
          <textarea className="rounded border bg-secondary px-2 py-1 md:col-span-2 min-h-20" value={draft.body} onChange={(e) => setDraft((p) => ({ ...p, body: e.target.value, summary: e.target.value.slice(0, 80) }))} placeholder="المحتوى" />
<<<<<<< copilot/fix-branch-data-issues
          <select className="h-9 rounded border bg-secondary px-2" value={draft.branch ?? ""} onChange={(e) => setDraft((p) => ({ ...p, branch: e.target.value || undefined }))}>
            <option value="">بدون ربط فرع</option>
            {branchOptions.filter((item) => item !== "الكل").map((item) => <option key={item}>{item}</option>)}
          </select>
          <button onClick={upsertDraft} className="h-9 rounded-lg gold-gradient text-primary-foreground">{editingId ? "حفظ التعديل" : "إضافة"}</button>
=======
          <button onClick={upsertDraft} className="h-9 rounded-lg gold-gradient text-primary-foreground">إضافة</button>
>>>>>>> main
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {filtered.map((entry) => (
          <article key={entry.id} className="glass-card p-4 space-y-2">
<<<<<<< copilot/fix-branch-data-issues
            <div className="flex justify-between items-center gap-2">
              <p className="text-xs text-primary">{entry.category}</p>
              <div className="flex items-center gap-2">
                <button className="text-xs border rounded px-2 py-1" onClick={() => startEdit(entry)}>تعديل</button>
                <button className="text-xs border rounded px-2 py-1" onClick={() => deleteEntry(entry.id)}>حذف</button>
              </div>
            </div>
=======
            <div className="flex justify-between"><p className="text-xs text-primary">{entry.category}</p><button className="text-xs border rounded px-2 py-1" onClick={() => setEntries((prev) => prev.filter((e) => e.id !== entry.id))}>حذف</button></div>
>>>>>>> main
            <button className="text-right w-full" onClick={() => setSelected(entry)}><h4 className="font-semibold">{entry.title}</h4><p className="text-sm text-muted-foreground">{entry.summary}</p></button>
          </article>
        ))}
      </div>

<<<<<<< copilot/fix-branch-data-issues
      {selected ? <div className="glass-card p-4 space-y-1"><h4 className="font-semibold">{selected.title}</h4><p className="text-xs text-muted-foreground">{selected.group} · {selected.branch ?? "عام"}</p><p className="whitespace-pre-line text-sm">{selected.body}</p></div> : null}
=======
      {selected ? <div className="glass-card p-4"><h4 className="font-semibold">{selected.title}</h4><p className="text-sm whitespace-pre-line">{selected.body}</p></div> : null}
>>>>>>> main
    </div>
  );
};

export default AdminKnowledgeBank;
