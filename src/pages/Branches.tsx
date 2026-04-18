import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, CircleDot, Search, ShieldAlert } from "lucide-react";
import { branches } from "@/data/branches";
import PageHeader from "@/components/PageHeader";

const statusLabel: Record<string, string> = {
  verified: "موثّق",
  partially_verified: "تحقق جزئي",
  conflicting: "متعارض",
  missing_info: "ناقص",
};

const statusChip: Record<string, string> = {
  verified: "border-emerald-400/35 bg-emerald-400/10 text-emerald-300",
  partially_verified: "border-sky-400/35 bg-sky-400/10 text-sky-300",
  conflicting: "border-amber-400/35 bg-amber-400/10 text-amber-300",
  missing_info: "border-rose-400/35 bg-rose-400/10 text-rose-300",
};

const Branches = () => {
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("الكل");
  const [status, setStatus] = useState("الكل");
  const [selectedId, setSelectedId] = useState(branches[0]?.id ?? "");

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

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      <PageHeader title="إدارة الفروع" subtitle="عرض مركزي واضح لبيانات الفروع، الخدمات، وحالة التوثيق." icon={Building2} />

      <section className="page-surface space-y-3">
        <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5" /> هذه الصفحة للعرض فقط، ويتم التعديل عبر لوحة الإدارة. <Link className="underline" to="/admin/login">تسجيل دخول الإدارة</Link>
        </p>

        <div className="grid gap-2 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="h-11 rounded-xl bg-secondary/70 border px-10 w-full" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالفرع، المدينة، أو رقم التواصل" />
          </div>
          <select className="h-11 rounded-xl bg-secondary/70 border px-3" value={brand} onChange={(e) => setBrand(e.target.value)}>{brands.map((item) => <option key={item}>{item}</option>)}</select>
          <select className="h-11 rounded-xl bg-secondary/70 border px-3" value={status} onChange={(e) => setStatus(e.target.value)}>
            {statuses.map((item) => <option key={item} value={item}>{item === "الكل" ? item : statusLabel[item]}</option>)}
          </select>
        </div>
      </section>

      <div className="grid lg:grid-cols-[1.4fr_.9fr] gap-3">
        <section className="page-surface table-scroll">
          <table className="min-w-[920px] w-full text-sm">
            <thead><tr className="text-right border-b border-border/60 text-muted-foreground"><th className="p-2.5">الفرع</th><th className="p-2.5">المدينة</th><th className="p-2.5">البراند</th><th className="p-2.5">الهاتف</th><th className="p-2.5">الإفطار</th><th className="p-2.5">المسبح</th><th className="p-2.5">الحالة</th></tr></thead>
            <tbody>
              {filtered.map((branch) => (
                <tr key={branch.id} className={`border-b border-border/40 cursor-pointer ${selected?.id === branch.id ? "bg-primary/10" : "hover:bg-secondary/25"}`} onClick={() => setSelectedId(branch.id)}>
                  <td className="p-2.5 font-medium">{branch.name}</td><td className="p-2.5">{branch.city}</td><td className="p-2.5">{branch.brand}</td><td className="p-2.5" dir="ltr">{branch.contacts[0]?.value ?? "—"}</td><td className="p-2.5">{branch.services.breakfast}</td><td className="p-2.5">{branch.services.pool}</td><td className="p-2.5"><span className={`px-2 py-1 rounded-full text-xs border ${statusChip[branch.verificationStatus]}`}>{statusLabel[branch.verificationStatus]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {selected ? <section className="page-surface space-y-3"><h3 className="text-lg font-semibold">تفاصيل {selected.name}</h3><div className="space-y-2 text-sm">{Object.entries(selected.services).map(([key, value]) => <p key={key} className="flex items-start gap-1"><CircleDot className="w-4 h-4 mt-0.5 text-primary" /><span><span className="text-muted-foreground">{key}:</span> {value}</span></p>)}</div></section> : null}
      </div>
    </div>
  );
};

export default Branches;
