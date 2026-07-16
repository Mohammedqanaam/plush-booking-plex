import { useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
  FileSpreadsheet,
  Loader2,
  PhoneIncoming,
  PhoneMissed,
  RefreshCcw,
  Search,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { getAdminSession, hasPermission } from "@/lib/adminAuth";
import {
  analyzeAvayaFiles,
  employeeRiskLevel,
  exportAvayaReport,
  formatDuration,
  type AvayaFileKind,
  type AvayaReportResult,
} from "@/lib/avayaReportProcessor";

const FILE_SLOTS: Array<{ kind: AvayaFileKind; title: string; hint: string }> = [
  { kind: "inbound", title: "User Inbound Summary", hint: "المجاب، الفائت ومتوسط الرنين" },
  { kind: "dnd", title: "Feature Trace", hint: "فترات Do Not Disturb" },
  { kind: "timecard", title: "Agent Time Card", hint: "مدة تسجيل الدخول" },
];

const STATUS_LABELS = {
  high: { label: "أولوية مراجعة", className: "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300" },
  review: { label: "يحتاج متابعة", className: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  good: { label: "ضمن المؤشر", className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  incomplete: { label: "بيانات ناقصة", className: "border-slate-500/25 bg-slate-500/10 text-slate-600 dark:text-slate-300" },
} as const;

type Filter = "all" | keyof typeof STATUS_LABELS;

const AdminAvayaReports = () => {
  const session = getAdminSession();
  const navigate = useNavigate();
  const inputs = useRef<Partial<Record<AvayaFileKind, HTMLInputElement | null>>>({});
  const [files, setFiles] = useState<Partial<Record<AvayaFileKind, File>>>({});
  const [report, setReport] = useState<AvayaReportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

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
      risks: employees.filter((employee) => employeeRiskLevel(employee) === "high").length,
    };
  }, [report]);

  if (!session || !hasPermission(session.role, "upload")) return <Navigate to="/admin" replace />;

  const chooseFile = (kind: AvayaFileKind, file?: File) => {
    if (!file) return;
    if (!file.name.toLocaleLowerCase("en").endsWith(".xlsx")) {
      setError("يقبل مركز Avaya ملفات XLSX فقط.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("حجم الملف يتجاوز 15 ميجابايت.");
      return;
    }
    setFiles((current) => ({ ...current, [kind]: file }));
    setReport(null);
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
      <PageHeader title="تقارير Avaya" subtitle="ارفع التقارير الثلاثة لتحويلها إلى نتيجة موحدة قابلة للمراجعة والتصدير." icon={FileSpreadsheet} onBack={() => navigate("/admin")} />

      <section className="page-surface space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="section-title">ملفات التقرير اليومي</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">تتم المعالجة داخل جهازك ولا تُرفع ملفات الموظفين إلى الخادم. يجب أن تكون الملفات الثلاثة للفترة الزمنية نفسها.</p>
          </div>
          {Object.keys(files).length ? <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-border/50 px-3 text-xs font-bold" onClick={reset}><RefreshCcw className="h-4 w-4" /> مسح الملفات</button> : null}
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {FILE_SLOTS.map((slot, index) => {
            const file = files[slot.kind];
            return (
              <button key={slot.kind} type="button" className={`group min-h-36 rounded-2xl border p-4 text-right transition ${file ? "border-emerald-500/35 bg-emerald-500/5" : "border-dashed border-primary/25 bg-secondary/15 hover:border-primary/55 hover:bg-primary/5"}`} onClick={() => inputs.current[slot.kind]?.click()}>
                <input ref={(element) => { inputs.current[slot.kind] = element; }} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={(event) => chooseFile(slot.kind, event.target.files?.[0])} />
                <div className="flex items-start justify-between gap-3">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${file ? "bg-emerald-500/12 text-emerald-600" : "bg-primary/10 text-primary"}`}>{file ? <CheckCircle2 className="h-5 w-5" /> : <UploadCloud className="h-5 w-5" />}</span>
                  <span className="rounded-full bg-secondary/60 px-2 py-1 text-[10px] font-black text-muted-foreground">{index + 1}</span>
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

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[
              ["الموظفون", report.employees.length, FileSpreadsheet, ""],
              ["المكالمات المجابة", summary.answered, PhoneIncoming, ""],
              ["المكالمات الفائتة", summary.missed, PhoneMissed, ""],
              ["إجمالي DND", formatDuration(summary.dnd), Clock3, ""],
              ["أولوية مراجعة", summary.risks, AlertTriangle, "text-red-600 dark:text-red-300"],
            ].map(([label, value, Icon, valueClass]) => (
              <article key={String(label)} className="compact-card">
                <div className="flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground">{String(label)}</p><Icon className="h-4 w-4 text-primary" /></div>
                <p className={`mt-2 text-2xl font-black ${String(valueClass)}`}>{typeof value === "number" ? value.toLocaleString("ar-SA") : String(value)}</p>
              </article>
            ))}
          </section>

          <section className="page-surface space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="section-title">نتائج الموظفين</h2><p className="mt-1 text-xs text-muted-foreground" dir="ltr">{report.rangeStart} — {report.rangeEnd}</p></div>
              <button className="inline-flex h-11 items-center gap-2 rounded-xl gold-gradient px-4 text-sm font-black text-primary-foreground" onClick={() => void exportAvayaReport(report)}><Download className="h-4 w-4" /> تصدير Excel</button>
            </div>

            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
              <label className="relative block">
                <span className="sr-only">بحث بالاسم أو الرقم الوظيفي</span>
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input className="h-11 w-full rounded-xl border bg-secondary/40 px-10 text-sm" placeholder="بحث بالاسم أو الرقم الوظيفي" value={search} onChange={(event) => setSearch(event.target.value)} />
              </label>
              <div className="flex gap-1 overflow-x-auto rounded-xl border bg-secondary/20 p-1">
                {(["all", "high", "review", "good", "incomplete"] as Filter[]).map((value) => <button key={value} className={`h-9 whitespace-nowrap rounded-lg px-3 text-xs font-bold ${filter === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setFilter(value)}>{value === "all" ? "الكل" : STATUS_LABELS[value].label}</button>)}
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border/45 custom-scrollbar">
              <table className="w-full min-w-[920px] border-collapse text-sm">
                <thead className="bg-[#173e35] text-white">
                  <tr>{["الموظف", "متوسط الرنين", "المجاب", "الفائت", "إجمالي DND", "مدة الدخول", "الحالة"].map((header) => <th key={header} className="whitespace-nowrap px-4 py-3 text-right text-xs font-black">{header}</th>)}</tr>
                </thead>
                <tbody>
                  {visibleEmployees.map((employee) => {
                    const status = STATUS_LABELS[employeeRiskLevel(employee)];
                    return (
                      <tr key={employee.key} className="border-b border-border/30 last:border-0 hover:bg-secondary/20">
                        <td className="px-4 py-3"><strong className="block text-foreground">{employee.name.replace(/\(\d+\)\s*$/, "")}</strong><small className="text-muted-foreground">{employee.employeeId || "بدون رقم وظيفي"}</small></td>
                        <td className={`px-4 py-3 font-mono font-bold ${employee.avgRingingSeconds >= 10 ? "bg-yellow-300/70 text-yellow-950" : ""}`} dir="ltr">{formatDuration(employee.avgRingingSeconds)}</td>
                        <td className="px-4 py-3 font-black text-emerald-700 dark:text-emerald-300">{employee.answeredCalls.toLocaleString("ar-SA")}</td>
                        <td className={`px-4 py-3 font-black ${employee.missedCalls >= 20 ? "bg-red-500/10 text-red-700 dark:text-red-300" : employee.missedCalls >= 10 ? "text-amber-700 dark:text-amber-300" : ""}`}>{employee.missedCalls.toLocaleString("ar-SA")}</td>
                        <td className={`px-4 py-3 font-mono ${employee.dndDurationSeconds > 3600 ? "bg-amber-500/10 text-amber-800 dark:text-amber-300" : ""}`} dir="ltr"><strong>{formatDuration(employee.dndDurationSeconds)}</strong><small className="mr-2 text-[10px] opacity-65">{employee.dndEvents} مرات</small></td>
                        <td className={`px-4 py-3 font-mono ${employee.loggedInDurationSeconds < 7 * 3600 ? "bg-red-500/10 text-red-700 dark:text-red-300" : ""}`} dir="ltr"><strong>{formatDuration(employee.loggedInDurationSeconds)}</strong><small className="mr-2 text-[10px] opacity-65">{employee.loginSessions} جلسات</small></td>
                        <td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black ${status.className}`}>{status.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!visibleEmployees.length ? <div className="p-10 text-center text-sm text-muted-foreground">لا توجد نتائج مطابقة.</div> : null}
            </div>

            <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
              <p className="rounded-xl bg-secondary/25 p-3">متوسط الرنين يُنبّه باللون الأصفر من 10 ثوانٍ.</p>
              <p className="rounded-xl bg-secondary/25 p-3">أولوية المراجعة عند 20 مكالمة فائتة أو DND أكثر من ساعة.</p>
              <p className="rounded-xl bg-secondary/25 p-3">مدة الدخول الأقل من 7 ساعات تظهر كحالة مرتفعة للمراجعة.</p>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
};

export default AdminAvayaReports;
