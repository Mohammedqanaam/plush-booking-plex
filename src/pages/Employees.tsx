import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BadgeCheck, Search, ShieldCheck, TrendingUp, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { api, type PublicBookingReport } from "@/lib/api";

type SortKey = "confirmed" | "total" | "rate" | "name";

const Employees = () => {
  const [report, setReport] = useState<PublicBookingReport | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("confirmed");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getPublicBookingReport()
      .then((data) => {
        setReport(data);
        setError("");
      })
      .catch(() => setError("تعذر تحميل بيانات الموظفين حاليًا."))
      .finally(() => setLoading(false));
  }, []);

  const employees = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ar");
    const rows = (report?.employees || []).filter((employee) =>
      !query || employee.name.toLocaleLowerCase("ar").includes(query),
    );
    return [...rows].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name, "ar");
      if (sortBy === "total") return b.total - a.total || b.confirmed - a.confirmed;
      if (sortBy === "rate") return b.confirmationRate - a.confirmationRate || b.confirmed - a.confirmed;
      return b.confirmed - a.confirmed || b.total - a.total;
    });
  }, [report, search, sortBy]);

  const visibleConfirmed = useMemo(
    () => (report?.employees || []).reduce((total, employee) => total + employee.confirmed, 0),
    [report],
  );

  return (
    <div className="page-wrap">
      <PageHeader
        title="أداء الموظفين"
        subtitle="نتائج مجمعة للعرض فقط."
        icon={UsersRound}
        actions={
          <Link to="/booking-reports" className="hidden h-10 items-center gap-2 rounded-xl border border-primary/20 bg-secondary/40 px-3 text-xs font-bold sm:inline-flex">
            تقرير الحجوزات <ArrowLeft className="h-4 w-4" />
          </Link>
        }
      />

      <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 px-4 py-3 text-xs text-emerald-100">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-300" />
        <span>وضع مشاهدة للزوار؛ لا تظهر بيانات الضيوف ولا تتوفر أدوات تعديل.</span>
      </div>

      {loading ? <div className="page-surface text-sm text-muted-foreground">جاري تحميل التقرير…</div> : null}
      {error ? <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div> : null}

      {report ? (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <div className="compact-card">
              <p className="text-xs text-muted-foreground">الموظفون الظاهرون</p>
              <p className="mt-2 kpi-value text-primary">{report.summary.employeeCount.toLocaleString("ar-SA")}</p>
            </div>
            <div className="compact-card">
              <p className="text-xs text-muted-foreground">الحجوزات المؤكدة</p>
              <p className="mt-2 kpi-value text-emerald-300">{visibleConfirmed.toLocaleString("ar-SA")}</p>
            </div>
            <div className="compact-card">
              <p className="text-xs text-muted-foreground">فترة التقرير</p>
              <p className="mt-2 text-lg font-black">{report.period.label}</p>
            </div>
          </section>

          <section className="page-surface space-y-4">
            <div className="grid gap-2 md:grid-cols-[1fr_190px]">
              <label className="relative block">
                <span className="sr-only">بحث باسم الموظف</span>
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input className="h-11 w-full rounded-xl border bg-secondary/70 px-10" placeholder="بحث باسم الموظف" value={search} onChange={(event) => setSearch(event.target.value)} />
              </label>
              <label>
                <span className="sr-only">ترتيب النتائج</span>
                <select className="h-11 w-full rounded-xl border bg-secondary/70 px-3" value={sortBy} onChange={(event) => setSortBy(event.target.value as SortKey)}>
                  <option value="confirmed">الأعلى تأكيدًا</option>
                  <option value="total">الأعلى حجوزات</option>
                  <option value="rate">أفضل نسبة تأكيد</option>
                  <option value="name">الاسم</option>
                </select>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {employees.map((employee, index) => (
                <article key={employee.id} className="employee-public-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-primary/80">الترتيب {index + 1}</p>
                      <h2 className="mt-1 truncate text-lg font-black">{employee.name}</h2>
                    </div>
                    <span className="icon-chip h-10 w-10"><TrendingUp className="h-4 w-4" /></span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl border border-primary/12 bg-secondary/30 p-2.5">
                      <p className="text-[11px] text-muted-foreground">مؤكد</p>
                      <p className="mt-1 text-xl font-black text-emerald-300">{employee.confirmed}</p>
                    </div>
                    <div className="rounded-xl border border-primary/12 bg-secondary/30 p-2.5">
                      <p className="text-[11px] text-muted-foreground">ملغي</p>
                      <p className="mt-1 text-xl font-black text-amber-300">{employee.cancelled}</p>
                    </div>
                    <div className="rounded-xl border border-primary/12 bg-secondary/30 p-2.5">
                      <p className="text-[11px] text-muted-foreground">الإجمالي</p>
                      <p className="mt-1 text-xl font-black">{employee.total}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1 text-muted-foreground"><BadgeCheck className="h-3.5 w-3.5 text-primary" /> نسبة التأكيد</span>
                    <strong>{employee.confirmationRate.toLocaleString("ar-SA")}%</strong>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary/80">
                    <span className="block h-full rounded-full gold-gradient" style={{ width: `${employee.confirmationRate}%` }} />
                  </div>
                </article>
              ))}
            </div>

            {!employees.length ? <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">لا توجد نتائج مطابقة.</div> : null}
          </section>
        </>
      ) : null}
    </div>
  );
};

export default Employees;
