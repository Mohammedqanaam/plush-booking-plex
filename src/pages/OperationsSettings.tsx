import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { themePresets } from "@/data/operations";

const OperationsSettings = () => {
  const [siteTitle, setSiteTitle] = useState("Worm-AI / Res Dashboard");
  const [themePreset, setThemePreset] = useState(themePresets[3].id);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.getSettings().then((s) => {
      if (s.siteTitle) setSiteTitle(s.siteTitle);
      if ((s as Record<string, string>).themePreset) setThemePreset((s as Record<string, string>).themePreset);
    });
  }, []);

  return <div className="p-4 max-w-4xl mx-auto">
    <div className="glass-card p-4 space-y-3">
      <h2 className="text-2xl font-bold">الإعدادات والتحكم العميق</h2>
      <input className="w-full h-10 rounded-lg bg-secondary border px-3" value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} placeholder="اسم المنصة" />
      <select className="w-full h-10 rounded-lg bg-secondary border px-3" value={themePreset} onChange={(e) => setThemePreset(e.target.value)}>
        {themePresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name} — {preset.description}</option>)}
      </select>
      <button className="h-10 px-4 rounded-lg gold-gradient text-primary-foreground" onClick={async () => {
        await api.updateSettings({ siteTitle, themePreset });
        setMsg("تم حفظ الإعدادات والثيم");
      }}>حفظ</button>
      {msg && <p className="text-sm">{msg}</p>}
    </div>
  </div>;
};

export default OperationsSettings;
