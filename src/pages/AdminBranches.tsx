import { useMemo, useState } from "react";
import { branches, type Branch } from "@/data/branches";
import { Building2 } from "lucide-react";
import { getAdminSession, hasPermission } from "@/lib/adminAuth";
import PageHeader from "@/components/PageHeader";

type EditableBranch = Record<string, Partial<Branch>>;

const AdminBranches = () => {
  const session = getAdminSession();
  const canManage = session ? hasPermission(session.role, "manage_knowledge") : false;

  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("الكل");
  const [status, setStatus] = useState("الكل");
  const [selectedId, setSelectedId] = useState(branches[0]?.id ?? "");
  const [edits, setEdits] = useState<EditableBranch>({});

  const brands = useMemo(() => ["الكل", ...Array.from(new Set(branches.map((b) => b.brand)))], []);
  const statuses = ["الكل", "verified", "partially_verified", "conflicting", "missing_info"];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return branches.filter((branch) => {
      const matchesBrand = brand === "الكل" || branch.brand === brand;
      const matchesStatus = status === "الكل" || branch.verificationStatus === status;
      const searchable = [branch.name, branch.city, branch.brand, ...branch.contacts.map((c) => c.value)].join(" ").toLowerCase();
      const matchesText = !q || searchable.includes(q);
      return matchesBrand && matchesStatus && matchesText;
    });
  }, [brand, search, status]);

  const selected = filtered.find((b) => b.id === selectedId) ?? filtered[0];

  if (!canManage) return <div className="p-4">ليس لديك صلاحية إدارة بيانات الفروع.</div>;

  return (
    <div className="page-wrap">
      <PageHeader title="إدارة الفروع" icon={Building2} />
      <div className="glass-card p-4 space-y-3">
        <div className="grid gap-2 md:grid-cols-4">
          <input className="h-10 rounded-lg bg-secondary border px-3 md:col-span-2" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالفرع أو المدينة أو رقم التواصل" />
          <select className="h-10 rounded-lg bg-secondary border px-2" value={brand} onChange={(e) => setBrand(e.target.value)}>{brands.map((item) => <option key={item}>{item}</option>)}</select>
          <select className="h-10 rounded-lg bg-secondary border px-2" value={status} onChange={(e) => setStatus(e.target.value)}>{statuses.map((item) => <option key={item}>{item}</option>)}</select>
        </div>
      </div>

      <div className="glass-card p-4 table-scroll custom-scrollbar">
        <table className="min-w-[900px] w-full text-sm">
          <thead><tr className="text-right border-b"><th className="p-2">الفرع</th><th className="p-2">المدينة</th><th className="p-2">العلامة</th><th className="p-2">الهاتف</th><th className="p-2">الإفطار</th><th className="p-2">الحالة</th></tr></thead>
          <tbody>
            {filtered.map((branch) => (
              <tr key={branch.id} className="border-b/40 hover:bg-secondary/20 cursor-pointer" onClick={() => setSelectedId(branch.id)}>
                <td className="p-2">{branch.name}</td><td className="p-2">{branch.city}</td><td className="p-2">{branch.brand}</td><td className="p-2">{branch.contacts[0]?.value ?? "—"}</td><td className="p-2">{branch.services.breakfast}</td><td className="p-2">{branch.verificationStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected ? (
        <div className="glass-card p-4 space-y-3">
          <h3 className="text-lg font-semibold">تفاصيل {selected.name}</h3>
          <div className="grid md:grid-cols-2 gap-2 text-sm">{Object.entries(selected.services).map(([key, value]) => <p key={key}><span className="text-muted-foreground">{key}:</span> {value}</p>)}</div>
          <textarea className="w-full rounded-lg bg-secondary border p-2 min-h-24" value={edits[selected.id]?.notes ?? selected.notes ?? ""} onChange={(e) => setEdits((prev) => ({ ...prev, [selected.id]: { ...prev[selected.id], notes: e.target.value } }))} placeholder="ملاحظات المشرف" />
        </div>
      ) : null}
    </div>
  );
};

export default AdminBranches;
