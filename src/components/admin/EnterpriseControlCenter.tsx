import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const defaults = {
  whatsappTemplate: "",
  emailTemplate: "",
  emailEnabled: true,
  slaHours: 2,
  escalationThreshold: 3,
  theme: {
    primary: "42 90% 55%",
    accent: "42 80% 48%",
    background: "270 60% 5%",
    borderRadius: "0.75rem",
    fontStyle: "IBM Plex Sans Arabic",
  },
};

const EnterpriseControlCenter = () => {
  const [enterprise, setEnterprise] = useState<any>(defaults);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.getSettings().then((s) => setEnterprise({ ...defaults, ...(s.enterprise || {}) }));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary", enterprise.theme.primary);
    root.style.setProperty("--accent", enterprise.theme.accent);
    root.style.setProperty("--background", enterprise.theme.background);
    root.style.setProperty("--radius", enterprise.theme.borderRadius);
    root.style.setProperty("--font-enterprise", enterprise.theme.fontStyle);
  }, [enterprise.theme]);

  const save = async () => {
    await api.updateSettings({ enterprise });
    setMessage("Enterprise settings saved");
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
        {Object.keys(enterprise.theme).map((k)=><input key={k} className="bg-secondary rounded-lg p-2" value={enterprise.theme[k]} onChange={(e)=>setEnterprise({...enterprise,theme:{...enterprise.theme,[k]:e.target.value}})} placeholder={k} />)}
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
