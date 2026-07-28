import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  CloudDownload,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  PhoneIncoming,
  PhoneMissed,
  RefreshCcw,
  Search,
  ShieldCheck,
  Unplug,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { getAdminSession, hasPermission } from "@/lib/adminAuth";
import { api } from "@/lib/api";
import {
  analyzeAvayaFiles,
  approvedLoggedInDuration,
  employeeRiskLevel,
  exportAvayaReport,
  formatAvayaClock,
  formatDuration,
  shiftOverlapDuration,
  type AvayaFileKind,
  type AvayaReportResult,
} from "@/lib/avayaReportProcessor";

const FILE_SLOTS: Array<{ kind: AvayaFileKind; title: string; hint: string }> = [
  { kind: "inbound", title: "User Inbound Summary", hint: "المجاب، الفائت ومتوسط الرنين" },
  { kind: "dnd", title: "Feature Trace", hint: "فترات Do Not Disturb" },
  { kind: "timecard", title: "Agent Time Card", hint: "مدة تسجيل الدخول" },
];

const STATUS_LABELS = {
  overlap: { label: "تداخل شفت", className: "border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300" },
  high: { label: "أولوية مراجعة", className: "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300" },
  review: { label: "يحتاج متابعة", className: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  good: { label: "ضمن المؤشر", className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  incomplete: { label: "بيانات ناقصة", className: "border-slate-500/25 bg-slate-500/10 text-slate-600 dark:text-slate-300" },
} as const;

type Filter = "all" | keyof typeof STATUS_LABELS;
type ReportOrigin = "automatic" | "manual" | null;

const AdminAvayaReports = () => {
  const session = getAdminSession();
  const inputs = useRef<Partial<Record<AvayaFileKind, HTMLInputElement | null>>>({});
  const [files, setFiles] = useState<Partial<Record<AvayaFileKind, File>>>({});
  const [report, setReport] = useState<AvayaReportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [reportOrigin, setReportOrigin] = useState<ReportOrigin>(null);
  const [syncLoading, setSyncLoading] = useState(true);
  const [syncError, setSyncError] = useState("");
  const [syncConfigured, setSyncConfigured] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const loadLatest = useCallback(async (silent = false) => {
    if (!silent) setSyncLoading(true);
    if (!silent) setSyncError("");
    try {
      const data = await api.getLatestAvayaReport();
      setSyncConfigured(data.sync.configured);
      setLastSyncedAt(data.sync.updatedAt);
      if (data.report) {
        setReport(data.report);
        setReportOrigin("automatic");
      }
    } catch (cause) {
      if (!silent) setSyncError(cause instanceof Error ? cause.message : "تعذر تحميل آخر مزامنة من Avaya.");
    } finally {
      if (!silent) setSyncLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLatest();
    const refresh = () => {
      if (document.visibilityState === "visible") void loadLatest(true);
    };
    const interval = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadLatest]);

  const visibleEmployees = useMemo(() => {
    if (!report) return [];
    const query = search.trim().toLocaleLowerCase("ar");
    return report.employees.filter((employee) => {
      const matchesSearch = !query || employee.name.toLocaleLowerCase("ar").includes(query) || employee.employeeId.includes(query);
      return matchesSearch && (filter === "all" || employeeRiskLevel(employee) === filter);
    });
  }, [filter, report, search]);

  const summary = useMemo(() => {
    const employees = report?.employees || [];
    return {
      answered: employees.reduce((total, employee) => total + employee.answeredCalls, 0),
      missed: employees.reduce((total, employee) => total + employee.missedCalls, 0),
      dnd: employees.reduce((total, employee) => total + employee.dndDurationSeconds, 0),
      reconnections: employees.reduce((total, employee) => total + (employee.reconnectionCount ?? Math.max(0, (employee.loginSessions || 0) - 1)), 0),
      overlaps: employees.filter((employee) => shiftOverlapDuration(employee) > 0).length,
      risks: employees.filter((employee) => employeeRiskLevel(employee) === "high").length,
    };
  }, [report]);

  const metrics: Array<{ label: string; value: number | string; icon: LucideIcon; valueClass: string }> = [
    { label: "الموظفون", value: report?.employees.length || 0, icon: FileSpreadsheet, valueClass: "" },
    { label: "المكالمات المجابة", value: summary.answered, icon: PhoneIncoming, valueClass: "" },
    { label: "المكالمات الفائتة", value: summary.missed, icon: PhoneMissed, valueClass: "" },
    { label: "إجمالي DND", value: formatDuration(summary.dnd), icon: Clock3, valueClass: "" },
    { label: "إعادة الاتصال", value: summary.reconnections, icon: Unplug, valueClass: "" },
    { label: "تداخل شفت", value: summary.overlaps, icon: AlertTriangle, valueClass: "text-fuchsia-700 dark:text-fuchsia-300" },
    { label: "أولوية مراجعة", value: summary.risks, icon: AlertTriangle, valueClass: "text-red-600 dark:text-red-300" },
  ];

  if (!session || !hasPermission(session.role, "upload")) return <Navigate to="/admin" replace />;

  const chooseFile = (kind: AvayaFileKind, file?: File) => {
    if (!file) return;
    if (!/\.(?:pdf|xlsx)$/i.test(file.name)) {
      setError("يقبل مركز Avaya ملفات PDF أو XLSX فقط.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("حجم الملف يتجاوز 15 ميجابايت.");
      return;
    }
    setFiles((current) => ({ ...current, [kind]: file }));
    setReport(null);
    setReportOrigin(null);
    setError("");
  };

  const analyze = async () => {
    const selected = FILE_SLOTS.map((slot) => files[slot.kind]).filter((file): file is File => !!file);
    if (selected.length !== 3) {
      setError("اختر تقارير Avaya الثلاثة أولًا.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      setReport(await analyzeAvayaFiles(selected));
      setReportOrigin("manual");
    } catch (cause) {
      setReport(null);
      setError(cause instanceof Error ? cause.message : "تعذر تحليل الملفات.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setFiles({});
    setReport(null);
    setError("");
    setSearch("");
    setFilter("all");
    Object.values(inputs.current).forEach((input) => { if (input) input.value = ""; });
  };

  return (
    <div className="page-wrap">
      <PageHeader title="تقارير Avaya" icon={FileSpreadsheet} />

      <section className="page-surface mb-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${syncConfigured ? "bg-emerald-500/12 text-emerald-600" : "bg-amber-500/12 text-amber-700"}`}>
              <CloudDownload className="h-5 w-5" />
            </span>
            <div>
              <h2 className="section-title">المزامنة التلقائية</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {lastSyncedAt ? `آخر تحديث: ${new Date(lastSyncedAt).toLocaleString("ar-SA")}` : syncConfigured ? "بانتظار أول مجموعة تقارير مكتملة." : "مفتاح المزامنة غير مهيأ."}
              </p>
            </div>
          </div>
          <button type="button" disabled={syncLoading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border/50 px-3 text-xs font-bold disabled:opacity-50" onClick={() => void loadLatest()}>
            <RefreshCcw className={`h-4 w-4 ${syncLoading ? "animate-spin" : ""}`} /> تحديث
          </button>
        </div>
        {syncError ? <div role="alert" className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/8 p-3 text-sm text-amber-800 dark:text-amber-300"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {syncError}</div> : null}
      </section>

      <section className="page-surface space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="section-title">ملفات التقرير اليومي</h2>
          {Object.keys(files).length ? <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-border/50 px-3 text-xs font-bold" onClick={reset}><RefreshCcw className="h-4 w-4" /> مسح الملفات</button> : null}
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {FILE_SLOTS.map((slot, index) => {
            const file = files[slot.kind];
            const isPdf = file?.name.toLocaleLowerCase("en").endsWith(".pdf");
            return (
              <button key={slot.kind} type="button" className={`group min-h-36 rounded-2xl border p-4 text-right transition ${file ? "border-emerald-500/35 bg-emerald-500/5" : "border-dashed border-primary/25 bg-secondary/15 hover:border-primary/55 hover:bg-primary/5"}`} onClick={() => inputs.current[slot.kind]?.click()}>
                <input ref={(element) => { inputs.current[slot.kind] = element; }} type="file" accept=".pdf,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={(event) => chooseFile(slot.kind, event.target.files?.[0])} />
                <div className="flex items-start justify-between gap-3">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${file ? "bg-emerald-500/12 text-emerald-600" : "bg-primary/10 text-primary"}`}>{file ? (isPdf ? <FileText className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />) : <UploadCloud className="h-5 w-5" />}</span>
                  <span className="rounded-full bg-secondary/60 px-2 py-1 text-[10px] font-black text-muted-foreground">{file ? (isPdf ? "PDF" : "XLSX") : index + 1}</span>
                </div>
                <strong className="mt-3 block text-sm">{slot.title}</strong>
                <small className="mt-1 block text-xs text-muted-foreground">{file ? file.name : slot.hint}</small>
              </button>
            );
          })}
        </div>

        {error ? <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/8 p-3 text-sm text-red-700 dark:text-red-300"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}</div> : null}
        <button disabled={busy || Object.keys(files).length !== 3} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl gold-gradient px-5 font-black text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto" onClick={() => void analyze()}>{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />} {busy ? "جارٍ تحليل التقارير" : "إنشاء التقرير الموحد"}</button>
      </section>

      {report ? (
        <div className="space-y-4">
          {report.warnings.map((warning) => <div key={warning} className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/8 p-3 text-sm text-amber-800 dark:text-amber-300"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {warning}</div>)}

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-7">
            {metrics.map(({ label, value, icon: Icon, valueClass }) => (
              <article key={label} className="compact-card">
                <div className="flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground">{label}</p><Icon className="h-4 w-4 text-primary" /></div>
                <p className={`mt-2 text-2xl font-black ${valueClass}`}>{typeof value === "number" ? value.toLocaleString("ar-SA") : value}</p>
              </article>
            ))}
          </section>

          <section className="page-surface space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2"><h2 className="section-title">نتائج الموظفين</h2>{reportOrigin === "automatic" ? <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[10px] font-black text-emerald-700 dark:text-emerald-300"><CloudDownload className="h-3 w-3" /> مزامن تلقائياً</span> : null}</div>
                <p className="mt-1 text-xs text-muted-foreground" dir="ltr">{report.rangeStart} — {report.rangeEnd}</p>
              </div>
              <button className="inline-flex h-11 items-center gap-2 rounded-xl gold-gradient px-4 text-sm font-black text-primary-foreground" onClick={() => void exportAvayaReport(report)}><Download className="h-4 w-4" /> تنزيل Excel</button>
            </div>

            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
              <label className="relative block">
                <span className="sr-only">بحث بالاسم أو الرقم الوظيفي</span>
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input className="h-11 w-full rounded-xl border bg-secondary/40 px-10 text-sm" placeholder="بحث بالاسم أو الرقم الوظيفي" value={search} onChange={(event) => setSearch(event.target.value)} />
              </label>
              <div className="flex gap-1 overflow-x-auto rounded-xl border bg-secondary/20 p-1">
                {(["all", "overlap", "high", "review", "good", "incomplete"] as Filter[]).map((value) => <button key={value} className={`h-9 whitespace-nowrap rounded-lg px-3 text-xs font-bold ${filter === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setFilter(value)}>{value === "all" ? "الكل" : STATUS_LABELS[value].label}</button>)}
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border/45 custom-scrollbar">
              <table className="w-full min-w-[1680px] border-collapse text-sm">
                <thead className="bg-[#173e35] text-white">
                  <tr>{["الموظف", "أول دخول", "آخر خروج", "فترة الدوام", "مدة العمل المعتمدة", "تداخل الشفت", "فواصل الاتصال", "إعادة الاتصال", "متوسط الرنين", "المجاب", "الفائت", "إجمالي DND", "الحالة"].map((header) => <th key={header} className="whitespace-nowrap px-4 py-3 text-right text-xs font-black">{header}</th>)}</tr>
                </thead>
                <tbody>
                  {visibleEmployees.map((employee) => {
                    const status = STATUS_LABELS[employeeRiskLevel(employee)];
                    return (
                      <tr key={employee.key} className="border-b border-border/30 last:border-0 hover:bg-secondary/20">
                        <td className="px-4 py-3"><strong className="block text-foreground">{employee.name.replace(/\(\d+\)\s*$/, "")}</strong><small className="text-muted-foreground">{employee.employeeId || "بدون رقم وظيفي"}</small></td>
                        <td className="px-4 py-3 font-mono font-bold" dir="ltr">{formatAvayaClock(employee.shiftStartTimestamp)}</td>
                        <td className="px-4 py-3 font-mono font-bold" dir="ltr">{employee.hasOpenSession ? <span className="text-emerald-700 dark:text-emerald-300">متصل الآن</span> : formatAvayaClock(employee.shiftEndTimestamp)}</td>
                        <td className="px-4 py-3 font-mono" dir="ltr">{formatDuration(employee.shiftSpanSeconds || 0)}</td>
                        <td className={`px-4 py-3 font-mono ${approvedLoggedInDuration(employee) < 7 * 3600 ? "bg-red-500/10 text-red-700 dark:text-red-300" : ""}`} dir="ltr"><strong>{formatDuration(approvedLoggedInDuration(employee))}</strong><small className="mr-2 text-[10px] opacity-65">حد أقصى 9 ساعات</small></td>
                        <td className={`px-4 py-3 font-mono ${shiftOverlapDuration(employee) > 0 ? "bg-fuchsia-500/10 text-fuchsia-800 dark:text-fuchsia-300" : ""}`} dir="ltr"><strong>{formatDuration(shiftOverlapDuration(employee))}</strong></td>
                        <td className={`px-4 py-3 font-mono ${(employee.disconnectedDurationSeconds || 0) > 0 ? "bg-amber-500/10 text-amber-800 dark:text-amber-300" : ""}`} dir="ltr"><strong>{formatDuration(employee.disconnectedDurationSeconds || 0)}</strong></td>
                        <td className="px-4 py-3 font-black">{(employee.reconnectionCount ?? Math.max(0, (employee.loginSessions || 0) - 1)).toLocaleString("ar-SA")}</td>
                        <td className={`px-4 py-3 font-mono font-bold ${employee.avgRingingSeconds >= 10 ? "bg-yellow-300/70 text-yellow-950" : ""}`} dir="ltr">{formatDuration(employee.avgRingingSeconds)}</td>
                        <td className="px-4 py-3 font-black text-emerald-700 dark:text-emerald-300">{employee.answeredCalls.toLocaleString("ar-SA")}</td>
                        <td className={`px-4 py-3 font-black ${employee.missedCalls >= 20 ? "bg-red-500/10 text-red-700 dark:text-red-300" : employee.missedCalls >= 10 ? "text-amber-700 dark:text-amber-300" : ""}`}>{employee.missedCalls.toLocaleString("ar-SA")}</td>
                        <td className={`px-4 py-3 font-mono ${employee.dndDurationSeconds > 3600 ? "bg-amber-500/10 text-amber-800 dark:text-amber-300" : ""}`} dir="ltr"><strong>{formatDuration(employee.dndDurationSeconds)}</strong><small className="mr-2 text-[10px] opacity-65">{employee.dndEvents} مرات</small></td>
                        <td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black ${status.className}`}>{status.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!visibleEmployees.length ? <div className="p-10 text-center text-sm text-muted-foreground">لا توجد نتائج مطابقة.</div> : null}
            </div>

          </section>
        </div>
      ) : null}
    </div>
  );
};

export default AdminAvayaReports;
