import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Search } from "lucide-react";
import { branches } from "@/data/branches";
import PageHeader from "@/components/PageHeader";

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

  useEffect(() => {
    if (!filtered.find((branch) => branch.id === selectedId)) {
      setSelectedId(filtered[0]?.id ?? "");
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((b) => b.id === selectedId);

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <PageHeader title="إدارة الفروع" subtitle="عرض معلومات الفروع والخدمات بشكل سريع ومرتب." icon={Building2} />
      <div className="page-surface">
        <p className="text-xs text-muted-foreground">هذه الصفحة للعرض فقط. تعديل بيانات الفروع متاح فقط من لوحة الأدمن بعد تسجيل الدخول. <Link className="underline" to="/admin/login">تسجيل دخول الأدمن</Link></p>
        <div className="grid gap-2 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="h-11 rounded-xl bg-secondary border px-10 w-full" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالفرع أو المدينة أو رقم التواصل" />
          </div>
          <select className="h-11 rounded-xl bg-secondary border px-2" value={brand} onChange={(e) => setBrand(e.target.value)}>{brands.map((item) => <option key={item}>{item}</option>)}</select>
          <select className="h-11 rounded-xl bg-secondary border px-2" value={status} onChange={(e) => setStatus(e.target.value)}>{statuses.map((item) => <option key={item}>{item}</option>)}</select>
        </div>
      </div>

      {filtered.length ? (
        <>
          <div className="page-surface table-scroll custom-scrollbar">
            <table className="min-w-[900px] w-full text-sm">
              <thead><tr className="text-right border-b"><th className="p-2">الفرع</th><th className="p-2">المدينة</th><th className="p-2">البراند</th><th className="p-2">الهاتف</th><th className="p-2">الإفطار</th><th className="p-2">المسبح</th><th className="p-2">الحالة</th></tr></thead>
              <tbody>
                {filtered.map((branch) => (
                  <tr key={branch.id} className="border-b/40 hover:bg-secondary/20 cursor-pointer" onClick={() => setSelectedId(branch.id)}>
                    <td className="p-2">{branch.name}</td><td className="p-2">{branch.city}</td><td className="p-2">{branch.brand}</td><td className="p-2">{branch.contacts[0]?.value ?? "—"}</td><td className="p-2">{branch.services.breakfast}</td><td className="p-2">{branch.services.pool}</td><td className="p-2">{branch.verificationStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selected ? <div className="page-surface"><h3 className="text-lg font-semibold">تفاصيل {selected.name}</h3><div className="grid md:grid-cols-2 gap-2 text-sm">{Object.entries(selected.services).map(([key, value]) => <p key={key}><span className="text-muted-foreground">{key}:</span> {value}</p>)}</div></div> : null}
        </>
      ) : (
        <div className="page-surface text-sm text-muted-foreground">لا توجد نتائج حسب الفلاتر الحالية. جرّب إعادة ضبط البحث أو البراند أو الحالة.</div>
      )}
    </div>
  );
};

export default Branches;
