import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Crown, Layers3, PhoneCall, Sparkles, UsersRound, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { processBookings, summarizeBookings } from "@/lib/bookingProcessor";
import { normalizeEmployeeName, normalizeHiddenEmployees } from "@/lib/employeeVisibility";
import PageHeader from "@/components/PageHeader";

type Shortcut = { to: string; label: string; icon: LucideIcon; description: string };

const baseShortcuts: Shortcut[] = [
  { to: "/employees", label: "تقارير الموظفين", icon: UsersRound, description: "عرض مؤشرات الأداء والتقارير" },
  { to: "/contacts", label: "رفع طلبات التواصل", icon: PhoneCall, description: "تسجيل ومتابعة طلبات الضيوف" },
];

const Dashboard = () => {
  const [bookings, setBookings] = useState<Record<string, string | number | undefined>[]>([]);
  const [hiddenEmployees, setHiddenEmployees] = useState<string[]>([]);

  useEffect(() => {
    api.getBookings().then((d) => setBookings(d.bookings || [])).catch(() => setBookings([]));
    api.getSettings().then((s) => setHiddenEmployees(normalizeHiddenEmployees(s.hiddenEmployees || []))).catch(() => setHiddenEmployees([]));
  }, []);

  const hiddenSet = useMemo(() => new Set(hiddenEmployees.map((name) => normalizeEmployeeName(name)).filter(Boolean)), [hiddenEmployees]);

  const visibleBookings = useMemo(
    () =>
      bookings.filter((row) => {
        const agent = normalizeEmployeeName(
          String(row["Agent name"] || row["Agent Name"] || row["agent name"] || row["Employee"] || row["اسم الموظف"] || ""),
        );
        return !hiddenSet.has(agent);
      }),
    [bookings, hiddenSet],
  );

  const summary = useMemo(() => summarizeBookings(bookings), [bookings]);
  const topEmployees = useMemo(() => processBookings(visibleBookings).slice(0, 4), [visibleBookings]);

  const shortcuts = baseShortcuts;

  const kpis = [
    {
      label: "إجمالي الحجوزات",
      value: summary.total,
      icon: Layers3,
      helper: "كل الحجوزات المسجلة.",
    },
    {
      label: "الحجوزات المؤكدة",
      value: summary.confirmed,
      icon: CheckCircle2,
      helper: "الحجوزات المؤكدة فقط.",
    },
  ];

  return (
    <div className="space-y-3 md:space-y-4 pb-6">
      <PageHeader
        title="لوحة التشغيل اليومية"
        subtitle="مؤشرات تشغيل مختصرة واختصارات للفريق."
        showBack={false}
        icon={Sparkles}
      />

      <section className="grid md:grid-cols-2 gap-4">
        {kpis.map((kpi, index) => (
          <div key={kpi.label} className="page-surface card-hover min-h-[138px] flex flex-col justify-between">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
              <span className="icon-chip">
                <kpi.icon className="w-4 h-4" />
              </span>
            </div>
            <p className="kpi-value text-primary mt-4">{kpi.value}</p>
            <p className="text-xs text-muted-foreground leading-5 mt-1.5">{kpi.helper}</p>
            <div className="mt-3 h-1 rounded-full bg-secondary/80 overflow-hidden">
              <span className="block h-full gold-gradient" style={{ width: `${56 + index * 28}%` }} />
            </div>
          </div>
        ))}
      </section>

      <section className="page-surface space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="section-title">اختصارات سريعة</h3>
          <span className="text-xs text-muted-foreground">وصول سريع</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {shortcuts.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-3xl border border-primary/18 bg-secondary/24 p-4 card-hover text-right min-h-[126px] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="icon-chip">
                  <item.icon className="w-4 h-4" />
                </span>
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="mt-2 text-base font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="page-surface">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="icon-chip">
              <Crown className="w-4 h-4" />
            </span>
            <h3 className="section-title">أفضل الموظفين</h3>
          </div>
          <Link to="/employees" className="text-xs font-semibold text-primary hover:text-primary/80 interactive">
            عرض القائمة
          </Link>
        </div>
        {topEmployees.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {topEmployees.map((employee, index) => (
              <div key={employee.agent} className="rounded-2xl border border-primary/18 p-4 bg-secondary/24 min-h-[112px]">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-primary/40 bg-primary/10 px-2 text-xs font-semibold text-primary">
                    #{index + 1}
                  </span>
                  <p className="font-semibold text-base truncate">{employee.agent}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">مؤكد {employee.confirmed} · إجمالي {employee.total}</p>
                <p className="text-xs text-primary mt-2">أداء مستقر</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            لا توجد بيانات كافية لعرض أفضل الموظفين حالياً.
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
