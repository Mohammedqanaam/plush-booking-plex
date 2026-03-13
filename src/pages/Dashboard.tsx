import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Building2, FileUp, LibraryBig, Sparkles, UsersRound, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { processBookings, summarizeBookings } from "@/lib/bookingProcessor";
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
    api.getSettings().then((s) => setHiddenEmployees(s.hiddenEmployees || [])).catch(() => setHiddenEmployees([]));
  }, []);

  const hiddenSet = useMemo(() => new Set(hiddenEmployees.map((name) => name.trim().toLowerCase()).filter(Boolean)), [hiddenEmployees]);

  const visibleBookings = useMemo(
    () => bookings.filter((row) => {
      const agent = String(row["Agent name"] || row["Agent Name"] || row["agent name"] || row["Employee"] || row["اسم الموظف"] || "").trim().toLowerCase();
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
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <PageHeader title="Res Dashboard" subtitle="لوحة تشغيل يومية سريعة وواضحة لفريق الكول سنتر والمشرفين." showBack={false} icon={Sparkles} />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="page-surface hover:border-primary/40 interactive">
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
            <p className="text-3xl font-bold text-primary">{kpi.value}</p>
          </div>
        ))}
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {shortcuts.map((item) => (
          <Link key={item.to} to={item.to} className="page-surface hover:border-primary/40 interactive">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <item.icon className="w-4 h-4 text-primary" />
              {item.label}
            </div>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </Link>
        ))}
      </section>

      <section className="page-surface">
        <h3 className="font-semibold">أفضل الموظفين</h3>
        {topEmployees.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {topEmployees.map((employee) => (
              <div key={employee.agent} className="rounded-xl border border-border/60 p-3 bg-background/30">
                <p className="font-semibold text-sm truncate">{employee.agent}</p>
                <p className="text-xs text-muted-foreground">مؤكد {employee.confirmed} · ملغي {employee.cancelled}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">لا توجد بيانات كافية لعرض أفضل الموظفين حالياً.</div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
