import { useEffect, useMemo, useState } from "react";
import { enterpriseApi } from "@/lib/enterpriseApi";

const brands = ["Boudl", "Braira", "Narcissus", "Aber"] as const;

const AdminDiscounts = () => {
  const [activeBrand, setActiveBrand] = useState<(typeof brands)[number]>("Boudl");
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [percentage, setPercentage] = useState("0");

  const load = () => enterpriseApi.getDiscounts().then((d) => setItems(d.discounts || [])).catch(() => setItems([]));
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => items.filter((i) => i.brand === activeBrand), [items, activeBrand]);

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold">Module الخصومات</h2>
      <div className="flex gap-2 overflow-x-auto">{brands.map((b) => <button key={b} className={`px-3 h-10 rounded-lg ${activeBrand===b?'gold-gradient text-primary-foreground':'glass-card'}`} onClick={()=>setActiveBrand(b)}>{b}</button>)}</div>
      <div className="glass-card p-4 flex gap-2">
        <input className="h-10 px-3 rounded-lg bg-secondary border border-border flex-1" placeholder="عنوان الخصم" value={title} onChange={(e)=>setTitle(e.target.value)} />
        <input className="h-10 px-3 rounded-lg bg-secondary border border-border w-28" value={percentage} onChange={(e)=>setPercentage(e.target.value)} />
        <button className="h-10 px-3 rounded-lg border border-border" onClick={async()=>{await enterpriseApi.createDiscount({brand:activeBrand,title,percentage:Number(percentage),active:true});setTitle("");setPercentage("0");load();}}>إضافة</button>
      </div>
      <div className="space-y-2">{filtered.map((d)=><div key={d.id} className="glass-card p-3 text-sm">{d.title} - {d.percentage}%</div>)}</div>
    </div>
  );
};

export default AdminDiscounts;
