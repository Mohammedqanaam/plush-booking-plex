import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Building2, CheckCircle2, Crown, FileUp, LibraryBig, Layers3, PhoneCall, Sparkles, UsersRound, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { processBookings, summarizeBookings } from "@/lib/bookingProcessor";
import { normalizeEmployeeName, normalizeHiddenEmployees } from "@/lib/employeeVisibility";
import PageHeader from "@/components/PageHeader";
import { getAdminSession, hasPermission } from "@/lib/adminAuth";

type Shortcut = { to: string; label: string; icon: LucideIcon; description: string };

const baseShortcuts: Shortcut[] = [
  { to: "/knowledge-bank", label: "بنك المعلومات", icon: LibraryBig, description: "بحث سياسات وفروع" },
  { to: "/employees", label: "الموظفون", icon: UsersRound, description: "مؤشرات الأداء" },
  { to: "/contacts", label: "طلبات التواصل", icon: PhoneCall, description: "تسجيل طلبات الضيوف" },
  { to: "/branches", label: "الفروع", icon: Building2, description: "الخدمات والتواصل" },
];

const Dashboard = () => {
  const [bookings, setBookings] = useState<Record<string, string | number | undefined>[]>([]);
  const [hiddenEmployees, setHiddenEmployees] = useState<string[]>([]);
  const session = getAdminSession();
  const canUpload = session ? hasPermission(session.role, "upload") : false;

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

  const shortcuts = useMemo(() => (canUpload ? [...baseShortcuts, { to: "/upload-center", label: "مركز الرفع", icon: FileUp, description: "رفع ملفات التشغيل" }] : baseShortcuts), [canUpload]);

  const kpis = [
    {
      label: "إجمالي الحجوزات",
      value: summary.total,
      icon: Layers3,
      helper: "يشمل جميع الحجوزات المسجلة خلال الفترة المعروضة.",
    },
    {
      label: "الحجوزات المؤكدة",
      value: summary.confirmed,
      icon: CheckCircle2,
      helper: "يعرض الحجوزات المؤكدة فقط.",
    },
  ];

  return (
    <div className="space-y-6 md:space-y-7 pb-8">
      <PageHeader
        title="لوحة التشغيل اليومية"
        subtitle="لوحة تشغيل يومية واضحة لدعم فريق الحجوزات والمشرفين بمؤشرات دقيقة واختصارات فعّالة."
        showBack={false}
        icon={Sparkles}
      />

      <section className="grid md:grid-cols-2 gap-4">
        {kpis.map((kpi, index) => (
          <div key={kpi.label} className="page-surface card-hover min-h-[180px] flex flex-col justify-between">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
              <span className="icon-chip">
                <kpi.icon className="w-4 h-4" />
              </span>
            </div>
            <p className="kpi-value text-primary mt-4">{kpi.value}</p>
            <p className="text-xs text-muted-foreground leading-6 mt-2">{kpi.helper}</p>
            <div className="mt-4 h-1.5 rounded-full bg-secondary/80 overflow-hidden">
              <span className="block h-full gold-gradient" style={{ width: `${56 + index * 28}%` }} />
            </div>
          </div>
        ))}
      </section>

      <section className="page-surface space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="section-title">اختصارات سريعة</h3>
          <span className="text-xs text-muted-foreground">وصول أسرع للأقسام الأكثر استخدامًا</span>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {shortcuts.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-3xl border border-border/70 bg-secondary/25 p-5 card-hover text-right min-h-[168px] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="icon-chip">
                  <item.icon className="w-4 h-4" />
                </span>
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="mt-3 text-lg font-semibold">{item.label}</p>
                <p className="text-sm text-muted-foreground mt-1.5">{item.description}</p>
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
          <button type="button" className="text-xs text-primary hover:text-primary/80 interactive">
            عرض القائمة
          </button>
        </div>
        {topEmployees.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {topEmployees.map((employee, index) => (
              <div key={employee.agent} className="rounded-2xl border border-border/70 p-4 bg-secondary/25 min-h-[140px]">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-primary/40 bg-primary/10 px-2 text-xs font-semibold text-primary">
                    #{index + 1}
                  </span>
                  <p className="font-semibold text-base truncate">{employee.agent}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">مؤكد {employee.confirmed} · إجمالي {employee.total}</p>
                <p className="text-xs text-primary mt-2">مستوى أداء مستقر</p>
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
