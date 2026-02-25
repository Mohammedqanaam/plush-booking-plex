import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarCheck,
  CalendarDays,
  CalendarX,
  Eye,
  EyeOff,
  Hotel,
  Save,
  UserRound,
} from "lucide-react";
import { api } from "@/lib/api";

type BookingRecord = Record<string, string | number | undefined>;

type BookingStats = {
  total: number;
  confirmed: number;
  cancelled: number;
  cancelRate: number;
};

type EmployeeStat = {
  name: string;
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

function classifyStatus(status: string): "confirmed" | "cancelled" {
  const s = status.trim().toUpperCase();
  if (s === "C" || s === "NS") return "cancelled";
  return "confirmed";
}

const normalizeKey = (value: string) =>
  value
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\s_\-\/]+/g, "")
    .trim();

function getAnyValue(record: BookingRecord, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && String(value).trim()) return String(value);
  }

  const entries = Object.entries(record as Record<string, string | number | undefined>);
  const normalizedTargets = keys.map(normalizeKey);

  for (const [rawKey, rawValue] of entries) {
    if (rawValue === undefined || !String(rawValue).trim()) continue;
    const normalized = normalizeKey(rawKey);

    if (normalizedTargets.includes(normalized)) return String(rawValue);

    if (normalizedTargets.some((target) => normalized.includes(target) || target.includes(normalized))) {
      return String(rawValue);
    }
  }

  return "";
}

const MONTH_NAMES_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

const parsePossibleDate = (value: string): Date | null => {
  const v = value.trim();
  if (!v) return null;

  const native = new Date(v);
  if (!Number.isNaN(native.getTime())) return native;

  const match = v.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const yearRaw = Number(match[3]);
  const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
  const parsed = new Date(year, month, day);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const Dashboard = () => {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [stats, setStats] = useState<BookingStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [hiddenEmployees, setHiddenEmployees] = useState<string[]>([]);
  const [saveMessage, setSaveMessage] = useState<string>("");

  useEffect(() => {
    const stored = localStorage.getItem("dashboard_hidden_employees");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setHiddenEmployees(parsed);
      } catch {
        setHiddenEmployees([]);
      }
    }
  }, []);

  useEffect(() => {
    api
      .getBookings()
      .then((data) => {
        if (Array.isArray(data.bookings)) {
          setBookings(data.bookings);
        }
        if (data.stats) {
          setStats(data.stats);
        }
      })
      .catch(() => {
        setBookings([]);
        setStats(defaultStats);
      })
      .finally(() => setLoading(false));
  }, []);

  const computedStats = useMemo(() => {
    if (!bookings.length) return defaultStats;

    let confirmed = 0;
    let cancelled = 0;

    bookings.forEach((record) => {
      const status = getAnyValue(record, ["Status", "status", "Booking Status", "BookingStatus", "حالة الحجز", "الحالة"]);
      const category = classifyStatus(status);
      if (category === "confirmed") confirmed++;
      else cancelled++;
    });

    const total = bookings.length;
    return {
      total,
      confirmed,
      cancelled,
      cancelRate: total ? parseFloat(((cancelled / total) * 100).toFixed(1)) : 0,
    };
  }, [bookings, stats]);

  const allEmployees = useMemo<EmployeeStat[]>(() => {
    if (!bookings.length) return [];

    const map = new Map<string, { total: number; confirmed: number; cancelled: number }>();

    bookings.forEach((record) => {
      const name = getAnyValue(record, [
        "Employee Name",
        "EmployeeName",
        "employee_name",
        "Employee",
        "employee",
        "اسم الموظف",
        "الموظف",
        "موظف الحجز",
        "CRO",
        "Agent",
        "agent",
        "Agent Name",
        "Created By",
        "created by",
        "اسم الكرو",
      ]).trim();

      if (!name) return;

      const status = getAnyValue(record, ["Status", "status", "Booking Status", "BookingStatus", "حالة الحجز", "الحالة"]);
      const category = classifyStatus(status);
      const current = map.get(name) || { total: 0, confirmed: 0, cancelled: 0 };
      current.total += 1;
      if (category === "cancelled") current.cancelled += 1;
      else current.confirmed += 1;
      map.set(name, current);
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        ...value,
        cancelRate: value.total ? (value.cancelled / value.total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [bookings]);

  const employees = useMemo(
    () => allEmployees.filter((employee) => !hiddenEmployees.includes(employee.name)),
    [allEmployees, hiddenEmployees],
  );

  const monthSummary = useMemo(() => {
    const dateKeys = ["Date", "Booking Date", "booking_date", "Created At", "تاريخ الحجز", "التاريخ"];
    const monthMap = new Map<string, number>();

    bookings.forEach((record) => {
      const raw = getAnyValue(record, dateKeys);
      const parsed = parsePossibleDate(raw);
      if (!parsed) return;
      const label = `${MONTH_NAMES_AR[parsed.getMonth()]} ${parsed.getFullYear()}`;
      monthMap.set(label, (monthMap.get(label) || 0) + 1);
    });

    return Array.from(monthMap.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [bookings]);

  const kpis = [
    { label: "إجمالي الحجوزات", value: computedStats.total.toLocaleString(), icon: Hotel, color: "text-primary" },
    { label: "الحجوزات المؤكدة", value: computedStats.confirmed.toLocaleString(), icon: CalendarCheck, color: "text-success" },
    { label: "الإلغاءات", value: computedStats.cancelled.toLocaleString(), icon: CalendarX, color: "text-destructive" },
    { label: "نسبة الإلغاء", value: `${computedStats.cancelRate}%`, icon: BarChart3, color: "text-warning" },
  ];

  const toggleHidden = (name: string) => {
    setHiddenEmployees((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  };

  const handleSaveEmployeesView = () => {
    localStorage.setItem("dashboard_hidden_employees", JSON.stringify(hiddenEmployees));
    setSaveMessage("تم حفظ إعدادات إخفاء الموظفين بنجاح.");
    setTimeout(() => setSaveMessage(""), 2500);
  };

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">لوحة التحكم</h2>
        <p className="text-muted-foreground text-sm">نظرة عامة على إحصائيات الحجوزات</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {kpis.map((kpi, i) => (
          <div key={kpi.label} className="kpi-card" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex items-center justify-between mb-3">
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <p className={`text-2xl font-bold ${kpi.color} animate-count-up`}>{loading ? "..." : kpi.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-5 space-y-3">
        <h3 className="text-sm font-semibold gold-text flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          نشاط الحجوزات حسب الأشهر
        </h3>
        <div className="flex flex-wrap gap-2">
          {monthSummary.length ? (
            monthSummary.map((item) => (
              <span key={item.month} className="text-xs rounded-full bg-secondary px-3 py-1 border border-border">
                {item.month}: {item.total}
              </span>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">لم يتم التعرف على أعمدة تاريخ صالحة داخل البيانات بعد.</p>
          )}
        </div>
      </div>

      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold gold-text">موظفي الحجز المركزي</h3>
          <span className="text-xs text-muted-foreground">{employees.length ? `${employees.length} موظف ظاهر` : "لا توجد بيانات"}</span>
        </div>

        <div className="glass-card p-3 space-y-3">
          <p className="text-xs text-muted-foreground">إخفاء/إظهار الموظفين (✅ ظاهر / ❌ مخفي) ثم حفظ التحديث:</p>
          <div className="max-h-44 overflow-y-auto custom-scrollbar space-y-2">
            {allEmployees.map((employee) => {
              const hidden = hiddenEmployees.includes(employee.name);
              return (
                <label key={employee.name} className="flex items-center justify-between text-xs border border-border rounded-md px-3 py-2">
                  <span>{employee.name}</span>
                  <button
                    type="button"
                    onClick={() => toggleHidden(employee.name)}
                    className={`rounded px-2 py-1 text-[11px] ${hidden ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success"}`}
                  >
                    {hidden ? "❌ مخفي" : "✅ ظاهر"}
                  </button>
                </label>
              );
            })}
          </div>
          <button
            type="button"
            onClick={handleSaveEmployeesView}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs gold-gradient text-primary-foreground"
          >
            <Save className="w-4 h-4" />
            حفظ التحديث
          </button>
          {saveMessage ? <p className="text-xs text-success">{saveMessage}</p> : null}
        </div>

        <div className="space-y-2">
          {!employees.length && !loading ? (
            <p className="text-xs text-muted-foreground">
              لم يتم العثور على أسماء موظفين داخل ملف الحجوزات. تأكد من وجود عمود مثل: Employee Name أو اسم الموظف.
            </p>
          ) : null}

          {employees.map((employee) => (
            <div key={employee.name} className="glass-card p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                  <UserRound className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{employee.name}</p>
                  <p className="text-xs text-muted-foreground">إجمالي: {employee.total}</p>
                </div>
              </div>

              <div className="text-xs flex items-center gap-3">
                <span className="text-success">مؤكد: {employee.confirmed}</span>
                <span className="text-destructive">ملغي: {employee.cancelled}</span>
                <span className="text-warning">نسبة الإلغاء: {employee.cancelRate.toFixed(1)}%</span>
                {hiddenEmployees.includes(employee.name) ? <EyeOff className="w-4 h-4 text-destructive" /> : <Eye className="w-4 h-4 text-success" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
