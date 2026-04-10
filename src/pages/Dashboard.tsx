import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Crown,
  EyeOff,
  FileUp,
  LibraryBig,
  Sparkles,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { processBookings, summarizeBookings } from "@/lib/bookingProcessor";
import { normalizeHiddenEmployees } from "@/lib/employeeVisibility";
import { getAdminSession, hasPermission } from "@/lib/adminAuth";
import { buildEmployeeRows } from "@/lib/employeePerformance";
import PageHeader from "@/components/PageHeader";

type Shortcut = { to: string; label: string; icon: LucideIcon; description: string };

const shortcuts: Shortcut[] = [
  { to: "/knowledge-bank", label: "بنك المعلومات", icon: LibraryBig, description: "بحث سياسات وفروع" },
  { to: "/employees", label: "الموظفون", icon: UsersRound, description: "مؤشرات الأداء" },
  { to: "/complaints", label: "الشكاوى", icon: AlertTriangle, description: "فتح ومتابعة الشكاوى" },
  { to: "/branches", label: "الفروع", icon: Building2, description: "الخدمات والتواصل" },
  { to: "/upload-center", label: "مركز الرفع", icon: FileUp, description: "رفع الملفات" },
];

const Dashboard = () => {
  const [bookings, setBookings] = useState<Record<string, string | number | undefined>[]>([]);
  const [hiddenEmployees, setHiddenEmployees] = useState<string[]>([]);
  const [employeeAliases, setEmployeeAliases] = useState<Record<string, string>>({});
  const [employeeAdjustments, setEmployeeAdjustments] = useState<Record<string, Record<string, string | number>>>({});
  const session = getAdminSession();
  const canManage = session ? hasPermission(session.role, "manage_employees") : false;

  useEffect(() => {
    api.getBookings().then((d) => setBookings(d.bookings || [])).catch(() => setBookings([]));
    api
      .getSettings()
      .then((s) => {
        setHiddenEmployees(normalizeHiddenEmployees(s.hiddenEmployees || []));
        setEmployeeAliases(s.employeeAliases || {});
        setEmployeeAdjustments(s.employeeAdjustments || {});
      })
      .catch(() => {
        setHiddenEmployees([]);
        setEmployeeAliases({});
        setEmployeeAdjustments({});
      });
  }, []);

  const summary = useMemo(() => summarizeBookings(bookings), [bookings]);
  const topEmployees = useMemo(() => {
    const rows = buildEmployeeRows({
      stats: processBookings(bookings),
      hiddenEmployees,
      aliases: employeeAliases,
      adjustments: employeeAdjustments,
    });
    return rows.filter((row) => (canManage ? true : !row.hiddenFromPerformance)).slice(0, 4);
  }, [bookings, hiddenEmployees, employeeAliases, employeeAdjustments, canManage]);

  const kpis = [
    { label: "إجمالي الحجوزات", value: summary.total },
    { label: "المؤكد", value: summary.confirmed },
    { label: "الملغي", value: summary.cancelled },
    { label: "نسبة الإلغاء", value: `${summary.cancelRate}%` },
  ];

  return (
    <div className="space-y-6 md:space-y-7 pb-12 md:pb-8">
      <PageHeader
        title="لوحة التشغيل اليومية"
        subtitle="تجربة تشغيل هادئة وواضحة لفريق الكول سنتر والمشرفين مع اختصارات سريعة ومؤشرات مباشرة."
        showBack={false}
        icon={Sparkles}
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <div key={kpi.label} className="page-surface card-hover min-h-[146px] flex flex-col justify-between">
            <p className="text-sm text-muted-foreground">{kpi.label}</p>
            <p className="kpi-value text-primary mt-4">{kpi.value}</p>
            <div className="mt-4 h-1 rounded-full bg-secondary/80 overflow-hidden">
              <span className="block h-full gold-gradient" style={{ width: `${35 + index * 18}%` }} />
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
          <Link to="/employees" className="text-xs text-primary hover:text-primary/80 interactive">
            عرض الكل
          </Link>
        </div>
        {topEmployees.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {topEmployees.map((employee, index) => (
              <div key={employee.employeeKey} className="rounded-2xl border border-border/70 p-4 bg-secondary/25 min-h-[140px]">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-primary/40 bg-primary/10 px-2 text-xs font-semibold text-primary">
                    #{index + 1}
                  </span>
                  <p className="font-semibold text-base truncate">{employee.displayName}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">مؤكد {employee.confirmed} · ملغي {employee.cancelled}</p>
                <p className="text-xs text-primary mt-2">معدل إلغاء {employee.cancelRate}%</p>
                {canManage && employee.hiddenFromPerformance ? (
                  <p className="text-[11px] text-amber-300 mt-2 inline-flex items-center gap-1">
                    <EyeOff className="w-3 h-3" /> مخفي عن العرض العام
                  </p>
                ) : null}
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
