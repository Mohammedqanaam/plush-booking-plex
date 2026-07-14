import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AlertCircle, CheckCheck, Palette, Type } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { themePresets } from "@/data/operations";

const OperationsSettings = () => {
  const [siteTitle, setSiteTitle] = useState("RES Dashboard");
  const [themePreset, setThemePreset] = useState("hospitality-premium-gold");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.getSettings().then((s) => {
      if (s.siteTitle) setSiteTitle(s.siteTitle);
      if (s.themePreset) setThemePreset(s.themePreset);
    }).catch(() => {});
  }, []);

  return <div className="page-wrap-narrow">
    <PageHeader title="الإعدادات والتحكم" subtitle="تخصيص اسم المنصة والثيم بطريقة عملية ومتناسقة مع الهوية البصرية." icon={Palette} />
    <div className="page-surface space-y-4">
      <div className="space-y-1">
        <label className="text-sm inline-flex items-center gap-1"><Type className="w-4 h-4 text-primary" /> اسم المنصة</label>
        <input className="w-full h-11 rounded-xl bg-secondary/70 border px-3" value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} placeholder="اسم المنصة" />
      </div>

      <div className="space-y-1">
        <label className="text-sm inline-flex items-center gap-1"><Palette className="w-4 h-4 text-primary" /> الثيم</label>
        <select className="w-full h-11 rounded-xl bg-secondary/70 border px-3" value={themePreset} onChange={(e) => setThemePreset(e.target.value)}>
          {themePresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name} — {preset.description}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button className="h-11 px-4 rounded-xl gold-gradient text-primary-foreground" onClick={async () => {
          setMsg("");
          setError("");
          try {
            await api.updateSettings({ siteTitle, themePreset });
            setMsg("تم حفظ الإعدادات والثيم بنجاح");
          } catch {
            setError("تعذر حفظ الإعدادات. يرجى المحاولة مجدداً.");
          }
        }}>حفظ الإعدادات</button>
      </div>
      {msg && <p className="text-xs rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-200 p-3 inline-flex items-center gap-1"><CheckCheck className="w-4 h-4" /> {msg}</p>}
      {error && <p className="text-xs rounded-xl border border-rose-400/30 bg-rose-400/10 text-rose-300 p-3 inline-flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {error}</p>}
    </div>
  </div>;
};

export default OperationsSettings;
