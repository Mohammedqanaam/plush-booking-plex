import { useEffect, useMemo, useState } from "react";
import { api, type DiscountItem } from "@/lib/api";

const brands = ["Boudl", "Braira", "Narcissus", "Aber"] as const;

const AdminDiscounts = () => {
  const [activeBrand, setActiveBrand] = useState<(typeof brands)[number]>("Boudl");
  const [items, setItems] = useState<DiscountItem[]>([]);
  const [title, setTitle] = useState("");
  const [percentage, setPercentage] = useState("10");

  const load = () => api.listDiscounts().then((d) => setItems(d.discounts || [])).catch(() => setItems([]));
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => items.filter((i) => i.brand === activeBrand), [items, activeBrand]);

  return <div className="p-4 max-w-4xl mx-auto space-y-4">
    <h2 className="text-2xl font-bold">إدارة الخصومات</h2>
    <div className="flex gap-2 overflow-x-auto">{brands.map((b) => <button key={b} className={`px-3 h-10 rounded-lg ${activeBrand === b ? "gold-gradient text-primary-foreground" : "glass-card"}`} onClick={() => setActiveBrand(b)}>{b}</button>)}</div>
    <div className="glass-card p-4 flex gap-2">
      <input className="h-10 px-3 rounded-lg bg-secondary border flex-1" placeholder="عنوان الخصم" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input className="h-10 px-3 rounded-lg bg-secondary border w-24" dir="ltr" value={percentage} onChange={(e) => setPercentage(e.target.value)} />
      <button className="h-10 px-3 rounded-lg border" onClick={async () => { await api.createDiscount({ brand: activeBrand, title, percentage: Number(percentage), active: true }); setTitle(""); load(); }}>إضافة</button>
    </div>
    <div className="space-y-2">{filtered.map((d) => <div key={d.id} className="glass-card p-3 text-sm flex justify-between items-center"><span>{d.title} - {d.percentage}%</span><div className="flex gap-2"><button className="text-xs px-2 py-1 rounded border" onClick={async () => { await api.updateDiscount({ id: d.id, active: !d.active }); load(); }}>{d.active ? "إخفاء" : "إظهار"}</button><button className="text-xs px-2 py-1 rounded border border-destructive/30" onClick={async () => { await api.deleteDiscount(d.id); load(); }}>حذف</button></div></div>)}</div>
  </div>;
};

export default AdminDiscounts;
