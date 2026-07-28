import { useEffect, useState } from "react";
import { enterpriseApi } from "@/lib/enterpriseApi";
import { SlidersHorizontal } from "lucide-react";
import PageHeader from "@/components/PageHeader";

type EnterpriseConfig = {
  whatsappTemplate?: string;
  emailTemplate?: string;
  emailEnabled?: boolean;
  slaMinutes?: number;
  escalationThreshold?: number;
  theme?: {
    primary?: string;
    accent?: string;
    background?: string;
    radius?: string;
    font?: string;
  };
};

const AdminEnterpriseControl = () => {
  const [cfg, setCfg] = useState<EnterpriseConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    enterpriseApi.getEnterpriseConfig().then(setCfg).catch(() => setCfg(null));
  }, []);

  if (!cfg) return <div className="p-4">Loading...</div>;

  return (
    <div className="page-wrap-narrow">
      <PageHeader title="مركز التحكم المؤسسي" icon={SlidersHorizontal} />
      <div className="glass-card p-4 space-y-3">
        <textarea className="w-full rounded-lg bg-secondary border border-border p-3" rows={6} value={cfg.whatsappTemplate || ""} onChange={(e)=>setCfg({...cfg, whatsappTemplate:e.target.value})} />
        <textarea className="w-full rounded-lg bg-secondary border border-border p-3" rows={8} value={cfg.emailTemplate || ""} onChange={(e)=>setCfg({...cfg, emailTemplate:e.target.value})} />
        <div className="grid grid-cols-2 gap-2">
          <input className="h-10 px-3 rounded-lg bg-secondary border border-border" value={cfg.slaMinutes} onChange={(e)=>setCfg({...cfg, slaMinutes:Number(e.target.value)})} />
          <input className="h-10 px-3 rounded-lg bg-secondary border border-border" value={cfg.escalationThreshold} onChange={(e)=>setCfg({...cfg, escalationThreshold:Number(e.target.value)})} />
          <input className="h-10 px-3 rounded-lg bg-secondary border border-border" placeholder="primary" value={cfg.theme?.primary || ""} onChange={(e)=>setCfg({...cfg, theme:{...cfg.theme, primary:e.target.value}})} />
          <input className="h-10 px-3 rounded-lg bg-secondary border border-border" placeholder="accent" value={cfg.theme?.accent || ""} onChange={(e)=>setCfg({...cfg, theme:{...cfg.theme, accent:e.target.value}})} />
          <input className="h-10 px-3 rounded-lg bg-secondary border border-border" placeholder="background" value={cfg.theme?.background || ""} onChange={(e)=>setCfg({...cfg, theme:{...cfg.theme, background:e.target.value}})} />
          <input className="h-10 px-3 rounded-lg bg-secondary border border-border" placeholder="radius" value={cfg.theme?.radius || ""} onChange={(e)=>setCfg({...cfg, theme:{...cfg.theme, radius:e.target.value}})} />
          <input className="h-10 px-3 rounded-lg bg-secondary border border-border" placeholder="font" value={cfg.theme?.font || ""} onChange={(e)=>setCfg({...cfg, theme:{...cfg.theme, font:e.target.value}})} />
        </div>
        <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={cfg.emailEnabled} onChange={(e)=>setCfg({...cfg, emailEnabled:e.target.checked})} /> تفعيل الإيميل</label>
        <div className="flex gap-2">
          <button className="h-10 px-3 rounded-lg border border-border" disabled={saving} onClick={async()=>{setSaving(true);await enterpriseApi.updateEnterpriseConfig(cfg);setSaving(false);}}>حفظ</button>
          <button className="h-10 px-3 rounded-lg border border-border" onClick={()=>setCfg({...cfg, theme:{primary:"",accent:"",background:"",radius:"",font:""}})}>Reset Theme Defaults</button>
        </div>
      </div>
    </div>
  );
};

export default AdminEnterpriseControl;
