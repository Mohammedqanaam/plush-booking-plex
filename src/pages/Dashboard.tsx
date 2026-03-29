import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Crown,
  FileUp,
  LibraryBig,
  Sparkles,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { processBookings, summarizeBookings } from "@/lib/bookingProcessor";
import { normalizeEmployeeName, normalizeHiddenEmployees } from "@/lib/employeeVisibility";
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

  const summary = useMemo(() => summarizeBookings(visibleBookings), [visibleBookings]);
  const topEmployees = useMemo(() => processBookings(visibleBookings).slice(0, 4), [visibleBookings]);

  const kpis = [
    { label: "إجمالي الحجوزات", value: summary.total },
    { label: "المؤكد", value: summary.confirmed },
    { label: "الملغي", value: summary.cancelled },
    { label: "نسبة الإلغاء", value: `${summary.cancelRate}%` },
  ];

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4 md:space-y-5">
      <PageHeader
        title="لوحة التشغيل اليومية"
        subtitle="تجربة تشغيل هادئة وواضحة لفريق الكول سنتر والمشرفين مع اختصارات سريعة ومؤشرات مباشرة."
        showBack={false}
        icon={Sparkles}
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi, index) => (
          <div key={kpi.label} className="page-surface card-hover">
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
            <p className="kpi-value text-primary">{kpi.value}</p>
            <div className="mt-2 h-1 rounded-full bg-secondary/80 overflow-hidden">
              <span className="block h-full gold-gradient" style={{ width: `${35 + index * 18}%` }} />
            </div>
          </div>
        ))}
      </section>

      <section className="page-surface space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="section-title">اختصارات سريعة</h3>
          <span className="text-xs text-muted-foreground">وصول أسرع للأقسام الأكثر استخدامًا</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {shortcuts.map((item) => (
            <Link key={item.to} to={item.to} className="rounded-2xl border border-border/70 bg-secondary/25 p-3 card-hover text-right">
              <div className="flex items-center justify-between gap-3">
                <span className="icon-chip">
                  <item.icon className="w-4 h-4" />
                </span>
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm font-semibold">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="page-surface">
        <div className="flex items-center gap-2 mb-3">
          <span className="icon-chip">
            <Crown className="w-4 h-4" />
          </span>
          <h3 className="section-title">أفضل الموظفين</h3>
        </div>
        {topEmployees.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {topEmployees.map((employee, index) => (
              <div key={employee.agent} className="rounded-xl border border-border/70 p-3 bg-secondary/25">
                <p className="font-semibold text-sm truncate">{index + 1}. {employee.agent}</p>
                <p className="text-xs text-muted-foreground mt-1">مؤكد {employee.confirmed} · ملغي {employee.cancelled}</p>
                <p className="text-xs text-primary mt-2">معدل إلغاء {employee.cancelRate}%</p>
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
