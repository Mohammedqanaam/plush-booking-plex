import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  DatabaseZap,
  Download,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Wifi,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";

type CroExportStatus = {
  loginUrl: string;
  dashboardUrl?: string;
  configured: boolean;
  exportConfigured: boolean;
  requiredEnv: string[];
};

type CroSyncStatus = {
  state: "idle" | "queued" | "running" | "success" | "error";
  source?: "manual" | "automatic";
  from?: string;
  to?: string;
  queuedAt?: string;
  startedAt?: string;
  finishedAt?: string;
  message?: string;
  stats?: {
    total: number;
    confirmed: number;
    cancelled: number;
    cancelRate: number;
    updatedAt: string;
  };
};

type CroSyncResponse = {
  status: CroSyncStatus;
  automation: {
    configured: boolean;
    from: string;
    to: string;
    schedule: string;
  };
};

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const now = new Date();
const defaultFrom = isoDate(new Date(now.getFullYear(), now.getMonth(), 1));
const defaultTo = isoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
const API_BASE = "/.netlify/functions";
const authHeaders = (): Record<string, string> => {
  const token = typeof window === "undefined" ? null : sessionStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const readError = async (response: Response, fallback: string) => {
  const data = await response.json().catch(() => ({}));
  return data.error || fallback;
};

const syncStateLabel: Record<CroSyncStatus["state"], string> = {
  idle: "لم يبدأ",
  queued: "بانتظار التنفيذ",
  running: "جاري التحديث",
  success: "محدّث",
  error: "تعذر التحديث",
};

const formatTimestamp = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Riyadh",
  }).format(date);
};

const AdminCroExport = () => {
  const [status, setStatus] = useState<CroExportStatus | null>(null);
  const [sync, setSync] = useState<CroSyncResponse | null>(null);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState<"status" | "test" | "export" | "sync" | "">("status");

  const credentialsReady = Boolean(status?.configured || (username.trim() && password));
  const syncIsActive = sync?.status.state === "queued" || sync?.status.state === "running";
  const busy = Boolean(loading) || syncIsActive;
  const syncTone = useMemo(() => {
    if (sync?.status.state === "success") return "text-emerald-700";
    if (sync?.status.state === "error") return "text-red-700";
    if (syncIsActive) return "text-amber-700";
    return "text-muted-foreground";
  }, [sync?.status.state, syncIsActive]);

  const loadSyncStatus = useCallback(async () => {
    const response = await fetch(`${API_BASE}/cro-sync`, { headers: authHeaders() });
    if (!response.ok) throw new Error(await readError(response, "تعذر تحميل حالة المزامنة"));
    const result = await response.json() as CroSyncResponse;
    setSync(result);
    return result;
  }, []);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/cro-export`, { headers: authHeaders() }).then(async (response) => {
        if (!response.ok) throw new Error(await readError(response, "تعذر تحميل حالة CRO"));
        setStatus(await response.json() as CroExportStatus);
      }),
      loadSyncStatus(),
    ])
      .catch((error) => setMessage(error instanceof Error ? error.message : "تعذر تحميل حالة CRO"))
      .finally(() => setLoading(""));
  }, [loadSyncStatus]);

  useEffect(() => {
    if (!syncIsActive) return undefined;
    const timer = window.setInterval(() => {
      void loadSyncStatus()
        .then((result) => {
          if (result.status.state === "success") {
            setLoading("");
            setPassword("");
            setMessage(result.status.message || "تم تحديث تقارير الحجوزات من CRO.");
          } else if (result.status.state === "error") {
            setLoading("");
            setMessage(result.status.message || "تعذر تحديث التقارير من CRO.");
          }
        })
        .catch((error) => {
          setLoading("");
          setMessage(error instanceof Error ? error.message : "تعذر متابعة حالة التحديث.");
        });
    }, 4_000);
    return () => window.clearInterval(timer);
  }, [loadSyncStatus, syncIsActive]);

  const testLogin = async () => {
    setLoading("test");
    setMessage("");
    try {
      const response = await fetch(`${API_BASE}/cro-export`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ dryRun: true, username, password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "تعذر اختبار تسجيل الدخول في CRO");
      setMessage(result.message || "تم اختبار الاتصال.");
      setStatus((current) => current ? { ...current, exportConfigured: Boolean(result.exportReady) } : current);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر اختبار الاتصال.");
    } finally {
      setLoading("");
    }
  };

  const syncBookings = async () => {
    setLoading("sync");
    setMessage("");
    try {
      const response = await fetch(`${API_BASE}/cro-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ from, to, username, password }),
      });
      const result = await response.json().catch(() => ({})) as CroSyncResponse & { error?: string };
      if (!response.ok) throw new Error(result.error || "تعذر بدء تحديث تقارير الحجوزات");
      setSync(result);
      setMessage(result.status.message || "بدأ تحديث التقارير في الخلفية.");
    } catch (error) {
      setLoading("");
      setMessage(error instanceof Error ? error.message : "تعذر بدء تحديث التقارير.");
    }
  };

  const exportBookings = async () => {
    setLoading("export");
    setMessage("");
    try {
      const response = await fetch(`${API_BASE}/cro-export`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ from, to, username, password }),
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
      <PageHeader title="تحديث حجوزات CRO" subtitle="تحديث فوري وآلي لتقارير الحجز المركزي." icon={ShieldCheck} />

      {message ? <div className="rounded-xl border border-primary/20 bg-primary/8 p-3 text-sm">{message}</div> : null}

      <section className="page-surface space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="compact-card"><p className="text-xs text-muted-foreground">بيانات الدخول</p><strong className={status?.configured ? "text-emerald-600" : "text-amber-700"}>{status?.configured ? "مضبوطة" : "إدخال مؤقت"}</strong></div>
          <div className="compact-card"><p className="text-xs text-muted-foreground">تصدير CRO</p><strong className={status?.exportConfigured ? "text-emerald-600" : "text-amber-700"}>{status?.exportConfigured ? "جاهز" : "ينقصه ضبط"}</strong></div>
          <div className="compact-card"><p className="text-xs text-muted-foreground">التحديث الآلي</p><strong className={sync?.automation.configured ? "text-emerald-600" : "text-amber-700"}>{sync?.automation.configured ? "كل ساعة" : "غير مفعّل"}</strong></div>
          <div className="compact-card"><p className="text-xs text-muted-foreground">الحماية</p><strong>سيرفر فقط</strong></div>
        </div>

        <div className="rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs leading-6 text-muted-foreground">
          زر التحديث يجلب تقرير <span dir="ltr" className="font-semibold">Check-Out</span> من CRO ثم يحدّث تقارير الحجوزات داخل الموقع تلقائيًا. لا يُستبدل التقرير الحالي إذا فشل CRO أو أعاد ملفًا فارغًا، ولا تُحفظ بيانات الدخول المكتوبة هنا.
        </div>

        <div className="rounded-xl border border-border/45 bg-secondary/25 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {syncIsActive ? <Loader2 className="h-4 w-4 animate-spin text-amber-700" /> : <DatabaseZap className="h-4 w-4 text-primary" />}
              <strong className={syncTone}>{syncStateLabel[sync?.status.state || "idle"]}</strong>
            </div>
            <span className="text-xs text-muted-foreground">
              آخر تحديث: {formatTimestamp(sync?.status.stats?.updatedAt || sync?.status.finishedAt)}
            </span>
          </div>
          {sync?.status.message ? <p className="mt-2 text-xs leading-6 text-muted-foreground">{sync.status.message}</p> : null}
          {sync?.status.stats ? (
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-background/80 p-2"><span className="block text-muted-foreground">الإجمالي</span><strong>{sync.status.stats.total.toLocaleString("ar-SA")}</strong></div>
              <div className="rounded-lg bg-background/80 p-2"><span className="block text-muted-foreground">المؤكدة</span><strong className="text-emerald-700">{sync.status.stats.confirmed.toLocaleString("ar-SA")}</strong></div>
              <div className="rounded-lg bg-background/80 p-2"><span className="block text-muted-foreground">الملغاة/عدم الحضور</span><strong className="text-red-700">{sync.status.stats.cancelled.toLocaleString("ar-SA")}</strong></div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs">
            <span className="mb-1 block text-muted-foreground">يوزر CRO — يُستخدم لهذه العملية فقط</span>
            <input
              dir="ltr"
              className="h-11 w-full rounded-xl border bg-secondary/65 px-3"
              placeholder="اسم المستخدم"
              value={username}
              autoComplete="username"
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-muted-foreground">كلمة مرور CRO — تُستخدم لهذه العملية فقط</span>
            <input
              dir="ltr"
              type="password"
              className="h-11 w-full rounded-xl border bg-secondary/65 px-3"
              placeholder="••••••••"
              value={password}
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs">
            <span className="mb-1 flex items-center gap-1 text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" /> من تاريخ Check-Out</span>
            <input type="date" className="h-11 w-full rounded-xl border bg-secondary/65 px-3" value={from} onChange={(event) => setFrom(event.target.value)} />
          </label>
          <label className="text-xs">
            <span className="mb-1 flex items-center gap-1 text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" /> إلى تاريخ Check-Out</span>
            <input type="date" className="h-11 w-full rounded-xl border bg-secondary/65 px-3" value={to} onChange={(event) => setTo(event.target.value)} />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="inline-flex h-11 items-center gap-2 rounded-xl gold-gradient px-4 text-sm font-bold text-primary-foreground" onClick={() => void syncBookings()} disabled={busy || !credentialsReady || !status?.exportConfigured}>
            {loading === "sync" || syncIsActive ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} تحديث التقارير الآن
          </button>
          <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-primary/25 px-4 text-sm font-bold" onClick={() => void testLogin()} disabled={busy || !credentialsReady}>
            {loading === "test" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />} اختبار الدخول
          </button>
          <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-border/50 px-4 text-sm font-bold" onClick={() => void exportBookings()} disabled={busy || !credentialsReady || !status?.exportConfigured}>
            {loading === "export" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} تنزيل CSV فقط
          </button>
          {status?.dashboardUrl ? (
            <a className="inline-flex h-11 items-center gap-2 rounded-xl border border-border/35 px-4 text-sm font-bold" href={status.dashboardUrl} target="_blank" rel="noreferrer">
              فتح CRO <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </section>
    </div>
  );
};

export default AdminCroExport;
