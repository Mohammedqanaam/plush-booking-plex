import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, CalendarX, BarChart3, Hotel } from "lucide-react";
import { api } from "@/lib/api";

type BookingRecord = Record<string, string | number | undefined>;

type BookingStats = {
  total: number;
  confirmed: number;
  cancelled: number;
  cancelRate: number;
};

const defaultStats: BookingStats = {
  total: 0,
  confirmed: 0,
  cancelled: 0,
  cancelRate: 0,
};

function classifyStatus(
  status: string
): "confirmed" | "cancelled" | "not_confirmed" {
  const s = status.trim().toUpperCase();
  if (s === "C" || s === "NS") return "cancelled";
  return "confirmed";
}


function getAnyValue(record: BookingRecord, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && String(value).trim()) return String(value);
  }
  return "";
}

const Dashboard = () => {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [stats, setStats] = useState<BookingStats>(defaultStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getBookings()
      .then((data) => {
        if (data.bookings && Array.isArray(data.bookings)) {
          setBookings(data.bookings);
        }
        if (data.stats) {
          setStats(data.stats);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const computedStats = useMemo(() => {
    if (stats.total > 0) return stats;
    if (!bookings.length) return defaultStats;

    let confirmed = 0;
    let cancelled = 0;

    bookings.forEach((record) => {
      const status = getAnyValue(record, [
        "Status",
        "status",
        "Booking Status",
        "BookingStatus",
        "حالة الحجز",
        "الحالة",
      ]);
      const category = classifyStatus(status);
      if (category === "confirmed") confirmed++;
      else if (category === "cancelled") cancelled++;
    });

    const total = bookings.length;
    return {
      total,
      confirmed,
      cancelled,
      cancelRate: total
        ? parseFloat(((cancelled / total) * 100).toFixed(1))
        : 0,
    };
  }, [bookings, stats]);

  const kpis = [
    {
      label: "إجمالي الحجوزات",
      value: computedStats.total.toLocaleString(),
      icon: Hotel,
      color: "text-primary",
    },
    {
      label: "الحجوزات المؤكدة",
      value: computedStats.confirmed.toLocaleString(),
      icon: CalendarCheck,
      color: "text-success",
    },
    {
      label: "الإلغاءات",
      value: computedStats.cancelled.toLocaleString(),
      icon: CalendarX,
      color: "text-destructive",
    },
    {
      label: "نسبة الإلغاء",
      value: `${computedStats.cancelRate}%`,
      icon: BarChart3,
      color: "text-warning",
    },
  ];

  const employees = useMemo(() => {
    if (!bookings.length) return [];
    const map = new Map<
      string,
      { name: string; total: number; confirmed: number; cancelled: number }
    >();

    const getEmployeeName = (record: BookingRecord) =>
      getAnyValue(record, [
        "Employee Name",
        "EmployeeName",
        "employee_name",
        "Employee",
        "employee",
        "اسم الموظف",
        "الموظف",
        "موظف الحجز",
        "CRO",
      ]);

    const getStatus = (record: BookingRecord) =>
      getAnyValue(record, [
        "Status",
        "status",
        "Booking Status",
        "BookingStatus",
        "حالة الحجز",
        "الحالة",
      ]);

    bookings.forEach((record) => {
      const name = getEmployeeName(record).trim();
      if (!name) return;
      const status = getStatus(record);
      const category = classifyStatus(status);
      const current = map.get(name) || {
        name,
        total: 0,
        confirmed: 0,
        cancelled: 0,
      };
      current.total += 1;
      if (category === "cancelled") current.cancelled += 1;
      else if (category === "confirmed") current.confirmed += 1;
      map.set(name, current);
    });

    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 40)
      .map((employee) => ({
        ...employee,
        cancelRate: employee.total
          ? (employee.cancelled / employee.total) * 100
          : 0,
      }));
  }, [bookings]);

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
              {loading ? "..." : kpi.value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold gold-text">
            موظفي الحجز المركزي
          </h3>
          <span className="text-xs text-muted-foreground">
            {employees.length ? `${employees.length} موظف` : "لا توجد بيانات"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {!employees.length && !loading ? (
            <p className="col-span-full text-xs text-muted-foreground">لم يتم العثور على أسماء موظفين داخل ملف الحجوزات. تأكد من وجود عمود مثل: Employee Name أو اسم الموظف.</p>
          ) : null}
          {employees.map((employee) => (
            <div key={employee.name} className="glass-card p-4 space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold">{employee.name}</p>
                <p className="text-xs text-muted-foreground">
                  إجمالي الحجوزات
                </p>
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
