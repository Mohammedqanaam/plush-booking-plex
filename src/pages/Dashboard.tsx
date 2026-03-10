import { useEffect, useMemo, useState } from "react";
import { Bell, Library, UserRound, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { processBookings, summarizeBookings } from "@/lib/bookingProcessor";

const shortcuts = [
  { to: "/knowledge-bank", label: "بنك المعلومات", icon: Library },
  { to: "/employees", label: "الموظفين", icon: Users },
  { to: "/complaints", label: "الشكاوى", icon: Bell },
  { to: "/branches", label: "الفروع", icon: UserRound },
];

const Dashboard = () => {
  const [bookings, setBookings] = useState<Record<string, string | number | undefined>[]>([]);
  const [hiddenEmployees, setHiddenEmployees] = useState<string[]>([]);

  useEffect(() => {
    api.getBookings().then((d) => setBookings(d.bookings || [])).catch(() => setBookings([]));
    api.getSettings().then((s) => setHiddenEmployees(s.hiddenEmployees || [])).catch(() => setHiddenEmployees([]));
  }, []);

  const hiddenSet = useMemo(
    () => new Set(hiddenEmployees.map((name) => name.trim().toLowerCase()).filter(Boolean)),
    [hiddenEmployees],
  );

  const visibleBookings = useMemo(
    () => bookings.filter((row) => {
      const agent = String(
        row["Agent name"] ||
        row["Agent Name"] ||
        row["agent name"] ||
        row["Employee"] ||
        row["اسم الموظف"] ||
        "",
      ).trim().toLowerCase();
      return !hiddenSet.has(agent);
    }),
    [bookings, hiddenSet],
  );

  const summary = useMemo(() => summarizeBookings(visibleBookings), [visibleBookings]);
  const topEmployees = useMemo(() => processBookings(visibleBookings).slice(0, 4), [visibleBookings]);

  return <div className="p-4 max-w-6xl mx-auto space-y-5">
    <div>
      <h2 className="text-2xl font-bold">Worm-AI / Res Dashboard</h2>
      <p className="text-xs text-muted-foreground">لوحة التشغيل اليومية للكول سنتر والمشرفين.</p>
    </div>

    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[{ label: "إجمالي الحجوزات", value: summary.total }, { label: "المؤكد", value: summary.confirmed }, { label: "الملغي", value: summary.cancelled }, { label: "نسبة الإلغاء", value: `${summary.cancelRate}%` }].map((kpi) => (
        <div key={kpi.label} className="glass-card p-4">
          <p className="text-xs text-muted-foreground">{kpi.label}</p>
          <p className="text-3xl font-bold text-primary">{kpi.value}</p>
        </div>
      ))}
    </section>

    <section className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {shortcuts.map((item) => <Link key={item.to} to={item.to} className="glass-card p-3 flex items-center gap-2 text-sm"><item.icon className="w-4 h-4" />{item.label}</Link>)}
    </section>

    <section className="glass-card p-4">
      <h3 className="font-semibold mb-3">أفضل الموظفين</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {topEmployees.map((employee) => <div key={employee.agent} className="rounded-lg border p-3"><p className="font-semibold text-sm">{employee.agent}</p><p className="text-xs">مؤكد {employee.confirmed} · ملغي {employee.cancelled}</p></div>)}
      </div>
    </section>
  </div>;
};

export default Dashboard;
