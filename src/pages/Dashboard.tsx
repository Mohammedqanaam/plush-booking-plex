import { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarDays, CirclePercent, UserRound, XCircle, BadgeCheck } from "lucide-react";
import { api } from "@/lib/api";
import { processBookings, summarizeBookings } from "@/lib/bookingProcessor";

type BookingRecord = Record<string, string | number | undefined>;
const DATE_KEYS = ["Date booking", "Date Booking", "Booking Date", "Date", "تاريخ الحجز"];

const norm = (v: string) =>
  v
    .replace(/[\u064B-\u0652]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const anyVal = (r: BookingRecord, keys: string[]) => {
  for (const k of keys) if (r[k] !== undefined && String(r[k]).trim()) return String(r[k]);
  const entries = Object.entries(r);
  const kn = keys.map(norm);
  for (const [k, v] of entries) if (String(v || "").trim() && kn.some((kk) => norm(k).includes(kk))) return String(v);
  return "";
};

const Dashboard = () => {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    Promise.all([api.getBookings(), api.getSettings()])
      .then(([b, s]) => {
        setBookings(Array.isArray(b.bookings) ? b.bookings : []);
        setHidden(s.hiddenEmployees || []);
        setMonthFilter(s.reportMonth || "");
        setYearFilter(s.reportYear || "");
      })
      .catch(() => setBookings([]));
  }, []);

  const bookingSummary = useMemo(() => summarizeBookings(bookings), [bookings]);
  const agentStats = useMemo(() => processBookings(bookings), [bookings]);

  const visibleAgents = useMemo(() => {
    const hiddenNormalized = new Set(hidden.map(norm));
    return agentStats.filter((agent) => !hiddenNormalized.has(norm(agent.agent))).slice(0, 40);
  }, [agentStats, hidden]);

  const topAgents = useMemo(() => agentStats.slice(0, 10), [agentStats]);

  const monthly = useMemo(() => {
    const map = new Map<string, number>();
    bookings.forEach((r) => {
      const raw = anyVal(r, DATE_KEYS);
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return;
      const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(label, (map.get(label) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([month, total]) => ({ month, total }))
      .filter((r) => (!monthFilter || r.month.includes(monthFilter)) && (!yearFilter || r.month.includes(yearFilter)));
  }, [bookings, monthFilter, yearFilter]);

  const kpiItems = [
    { label: "إجمالي الحجوزات", value: bookingSummary.total, color: "text-primary", icon: BarChart3 },
    { label: "الحجوزات المؤكدة", value: bookingSummary.confirmed, color: "text-green-600", icon: BadgeCheck },
    { label: "الحجوزات الملغية", value: bookingSummary.cancelled, color: "text-red-600", icon: XCircle },
    { label: "نسبة الإلغاء", value: `${bookingSummary.cancelRate}%`, color: "text-amber-600", icon: CirclePercent },
  ] as const;

  return <div className="p-4 max-w-5xl mx-auto space-y-6">
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <h2 className="text-2xl font-bold">لوحة المتابعة</h2>
      <button
        type="button"
        onClick={() => setShowStats((v) => !v)}
        className="px-4 py-2 rounded-lg border bg-background hover:bg-secondary transition"
      >
        {showStats ? "إخفاء الإحصائيات" : "الإحصائيات"}
      </button>
    </div>

    {showStats && (
      <section className="glass-card p-4 space-y-4">
        <h3 className="font-semibold text-lg">الإحصائيات</h3>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpiItems.map((item) => (
            <div key={item.label} className="kpi-card p-4 sm:p-5">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-1 text-[11px] font-medium">
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </span>
              <p className={`text-2xl font-bold mt-2 ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="sm:hidden space-y-2">
          {topAgents.map((agent) => (
            <div key={agent.agent} className="glass-card p-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs font-semibold">
                <UserRound className="w-3.5 h-3.5 text-primary" />
                {agent.agent}
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                <span className="text-green-600 font-semibold">مؤكد: {agent.confirmed}</span>
                <span className="text-red-600 font-semibold">ملغي: {agent.cancelled}</span>
                <span>الإجمالي: {agent.total}</span>
                <span className="text-amber-600 font-semibold">الإلغاء: {agent.cancelRate}%</span>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-2">الموظف</th>
                <th className="py-2 px-2 text-green-600">المؤكد</th>
                <th className="py-2 px-2 text-red-600">الملغي</th>
                <th className="py-2 px-2">الإجمالي</th>
                <th className="py-2 px-2 text-amber-600">نسبة الإلغاء</th>
              </tr>
            </thead>
            <tbody>
              {topAgents.map((agent) => (
                <tr key={agent.agent} className="border-b last:border-b-0">
                  <td className="py-2 px-2 whitespace-nowrap">{agent.agent}</td>
                  <td className="py-2 px-2 text-green-600 font-semibold">{agent.confirmed}</td>
                  <td className="py-2 px-2 text-red-600 font-semibold">{agent.cancelled}</td>
                  <td className="py-2 px-2">{agent.total}</td>
                  <td className="py-2 px-2 text-amber-600 font-semibold">{agent.cancelRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    )}

    <div className="glass-card p-4"><h3 className="font-semibold flex items-center gap-2"><CalendarDays className="w-4 h-4" />التجميع الشهري</h3><div className="flex gap-2 flex-wrap mt-2">{monthly.map((m) => <span key={m.month} className="text-xs px-2 py-1 rounded bg-secondary">{m.month}: {m.total}</span>)}</div></div>

    <div className="glass-card p-4 space-y-2">
      <p className="text-sm font-semibold">الموظفون الظاهرون ({visibleAgents.length}/40)</p>
      {visibleAgents.map((e) => <div key={e.agent} className="flex justify-between items-center border-b pb-2"><div className="flex items-center gap-2"><UserRound className="w-4 h-4" />{e.agent}</div><div className="text-xs"><span className="text-success font-semibold">مؤكد: {e.confirmed}</span> | <span className="text-destructive">ملغي: {e.cancelled}</span> | إجمالي: {e.total}</div></div>)}
    </div>
  </div>;
};

export default Dashboard;
