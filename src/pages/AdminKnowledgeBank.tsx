import { useMemo, useState } from "react";
import { getAdminSession, hasPermission } from "@/lib/adminAuth";
import { branchRecords, globalReferences } from "@/data/knowledge";

const AdminKnowledgeBank = () => {
  const session = getAdminSession();
  const canManage = session ? hasPermission(session.role, "manage_knowledge") : false;
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return branchRecords.filter((row) => !q || `${row.branch} ${row.city} ${row.brand}`.toLowerCase().includes(q));
  }, [query]);

  if (!canManage) return <div className="p-4">ليس لديك صلاحية إدارة بنك المعلومات.</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <div className="glass-card p-4 space-y-2">
        <h2 className="text-2xl font-bold">إدارة بنك المعلومات</h2>
        <input value={query} onChange={(e) => setQuery(e.target.value)} className="h-10 rounded-lg bg-secondary border px-3 w-full" placeholder="بحث بالفرع/المدينة/البراند" />
        <p className="text-xs text-muted-foreground">Global References: {globalReferences.length}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {filtered.map((row) => (
          <article key={row.id} className="glass-card p-4 text-sm space-y-1">
            <h3 className="font-semibold">{row.branch}</h3>
            <p>{row.brand} · {row.city}</p>
            <p className="text-muted-foreground">استقبال: {row.receptionPhone}</p>
          </article>
        ))}
      </div>
    </div>
  );
};

export default AdminKnowledgeBank;
