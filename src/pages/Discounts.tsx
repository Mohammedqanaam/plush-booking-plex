import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { enterpriseBrands, type BrandCode } from "@/data/enterprise";

type Discount = { id: string; brand: BrandCode; title: string; percent: number; code: string; active: boolean };

const Discounts = () => {
  const [activeBrand, setActiveBrand] = useState<BrandCode>("Boudl");
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [title, setTitle] = useState("");
  const [percent, setPercent] = useState(10);
  const [code, setCode] = useState("");

  const load = async () => {
    const data = await api.listDiscounts();
    setDiscounts(data.discounts || []);
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createDiscount({ brand: activeBrand, title, percent, code, active: true });
    setTitle(""); setCode("");
    await load();
  };

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold">Discounts Module</h2>
      <div className="flex gap-2 overflow-auto">{enterpriseBrands.map((brand) => <button key={brand} onClick={() => setActiveBrand(brand)} className={`px-3 py-2 rounded-lg ${activeBrand===brand?"gold-gradient text-primary-foreground":"glass-card"}`}>{brand}</button>)}</div>
      <form onSubmit={create} className="glass-card p-4 grid md:grid-cols-4 gap-2">
        <input className="bg-secondary rounded-lg p-2" placeholder="Title" value={title} onChange={(e)=>setTitle(e.target.value)} required />
        <input className="bg-secondary rounded-lg p-2" placeholder="Code" value={code} onChange={(e)=>setCode(e.target.value)} required />
        <input className="bg-secondary rounded-lg p-2" type="number" value={percent} onChange={(e)=>setPercent(Number(e.target.value))} required />
        <button className="gold-gradient rounded-lg text-primary-foreground">Add</button>
      </form>

      <div className="space-y-2">{discounts.filter((d)=>d.brand===activeBrand).map((d)=><div key={d.id} className="glass-card p-3 flex justify-between items-center"><span>{d.title} ({d.code}) - {d.percent}%</span><div className="flex gap-2"><button className="px-2 py-1 bg-secondary rounded" onClick={async ()=>{await api.updateDiscount({id:d.id,active:!d.active});load();}}>{d.active?"Deactivate":"Activate"}</button><button className="px-2 py-1 bg-secondary rounded" onClick={async ()=>{await api.deleteDiscount(d.id);load();}}>Delete</button></div></div>)}</div>
    </div>
  );
};

export default Discounts;
