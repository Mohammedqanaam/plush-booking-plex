import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type EnterpriseTheme = {
  primary: string;
  accent: string;
  background: string;
  card: string;
  border: string;
  borderRadius: string;
  fontStyle: string;
};

type EnterpriseEmployee = {
  id: string;
  name: string;
  department: string;
  phone: string;
  active: boolean;
};

type EnterpriseSettings = {
  whatsappTemplate: string;
  emailTemplate: string;
  emailEnabled: boolean;
  slaHours: number;
  escalationThreshold: number;
  employees: EnterpriseEmployee[];
  theme: EnterpriseTheme;
};

const defaults: EnterpriseSettings = {
  whatsappTemplate: "",
  emailTemplate: "",
  emailEnabled: true,
  slaHours: 2,
  escalationThreshold: 3,
  employees: [],
  theme: {
    primary: "268 86% 62%",
    accent: "286 75% 60%",
    background: "258 44% 9%",
    card: "258 35% 14%",
    border: "263 28% 24%",
    borderRadius: "0.85rem",
    fontStyle: "IBM Plex Sans Arabic",
  },
};

const EnterpriseControlCenter = () => {
  const [enterprise, setEnterprise] = useState<EnterpriseSettings>(defaults);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.getSettings().then((s) => {
      setEnterprise({ ...defaults, ...(s.enterprise || {}) });
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary", enterprise.theme.primary);
    root.style.setProperty("--accent", enterprise.theme.accent);
    root.style.setProperty("--background", enterprise.theme.background);
    root.style.setProperty("--card", enterprise.theme.card);
    root.style.setProperty("--border", enterprise.theme.border);
    root.style.setProperty("--radius", enterprise.theme.borderRadius);
    root.style.setProperty("--font-enterprise", enterprise.theme.fontStyle);
  }, [enterprise.theme]);

  const save = async () => {
    await api.updateSettings({ enterprise });
    setMessage("تم حفظ إعدادات المركز المؤسسي");
  };

  return (
    <div className="glass-card p-4 space-y-3">
      <h4 className="font-semibold">Enterprise Control Center</h4>
      <textarea className="w-full bg-secondary rounded-lg p-2" rows={4} placeholder="WhatsApp template" value={enterprise.whatsappTemplate} onChange={(e)=>setEnterprise({...enterprise,whatsappTemplate:e.target.value})} />
      <textarea className="w-full bg-secondary rounded-lg p-2" rows={4} placeholder="Email template" value={enterprise.emailTemplate} onChange={(e)=>setEnterprise({...enterprise,emailTemplate:e.target.value})} />
      <label className="flex gap-2 items-center"><input type="checkbox" checked={enterprise.emailEnabled} onChange={(e)=>setEnterprise({...enterprise,emailEnabled:e.target.checked})}/> Enable email sending</label>
      <div className="grid md:grid-cols-2 gap-2">
        <input type="number" className="bg-secondary rounded-lg p-2" value={enterprise.slaHours} onChange={(e)=>setEnterprise({...enterprise,slaHours:Number(e.target.value)})} placeholder="SLA hours" />
        <input type="number" className="bg-secondary rounded-lg p-2" value={enterprise.escalationThreshold} onChange={(e)=>setEnterprise({...enterprise,escalationThreshold:Number(e.target.value)})} placeholder="Escalation threshold" />
        {(Object.keys(enterprise.theme) as Array<keyof EnterpriseTheme>).map((k)=><input key={k} className="bg-secondary rounded-lg p-2" value={enterprise.theme[k]} onChange={(e)=>setEnterprise({...enterprise,theme:{...enterprise.theme,[k]:e.target.value}})} placeholder={k} />)}
      </div>
      <div className="flex gap-2">
        <button className="px-3 py-2 rounded-lg bg-secondary" onClick={()=>setEnterprise(defaults)}>Reset to default</button>
        <button className="px-3 py-2 rounded-lg gold-gradient text-primary-foreground" onClick={save}>Save</button>
      </div>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
};

export default EnterpriseControlCenter;
