import { useMemo, useState } from "react";
import { BookOpenText, Search } from "lucide-react";
import { getAdminSession, hasPermission } from "@/lib/adminAuth";
import { branchRecords, globalReferences } from "@/data/knowledge";
import PageHeader from "@/components/PageHeader";

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
    <div className="page-wrap">
      <PageHeader title="إدارة بنك المعلومات" icon={BookOpenText} />

      <div className="page-surface">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 rounded-xl bg-secondary border px-10 w-full"
            placeholder="بحث بالفرع أو المدينة أو العلامة"
          />
        </div>
        <p className="text-xs text-muted-foreground">إجمالي المراجع العامة: {globalReferences.length}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {filtered.map((row) => (
          <article key={row.id} className="page-surface text-sm">
            <h3 className="font-semibold text-base">{row.branch}</h3>
            <p>{row.brand} · {row.city}</p>
            <p className="text-muted-foreground">استقبال: {row.receptionPhone}</p>
          </article>
        ))}
      </div>
    </div>
  );
};

export default AdminKnowledgeBank;
