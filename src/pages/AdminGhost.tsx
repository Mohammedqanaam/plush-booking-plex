import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Clock3,
  Cpu,
  Download,
  Fingerprint,
  Ghost,
  Globe2,
  MapPin,
  MemoryStick,
  MonitorSmartphone,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  Wifi,
  X,
} from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { api, type GhostAnalyticsSummary, type GhostVisitor } from "@/lib/api";
import { getAdminSession } from "@/lib/adminAuth";

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ar-SA", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
};

const pageLabel = (path: string) => ({
  "/": "الرئيسية",
  "/operations": "البحث",
  "/branches": "الفروع",
  "/booking-reports": "تقارير الحجوزات",
  "/contact-requests": "طلبات التواصل",
  "/admin/login": "دخول الإدارة",
}[path] || path);

const csvCell = (value: unknown) => {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

const AdminGhost = () => {
  const session = getAdminSession();
  const navigate = useNavigate();
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [data, setData] = useState<GhostAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<GhostVisitor | null>(null);

  const load = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      setData(await api.getGhostAnalytics(days));
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل بيانات الزوار.");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load(true);
    const timer = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const visitors = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ar");
    if (!query) return data?.recentVisitors || [];
    return (data?.recentVisitors || []).filter((visitor) => [
      visitor.visitorId,
      visitor.ipMasked,
      visitor.country,
      visitor.city,
      visitor.region,
      visitor.device,
      visitor.browser,
      visitor.os,
      visitor.referrer,
      ...Object.keys(visitor.pages || {}),
    ].join(" ").toLocaleLowerCase("ar").includes(query));
  }, [data, search]);

  const exportCsv = () => {
    if (!visitors.length) return;
    const rows = [
      ["معرف الزائر", "IP محمي", "الدولة", "المدينة", "المنطقة", "الجهاز", "المتصفح", "النظام", "اللغة", "الشاشة", "المنطقة الزمنية", "الاتصال", "الزيارات", "الجلسات", "أول ظهور", "آخر ظهور", "المصدر", "الصفحات"],
      ...visitors.map((visitor) => [
        visitor.visitorId,
        visitor.ipMasked,
        visitor.country,
        visitor.city,
        visitor.region,
        visitor.device,
        `${visitor.browser} ${visitor.browserVersion || ""}`.trim(),
        `${visitor.os} ${visitor.osVersion || ""}`.trim(),
        visitor.language || "",
        visitor.screen || "",
        visitor.timezone || visitor.geoTimezone || "",
        visitor.connection || "",
        visitor.views,
        visitor.sessionCount,
        visitor.firstSeen,
        visitor.lastSeen,
        visitor.referrer,
        Object.keys(visitor.pages || {}).join(" | "),
      ]),
    ];
    const csv = `\ufeff${rows.map((row) => row.map(csvCell).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ghost-visitors-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!session || !["superadmin", "admin"].includes(session.role)) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="page-wrap ghost-console">
      <PageHeader
        title="Ghost"
        subtitle="مراقبة الزيارات والطوارئ · وصول إداري محمي"
        icon={Ghost}
        onBack={() => navigate("/admin")}
        actions={<span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-3 py-2 text-[11px] font-bold text-emerald-700"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> مباشر</span>}
      />

      <section className="rounded-2xl border border-slate-900/10 bg-slate-950 p-4 text-white shadow-xl shadow-slate-950/10 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300"><Fingerprint className="h-5 w-5" /></span><div><h2 className="font-bold">معرّف الزيارة الأمني</h2><p className="mt-1 text-xs text-slate-400">معرّف عشوائي ثابت للمتصفح، دون بصمة أجهزة متطفلة أو موقع دقيق.</p></div></div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] text-slate-300">المسار محمي وغير ظاهر للزوار</span>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="relative min-w-[220px] flex-1 sm:max-w-md"><span className="sr-only">بحث في الزوار</span><Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input className="h-11 w-full rounded-xl border px-10" placeholder="بحث بالمعرّف أو IP أو المدينة أو الجهاز…" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <div className="flex items-center gap-2">
          <select className="h-11 rounded-xl border px-3 text-sm" value={days} onChange={(event) => setDays(Number(event.target.value) as 7 | 30 | 90)}><option value={7}>7 أيام</option><option value={30}>30 يومًا</option><option value={90}>90 يومًا</option></select>
          <button className="grid h-11 w-11 place-items-center rounded-xl border" onClick={() => void load(true)} aria-label="تحديث"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
          <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-primary/25 bg-primary/8 px-3 text-xs font-bold text-primary" onClick={exportCsv}><Download className="h-4 w-4" /> <span className="hidden sm:inline">CSV</span></button>
        </div>
      </div>

      {error ? <div className="rounded-xl border border-destructive/25 bg-destructive/8 p-3 text-sm text-destructive">{error}</div> : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["متصل الآن", data?.onlineCount || 0, Radio, "text-emerald-600"],
          ["زوار اليوم", data?.todayVisitors || 0, Activity, "text-blue-600"],
          ["زوار فريدون", data?.uniqueVisitors || 0, Fingerprint, "text-violet-600"],
          ["إجمالي الزيارات", data?.totalViews || 0, Globe2, "text-amber-600"],
        ].map(([label, value, Icon, color]) => <article className="metric-card" key={label as string}><div className="flex items-center justify-between"><p>{label as string}</p><Icon className={`h-4 w-4 ${color}`} /></div><strong>{Number(value).toLocaleString("ar-SA")}</strong></article>)}
      </section>

      <section className="page-surface space-y-3">
        <div className="flex items-center justify-between gap-2"><div><h2 className="section-title">المتصلون الآن</h2><p className="mt-1 text-xs text-muted-foreground">نشاط خلال آخر دقيقتين · تحديث كل 30 ثانية</p></div><span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700">{data?.onlineCount || 0}</span></div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {(data?.online || []).map((visitor) => <article className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.035] p-3" key={visitor.visitorId}><div className="flex items-center justify-between gap-2"><strong className="font-mono text-xs" dir="ltr">G-{visitor.visitorId.slice(-8)}</strong><span className="h-2 w-2 rounded-full bg-emerald-500" /></div><p className="mt-2 text-xs text-muted-foreground">{visitor.device} · {visitor.browser} {visitor.browserVersion || ""} · {visitor.os}</p><p className="mt-1 text-xs text-muted-foreground"><span dir="ltr">{visitor.ipMasked || "IP محمي"}</span> · {visitor.city}، {visitor.country}</p><p className="mt-2 truncate text-xs font-medium" dir="ltr">{pageLabel(visitor.path)}</p></article>)}
          {!data?.online.length ? <p className="text-xs text-muted-foreground">لا يوجد زائر نشط حاليًا.</p> : null}
        </div>
      </section>

      <section className="page-surface space-y-3">
        <div className="flex items-center justify-between gap-2"><div><h2 className="section-title">سجل الزوار</h2><p className="mt-1 text-xs text-muted-foreground">اضغط على السجل لعرض جميع المعلومات المتاحة.</p></div><span className="report-count">{visitors.length.toLocaleString("ar-SA")} سجل</span></div>
        <div className="overflow-x-auto rounded-2xl border border-border/20 custom-scrollbar">
          <table className="min-w-[860px] w-full text-xs">
            <thead><tr><th className="p-3 text-right">الزائر</th><th className="p-3 text-right">IP المحمي</th><th className="p-3 text-right">الموقع التقريبي</th><th className="p-3 text-right">الجهاز</th><th className="p-3 text-center">الزيارات</th><th className="p-3 text-right">آخر ظهور</th></tr></thead>
            <tbody>{visitors.map((visitor) => <tr key={visitor.visitorId} className="cursor-pointer border-t border-border/15" onClick={() => setSelected(visitor)}><td className="p-3 font-mono font-bold" dir="ltr">G-{visitor.visitorId.slice(-10)}</td><td className="p-3 font-mono" dir="ltr">{visitor.ipMasked || "غير متاح"}</td><td className="p-3">{visitor.city}، {visitor.country}</td><td className="p-3"><strong className="block">{visitor.device}</strong><span className="text-muted-foreground">{visitor.browser} · {visitor.os}</span></td><td className="p-3 text-center font-bold">{visitor.views.toLocaleString("ar-SA")}</td><td className="p-3">{formatDateTime(visitor.lastSeen)}</td></tr>)}</tbody>
          </table>
        </div>
        {!visitors.length && !loading ? <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">لا توجد سجلات مطابقة.</div> : null}
      </section>

      <p className="px-1 text-[11px] leading-5 text-muted-foreground"><ShieldCheck className="ml-1 inline h-3.5 w-3.5" />يُعرض IP بصورة مقنّعة، ولا يتم جمع GPS أو الاسم أو الجوال أو Canvas/WebGL. الموقع الجغرافي تقريبي وقد لا يطابق موقع الزائر الفعلي.</p>

      {selected ? <VisitorDetails visitor={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
};

const VisitorDetails = ({ visitor, onClose }: { visitor: GhostVisitor; onClose: () => void }) => {
  const details = [
    [MapPin, "الموقع التقريبي", [visitor.city, visitor.region, visitor.country].filter(Boolean).join("، ")],
    [Globe2, "IP المحمي", visitor.ipMasked || "غير متاح"],
    [MonitorSmartphone, "الجهاز", `${visitor.device} · ${visitor.platform || "منصة غير محددة"}`],
    [Activity, "المتصفح", `${visitor.browser} ${visitor.browserVersion || ""}`.trim()],
    [Cpu, "نظام التشغيل", `${visitor.os} ${visitor.osVersion || ""}`.trim()],
    [MonitorSmartphone, "الشاشة", `${visitor.screen || "غير متاح"} · نافذة ${visitor.viewport || "غير متاحة"}`],
    [Wifi, "الاتصال", `${visitor.connection || "غير محدد"}${visitor.downlink ? ` · ${visitor.downlink} Mbps` : ""}${visitor.saveData ? " · توفير البيانات" : ""}`],
    [MemoryStick, "العتاد المعلن", `${visitor.memory ? `${visitor.memory} GB` : "ذاكرة غير معلنة"} · ${visitor.cpuCores || "—"} نواة`],
    [Clock3, "المنطقة الزمنية", visitor.timezone || visitor.geoTimezone || "غير محددة"],
    [Globe2, "اللغة", [visitor.language, ...(visitor.languages || [])].filter(Boolean).filter((item, index, all) => all.indexOf(item) === index).join("، ") || "غير محددة"],
  ] as const;

  return <div className="fixed inset-0 z-[80] bg-slate-950/45 p-3 backdrop-blur-sm md:p-6" onClick={onClose}><aside className="mr-auto h-full w-full max-w-xl overflow-y-auto rounded-3xl bg-background p-4 shadow-2xl custom-scrollbar md:p-6" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-3"><div><span className="text-xs text-muted-foreground">معرّف الزائر</span><h2 className="mt-1 font-mono text-lg font-black" dir="ltr">G-{visitor.visitorId.slice(-12)}</h2><p className="mt-1 text-xs text-muted-foreground">{visitor.views} زيارة · {visitor.sessionCount} جلسة</p></div><button className="grid h-10 w-10 place-items-center rounded-full bg-secondary" onClick={onClose} aria-label="إغلاق"><X className="h-4 w-4" /></button></div><div className="mt-5 grid gap-2 sm:grid-cols-2">{details.map(([Icon, label, value]) => <div className="compact-card" key={label}><Icon className="h-4 w-4 text-primary" /><p className="mt-2 text-[10px] text-muted-foreground">{label}</p><p className="mt-1 break-words text-xs font-bold">{value}</p></div>)}</div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="compact-card"><p className="text-[10px] text-muted-foreground">أول ظهور</p><p className="mt-1 text-xs font-bold">{formatDateTime(visitor.firstSeen)}</p></div><div className="compact-card"><p className="text-[10px] text-muted-foreground">آخر ظهور</p><p className="mt-1 text-xs font-bold">{formatDateTime(visitor.lastSeen)}</p></div></div><section className="mt-4 page-surface"><h3 className="text-sm font-bold">الصفحات التي تمت زيارتها</h3><div className="mt-3 space-y-2">{Object.entries(visitor.pages || {}).sort((a, b) => b[1] - a[1]).map(([path, count]) => <div className="flex items-center justify-between gap-3 text-xs" key={path}><span className="truncate" dir="ltr">{pageLabel(path)}</span><strong>{count.toLocaleString("ar-SA")}</strong></div>)}</div></section><section className="mt-3 compact-card"><p className="text-[10px] text-muted-foreground">مصدر الزيارة</p><p className="mt-1 break-all text-xs font-bold" dir="ltr">{visitor.referrer || "مباشر"}</p></section></aside></div>;
};

export default AdminGhost;
