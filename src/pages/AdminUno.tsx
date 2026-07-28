import { useEffect, useState } from "react";
import { Cable, ExternalLink, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { api, type UnoConnectionStatus } from "@/lib/api";

const authLabels: Record<UnoConnectionStatus["authMode"], string> = {
  none: "غير مهيأ",
  bearer: "رمز وصول",
  "api-key": "API Key",
  "oauth-client": "OAuth",
};

const AdminUno = () => {
  const [status, setStatus] = useState<UnoConnectionStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.getUnoConnection()
      .then(setStatus)
      .catch(() => {
        setFailed(true);
        setMessage("تعذر تحميل حالة UNO.");
      });
  }, []);

  const probe = async () => {
    setChecking(true);
    setFailed(false);
    setMessage("");
    try {
      const next = await api.probeUnoConnection();
      setStatus(next);
      setFailed(!next.reachable);
      setMessage(next.connected
        ? "تم الاتصال بواجهة UNO."
        : next.reachable
          ? "بوابة UNO متاحة."
          : "تعذر الوصول إلى UNO.");
    } catch {
      setFailed(true);
      setMessage("تعذر الوصول إلى UNO.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="page-wrap-narrow">
      <PageHeader title="ربط UNO" icon={Cable} />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="compact-card">
          <span className="text-xs text-muted-foreground">واجهة API</span>
          <strong className={`mt-1 block ${status?.apiConfigured ? "text-emerald-700" : "text-amber-700"}`}>
            {status?.apiConfigured ? "مهيأة" : "بانتظار الربط"}
          </strong>
        </div>
        <div className="compact-card">
          <span className="text-xs text-muted-foreground">المصادقة</span>
          <strong className="mt-1 block">{status ? authLabels[status.authMode] : "—"}</strong>
        </div>
        <div className="compact-card col-span-2 sm:col-span-1">
          <span className="text-xs text-muted-foreground">الحماية</span>
          <strong className="mt-1 flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> خادمية</strong>
        </div>
      </section>

      <section className="page-surface flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex h-11 items-center gap-2 rounded-xl gold-gradient px-4 text-sm font-bold text-primary-foreground disabled:opacity-50"
          onClick={() => void probe()}
          disabled={checking}
        >
          {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          فحص الاتصال
        </button>
        <a
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-primary/25 px-4 text-sm font-bold"
          href={status?.loginUrl || "https://unolive.rategain.com/"}
          target="_blank"
          rel="noreferrer noopener"
        >
          فتح UNO <ExternalLink className="h-4 w-4" />
        </a>
        {message ? <span role="status" className={`w-full text-xs font-bold ${failed ? "text-destructive" : "text-emerald-700"}`}>{message}</span> : null}
      </section>
    </div>
  );
};

export default AdminUno;
