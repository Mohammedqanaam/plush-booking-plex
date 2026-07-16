import { useEffect, useState } from "react";
import { CalendarDays, Download, ExternalLink, Loader2, ShieldCheck, Wifi } from "lucide-react";
import PageHeader from "@/components/PageHeader";

type CroExportStatus = {
  loginUrl: string;
  configured: boolean;
  exportConfigured: boolean;
  requiredEnv: string[];
};

const API_BASE = "/.netlify/functions";
const today = new Date().toISOString().slice(0, 10);
const authHeaders = (): Record<string, string> => {
  const token = typeof window === "undefined" ? null : sessionStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const readError = async (response: Response, fallback: string) => {
  const data = await response.json().catch(() => ({}));
  return data.error || fallback;
};

const AdminCroExport = () => {
  const [status, setStatus] = useState<CroExportStatus | null>(null);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState<"status" | "test" | "export" | "">("status");

  useEffect(() => {
    fetch(`${API_BASE}/cro-export`, { headers: authHeaders() })
      .then(async (response) => {
        if (!response.ok) throw new Error(await readError(response, "تعذر تحميل حالة CRO"));
        return response.json() as Promise<CroExportStatus>;
      })
      .then(setStatus)
      .catch((error) => setMessage(error instanceof Error ? error.message : "تعذر تحميل حالة CRO"))
      .finally(() => setLoading(""));
  }, []);

  const testLogin = async () => {
    setLoading("test");
    setMessage("");
    try {
      const response = await fetch(`${API_BASE}/cro-export`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ dryRun: true }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "تعذر اختبار تسجيل الدخول في CRO");
      setMessage(data.message || "تم اختبار الاتصال.");
      setStatus((current) => current ? { ...current, exportConfigured: Boolean(data.exportReady) } : current);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر اختبار الاتصال.");
    } finally {
      setLoading("");
    }
  };

  const exportBookings = async () => {
    setLoading("export");
    setMessage("");
    try {
      const response = await fetch(`${API_BASE}/cro-export`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ from, to }),
      });
      if (!response.ok) throw new Error(await readError(response, "تعذر تصدير الحجوزات من CRO"));
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cro-bookings-${from}-to-${to}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("تم تنزيل ملف حجوزات CRO.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر تصدير الحجوزات.");
    } finally {
      setLoading("");
    }
  };

  return (
    <div className="page-wrap-narrow">
      <PageHeader title="ربط CRO" subtitle="تسجيل دخول سيرفري وتصدير حجوزات من نظام CRO." icon={ShieldCheck} />

      {message ? <div className="rounded-xl border border-primary/20 bg-primary/8 p-3 text-sm">{message}</div> : null}

      <section className="page-surface space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="compact-card"><p className="text-xs text-muted-foreground">بيانات الدخول</p><strong className={status?.configured ? "text-emerald-600" : "text-amber-700"}>{status?.configured ? "مضبوطة" : "غير مضبوطة"}</strong></div>
          <div className="compact-card"><p className="text-xs text-muted-foreground">رابط التصدير</p><strong className={status?.exportConfigured ? "text-emerald-600" : "text-amber-700"}>{status?.exportConfigured ? "جاهز" : "ينقصه ضبط"}</strong></div>
          <div className="compact-card"><p className="text-xs text-muted-foreground">الحماية</p><strong>سيرفر فقط</strong></div>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 p-3 text-xs leading-6 text-muted-foreground">
          لا يتم حفظ اسم المستخدم أو كلمة المرور داخل الكود أو المتصفح. اضبطها في Netlify كمتغيرات سرية:
          <span dir="ltr" className="mx-1 font-mono">CRO_USERNAME</span>
          و
          <span dir="ltr" className="mx-1 font-mono">CRO_PASSWORD</span>
          ثم اضبط
          <span dir="ltr" className="mx-1 font-mono">CRO_EXPORT_URL</span>
          بعد معرفة رابط تقرير الحجوزات الداخلي من CRO.
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs">
            <span className="mb-1 flex items-center gap-1 text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" /> من تاريخ</span>
            <input type="date" className="h-11 w-full rounded-xl border bg-secondary/65 px-3" value={from} onChange={(event) => setFrom(event.target.value)} />
          </label>
          <label className="text-xs">
            <span className="mb-1 flex items-center gap-1 text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" /> إلى تاريخ</span>
            <input type="date" className="h-11 w-full rounded-xl border bg-secondary/65 px-3" value={to} onChange={(event) => setTo(event.target.value)} />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-primary/25 px-4 text-sm font-bold" onClick={() => void testLogin()} disabled={Boolean(loading)}>
            {loading === "test" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />} اختبار الدخول
          </button>
          <button className="inline-flex h-11 items-center gap-2 rounded-xl gold-gradient px-4 text-sm font-bold text-primary-foreground" onClick={() => void exportBookings()} disabled={Boolean(loading) || !status?.exportConfigured}>
            {loading === "export" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} تصدير الحجوزات
          </button>
          {status?.loginUrl ? (
            <a className="inline-flex h-11 items-center gap-2 rounded-xl border border-border/35 px-4 text-sm font-bold" href={status.loginUrl} target="_blank" rel="noreferrer">
              فتح CRO <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </section>
    </div>
  );
};

export default AdminCroExport;
