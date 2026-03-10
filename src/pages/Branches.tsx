import { useMemo, useState } from "react";

const data = {
  Braira: [{ name: "قريش", city: "جدة", reception: "9200", manager: "أحمد", managerPhone: "05000001", breakfast: "6:30-10:30", pool: "متاح", parking: "متاح" }],
  Boudl: [{ name: "العليا", city: "الرياض", reception: "9201", manager: "سعود", managerPhone: "05000002", breakfast: "7:00-10:00", pool: "غير متاح", parking: "متاح" }],
};

const Branches = () => {
  const [brand, setBrand] = useState<keyof typeof data>("Braira");
  const [branch, setBranch] = useState(data.Braira[0].name);

  const selected = useMemo(() => data[brand].find((b) => b.name === branch) || data[brand][0], [brand, branch]);

  return <div className="p-4 max-w-5xl mx-auto space-y-4">
    <div className="glass-card p-4 space-y-3">
      <h2 className="text-2xl font-bold">الفروع والبراندات</h2>
      <div className="grid sm:grid-cols-2 gap-2">
        <select className="h-10 rounded-lg bg-secondary border px-2" value={brand} onChange={(e) => { const next = e.target.value as keyof typeof data; setBrand(next); setBranch(data[next][0].name); }}>
          {Object.keys(data).map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className="h-10 rounded-lg bg-secondary border px-2" value={branch} onChange={(e) => setBranch(e.target.value)}>
          {data[brand].map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
        </select>
      </div>
    </div>
    <div className="glass-card p-4 grid sm:grid-cols-2 gap-2 text-sm">
      <p>الفرع: {selected.name}</p><p>المدينة: {selected.city}</p><p>الاستقبال: {selected.reception}</p><p>المدير: {selected.manager} ({selected.managerPhone})</p><p>الفطور: {selected.breakfast}</p><p>المسبح: {selected.pool}</p><p>المواقف: {selected.parking}</p><p>سياسة الإلغاء: موحدة قبل 24 ساعة</p>
    </div>
  </div>;
};

export default Branches;
