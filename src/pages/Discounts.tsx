import { useEffect, useMemo, useState } from "react";
import { BadgePercent } from "lucide-react";
import { api } from "@/lib/api";
import { enterpriseBrands, type BrandCode } from "@/data/enterprise";
import PageHeader from "@/components/PageHeader";

type Discount = {
  id: string;
  brand: BrandCode;
  title: string;
  percent: number;
  code: string;
  active: boolean;
  assignedEmployee?: string;
  notes?: string;
};

type Employee = { id: string; name: string; active: boolean };

const emptyDraft = {
  title: "",
  percent: 10,
  code: "",
  assignedEmployee: "",
  notes: "",
};

const Discounts = () => {
  const [activeBrand, setActiveBrand] = useState<BrandCode>("Boudl");
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    const discountsData = await api.listDiscounts();
    setDiscounts(discountsData.discounts || []);
    setEmployees([]);
  };

  useEffect(() => {
    load();
  }, []);

  const employeeNames = useMemo(
    () => employees.filter((e) => e.active).map((e) => e.name),
    [employees]
  );

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createDiscount({
      brand: activeBrand,
      title: draft.title,
      percent: draft.percent,
      code: draft.code,
      active: true,
      assignedEmployee: draft.assignedEmployee,
      notes: draft.notes,
    });
    setDraft(emptyDraft);
    await load();
  };

  const update = async (payload: Partial<Discount> & { id: string }) => {
    await api.updateDiscount(payload);
    await load();
  };

  const current = discounts.filter((d) => d.brand === activeBrand);

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <PageHeader title="قسم الخصومات" subtitle="إدارة عروض الخصم حسب البراند." icon={BadgePercent} />

      <div className="page-surface">
        <h3 className="text-sm font-semibold mb-2">الموظفون المرتبطون بالخصومات</h3>
        <div className="flex flex-wrap gap-2">
          {employeeNames.length ? employeeNames.map((name) => (
            <span key={name} className="px-3 py-1 rounded-full bg-secondary text-xs">{name}</span>
          )) : <span className="text-xs text-muted-foreground">لا يوجد موظفون مفعّلون مرتبطون حاليًا.</span>}
        </div>
      </div>

      <div className="flex gap-2 overflow-auto">
        {enterpriseBrands.map((brand) => (
          <button
            key={brand}
            onClick={() => setActiveBrand(brand)}
            className={`px-3 py-2 rounded-lg ${activeBrand === brand ? "gold-gradient text-primary-foreground" : "glass-card"}`}
          >
            {brand}
          </button>
        ))}
      </div>

      <form onSubmit={create} className="page-surface grid md:grid-cols-3 gap-2">
        <input className="bg-secondary rounded-lg p-2" placeholder="اسم الخصم" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required />
        <input className="bg-secondary rounded-lg p-2" placeholder="كود الخصم" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} required />
        <input className="bg-secondary rounded-lg p-2" type="number" min={1} max={100} value={draft.percent} onChange={(e) => setDraft({ ...draft, percent: Number(e.target.value) })} required />
        <select className="bg-secondary rounded-lg p-2" value={draft.assignedEmployee} onChange={(e) => setDraft({ ...draft, assignedEmployee: e.target.value })}>
          <option value="">بدون تعيين</option>
          {employeeNames.map((name) => <option key={name}>{name}</option>)}
        </select>
        <input className="bg-secondary rounded-lg p-2 md:col-span-2" placeholder="ملاحظات" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
        <button className="gold-gradient rounded-lg text-primary-foreground py-2 md:col-span-3">إضافة خصم</button>
      </form>

      <div className="space-y-2">
        {current.map((d) => {
          const editing = editingId === d.id;
          return (
            <div key={d.id} className="page-surface">
              {editing ? (
                <div className="grid md:grid-cols-3 gap-2">
                  <input className="bg-secondary rounded-lg p-2" value={d.title} onChange={(e) => setDiscounts((prev) => prev.map((item) => item.id === d.id ? { ...item, title: e.target.value } : item))} />
                  <input className="bg-secondary rounded-lg p-2" value={d.code} onChange={(e) => setDiscounts((prev) => prev.map((item) => item.id === d.id ? { ...item, code: e.target.value } : item))} />
                  <input className="bg-secondary rounded-lg p-2" type="number" value={d.percent} onChange={(e) => setDiscounts((prev) => prev.map((item) => item.id === d.id ? { ...item, percent: Number(e.target.value) } : item))} />
                  <select className="bg-secondary rounded-lg p-2" value={d.assignedEmployee || ""} onChange={(e) => setDiscounts((prev) => prev.map((item) => item.id === d.id ? { ...item, assignedEmployee: e.target.value } : item))}>
                    <option value="">بدون تعيين</option>
                    {employeeNames.map((name) => <option key={name}>{name}</option>)}
                  </select>
                  <input className="bg-secondary rounded-lg p-2 md:col-span-2" value={d.notes || ""} onChange={(e) => setDiscounts((prev) => prev.map((item) => item.id === d.id ? { ...item, notes: e.target.value } : item))} />
                </div>
              ) : (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <p className="font-semibold">{d.title} ({d.code}) - {d.percent}%</p>
                    <p className="text-xs text-muted-foreground">الموظف: {d.assignedEmployee || "غير محدد"} {d.notes ? `• ${d.notes}` : ""}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {editing ? (
                  <button className="px-2 py-1 bg-secondary rounded" onClick={async () => { await update(d); setEditingId(null); }}>حفظ التعديلات</button>
                ) : (
                  <button className="px-2 py-1 bg-secondary rounded" onClick={() => setEditingId(d.id)}>تعديل</button>
                )}
                <button className="px-2 py-1 bg-secondary rounded" onClick={async () => update({ id: d.id, active: !d.active })}>{d.active ? "تعطيل" : "تفعيل"}</button>
                <button className="px-2 py-1 bg-secondary rounded" onClick={async () => { await api.deleteDiscount(d.id); await load(); }}>حذف</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Discounts;
