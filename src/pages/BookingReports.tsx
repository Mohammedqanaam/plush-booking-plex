import { useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, BarChart3, CalendarDays, ShieldCheck, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { api, type PublicBookingReport } from "@/lib/api";

const formatDate = (value: string | null) => {
  if (!value) return "غير متاح";
  return new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
};

const BookingReports = () => {
  const [report, setReport] = useState<PublicBookingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getPublicBookingReport()
      .then((data) => {
        setReport(data);
        setError("");
      })
      .catch(() => setError("تعذر تحميل تقرير الحجوزات حاليًا."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-wrap">
      <PageHeader
        title="تقارير الحجوزات"
        subtitle="ملخص الحالات والأعداد دون بيانات الضيوف."
        icon={BarChart3}
        actions={
          <Link to="/employees" className="hidden h-10 items-center gap-2 rounded-xl border border-primary/20 bg-secondary/40 px-3 text-xs font-bold sm:inline-flex">
            أداء الموظفين <ArrowLeft className="h-4 w-4" />
          </Link>
        }
      />

      <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 px-4 py-3 text-xs text-emerald-100">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-300" />
        <span>تقرير عام للعرض فقط؛ السجلات التفصيلية وأدوات الرفع محمية داخل لوحة المشرف.</span>
      </div>

      {loading ? <div className="page-surface text-sm text-muted-foreground">جاري إعداد التقرير…</div> : null}
      {error ? <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div> : null}

      {report ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: "إجمالي الحجوزات", value: report.summary.classifiedTotal, tone: "text-primary" },
              { label: "المؤكدة", value: report.summary.confirmed, tone: "text-emerald-300" },
              { label: "الملغاة", value: report.summary.cancelled, tone: "text-amber-300" },
              { label: "نسبة التأكيد", value: `${report.summary.confirmationRate}%`, tone: "text-sky-300" },
              { label: "عدد الموظفين", value: report.summary.employeeCount, tone: "text-foreground" },
            ].map((item) => (
              <div key={item.label} className="compact-card">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`mt-2 kpi-value ${item.tone}`}>{typeof item.value === "number" ? item.value.toLocaleString("ar-SA") : item.value}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="page-surface space-y-5">
              <div>
                <h2 className="section-title">توزيع الحالات</h2>
                <p className="mt-1 text-xs text-muted-foreground">النسب محسوبة من الحجوزات المصنفة فقط.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm"><span>مؤكد</span><strong>{report.summary.confirmationRate}%</strong></div>
                  <div className="h-3 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${report.summary.confirmationRate}%` }} /></div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm"><span>ملغي</span><strong>{report.summary.cancelRate}%</strong></div>
                  <div className="h-3 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-amber-400" style={{ width: `${report.summary.cancelRate}%` }} /></div>
                </div>
              </div>
              <Link to="/employees" className="inline-flex h-11 items-center gap-2 rounded-xl border border-primary/20 bg-primary/8 px-4 text-sm font-bold text-primary">
                <UsersRound className="h-4 w-4" /> عرض أداء الموظفين <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>

            <div className="page-surface space-y-4">
              <h2 className="section-title">معلومات التقرير</h2>
              <div className="compact-card flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-primary" />
                <div><p className="text-xs text-muted-foreground">الفترة</p><p className="font-bold">{report.period.label}</p></div>
              </div>
              <div className="compact-card flex items-center gap-3">
                <BadgeCheck className="h-5 w-5 text-primary" />
                <div><p className="text-xs text-muted-foreground">آخر تحديث للبيانات</p><p className="font-bold">{formatDate(report.updatedAt)}</p></div>
              </div>
              <div className="rounded-xl border border-border/20 bg-secondary/20 p-3 text-xs leading-6 text-muted-foreground">
                رُفع {report.summary.uploadedRecords.toLocaleString("ar-SA")} سجل، وصُنّف {report.summary.classifiedTotal.toLocaleString("ar-SA")} منها. السجلات غير المعروفة: {report.summary.ignored.toLocaleString("ar-SA")}.
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
};

export default BookingReports;
