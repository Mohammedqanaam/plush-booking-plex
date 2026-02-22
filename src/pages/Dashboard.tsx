import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, CalendarX, BarChart3, Hotel } from "lucide-react";

type BookingStats = {
  total: number;
  confirmed: number;
  cancelled: number;
  cancelRate: number;
  employees: Array<{
    name: string;
    total: number;
    confirmed: number;
    cancelled: number;
    cancelRate: number;
  }>;
};

const mockStats: BookingStats = {
  total: 1247,
  confirmed: 1089,
  cancelled: 158,
  cancelRate: 12.7,
  employees: [],
};

const Dashboard = () => {
  const [stats, setStats] = useState<BookingStats>(mockStats);

  useEffect(() => {
    fetch("/api/bookings")
      .then((res) => res.json())
      .then((data) => {
        if (data.stats) {
          setStats(data.stats);
        }
      })
      .catch(() => {});
  }, []);

  const kpis = useMemo(
    () => [
      {
        label: "إجمالي الحجوزات",
        value: stats.total,
        icon: Hotel,
        color: "text-primary",
      },
      {
        label: "الحجوزات المؤكدة",
        value: stats.confirmed,
        icon: CalendarCheck,
        color: "text-success",
      },
      {
        label: "الإلغاءات",
        value: stats.cancelled,
        icon: CalendarX,
        color: "text-destructive",
      },
      {
        label: "نسبة الإلغاء",
        value: `${stats.cancelRate.toFixed(1)}%`,
        icon: BarChart3,
        color: "text-warning",
      },
    ],
    [stats]
  );

  const employees = stats.employees || [];

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      {/* Welcome */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">لوحة التحكم</h2>
        <p className="text-muted-foreground text-sm">
          نظرة عامة على إحصائيات الحجوزات
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3">
        {kpis.map((kpi, i) => (
          <div
            key={kpi.label}
            className="kpi-card"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <p className={`text-2xl font-bold ${kpi.color} animate-count-up`}>
              {kpi.value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold gold-text">موظفي الحجز المركزي</h3>
          <span className="text-xs text-muted-foreground">
            {employees.length ? `${employees.length} موظف` : "لا توجد بيانات"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {employees.map((employee) => (
            <div key={employee.name} className="glass-card p-4 space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold">{employee.name}</p>
                <p className="text-xs text-muted-foreground">إجمالي الحجوزات</p>
                <p className="text-xl font-bold text-primary">
                  {employee.total}
                </p>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-success">مؤكد</span>
                <span className="font-semibold">{employee.confirmed}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-destructive">ملغي</span>
                <span className="font-semibold">{employee.cancelled}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-warning">نسبة الإلغاء</span>
                <span className="font-semibold">
                  {employee.cancelRate.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
