import { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarCheck, CalendarDays, CalendarX, Hotel, UserRound } from "lucide-react";
import { api } from "@/lib/api";

type BookingRecord = Record<string, string | number | undefined>;
const AGENT_KEYS = ["Agent name", "Agent Name", "agent name", "اسم الموظف", "الموظف", "المندوب"];
const STATUS_KEYS = ["All stute", "all stute", "Status", "status", "حالة الحجز", "الحالة"];
const DATE_KEYS = ["Date booking", "Date Booking", "Booking Date", "Date", "تاريخ الحجز"];

const norm = (v: string) => v.replace(/[\u064B-\u0652]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/\s+/g, " ").trim().toLowerCase();
const anyVal = (r: BookingRecord, keys: string[]) => {
  for (const k of keys) if (r[k] !== undefined && String(r[k]).trim()) return String(r[k]);
  const entries = Object.entries(r);
  const kn = keys.map(norm);
  for (const [k, v] of entries) if (String(v || "").trim() && kn.some((kk) => norm(k).includes(kk))) return String(v);
  return "";
};
const statusType = (s: string) => {
  const v = norm(s);
  if (["m", "n"].includes(v) || v.includes("conf") || v.includes("مؤكد")) return "confirmed";
  if (["c", "ns"].includes(v) || v.includes("cancel") || v.includes("ملغ") || v.includes("الغاء") || v.includes("إلغاء")) return "cancelled";
  return "other";
};

const Dashboard = () => {
  const [rows, setRows] = useState<BookingRecord[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  useEffect(() => {
    Promise.all([api.getBookings(), api.getSettings()]).then(([b, s]) => {
      setRows(Array.isArray(b.bookings) ? b.bookings : []);
      setHidden(s.hiddenEmployees || []);
      setMonthFilter(s.reportMonth || "");
      setYearFilter(s.reportYear || "");
    }).catch(() => setRows([]));
  }, []);

  const employees = useMemo(() => {
    const map = new Map<string, { name: string; total: number; confirmed: number; cancelled: number }>();
    rows.forEach((r) => {
      const name = anyVal(r, AGENT_KEYS).trim();
      if (!name) return;
      const key = norm(name);
      const prev = map.get(key) || { name, total: 0, confirmed: 0, cancelled: 0 };
      prev.total += 1;
      const st = statusType(anyVal(r, STATUS_KEYS));
      if (st === "confirmed") prev.confirmed += 1;
      if (st === "cancelled") prev.cancelled += 1;
      map.set(key, prev);
    });
    return Array.from(map.entries())
      .filter(([k]) => !hidden.map(norm).includes(k))
      .map(([_, v]) => ({ ...v, cancelRate: v.total ? +(v.cancelled / v.total * 100).toFixed(1) : 0 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 40);
  }, [rows, hidden]);

  const totals = useMemo(() => {
    const total = employees.reduce((s, e) => s + e.total, 0);
    const confirmed = employees.reduce((s, e) => s + e.confirmed, 0);
    const cancelled = employees.reduce((s, e) => s + e.cancelled, 0);
    return { total, confirmed, cancelled, cancelRate: total ? +(cancelled / total * 100).toFixed(1) : 0 };
  }, [employees]);

  const monthly = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => {
      const raw = anyVal(r, DATE_KEYS);
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return;
      const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(label, (map.get(label) || 0) + 1);
    });
    return Array.from(map.entries()).map(([month, total]) => ({ month, total })).filter((r) => (!monthFilter || r.month.includes(monthFilter)) && (!yearFilter || r.month.includes(yearFilter)));
  }, [rows, monthFilter, yearFilter]);

  return <div className="p-4 max-w-5xl mx-auto space-y-6">
    <h2 className="text-2xl font-bold">لوحة المتابعة</h2>
    <div className="grid grid-cols-2 gap-3">{[
      { label: "إجمالي الحجوزات", value: totals.total, icon: Hotel, color: "text-primary" },
      { label: "المؤكد", value: totals.confirmed, icon: CalendarCheck, color: "text-success" },
      { label: "الملغي", value: totals.cancelled, icon: CalendarX, color: "text-destructive" },
      { label: "نسبة الإلغاء", value: `${totals.cancelRate}%`, icon: BarChart3, color: "text-warning" },
    ].map((k) => <div className="kpi-card" key={k.label}><k.icon className={`w-5 h-5 ${k.color}`} /><p className="text-2xl font-bold">{k.value}</p><p className="text-xs">{k.label}</p></div>)}</div>

    <div className="glass-card p-4"><h3 className="font-semibold flex items-center gap-2"><CalendarDays className="w-4 h-4" />التجميع الشهري</h3><div className="flex gap-2 flex-wrap mt-2">{monthly.map((m) => <span key={m.month} className="text-xs px-2 py-1 rounded bg-secondary">{m.month}: {m.total}</span>)}</div></div>

    <div className="glass-card p-4 space-y-2">
      <p className="text-sm font-semibold">الموظفون الظاهرون ({employees.length}/40)</p>
      {employees.map((e) => <div key={e.name} className="flex justify-between items-center border-b pb-2"><div className="flex items-center gap-2"><UserRound className="w-4 h-4" />{e.name}</div><div className="text-xs"><span className="text-success font-semibold">مؤكد: {e.confirmed}</span> | <span className="text-destructive">ملغي: {e.cancelled}</span> | إجمالي: {e.total}</div></div>)}
    </div>
  </div>;
};

export default Dashboard;
