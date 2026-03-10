import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { processBookings } from "@/lib/bookingProcessor";

const Employees = () => {
  const [search, setSearch] = useState("");
  const [hidden, setHidden] = useState<string[]>([]);
  const [rows, setRows] = useState<ReturnType<typeof processBookings>>([]);

  useEffect(() => {
    api.getSettings().then((s) => setHidden(s.hiddenEmployees || []));
    api.getBookings().then((d) => setRows(processBookings(d.bookings || []))).catch(() => setRows([]));
  }, []);

  const shown = useMemo(() => {
    const hiddenSet = new Set(hidden.map((name) => name.trim().toLowerCase()));
    return rows
      .filter((r) => !hiddenSet.has(r.agent.trim().toLowerCase()))
      .filter((r) => r.agent.toLowerCase().includes(search.toLowerCase()));
  }, [rows, search, hidden]);

  return <div className="p-4 max-w-5xl mx-auto space-y-4">
    <div className="glass-card p-4 space-y-3">
      <h2 className="text-2xl font-bold">قسم الموظفين</h2>
      <p className="text-xs text-muted-foreground">عرض احترافي للأداء. جميع إجراءات التعديل والإخفاء متاحة من لوحة الأدمن فقط.</p>
      <input className="h-10 rounded-lg bg-secondary border px-3 w-full" placeholder="بحث باسم الموظف" value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="space-y-2">
        {shown.map((employee) => (
          <div key={employee.agent} className="border rounded-lg p-3">
            <p className="font-medium text-sm">{employee.agent}</p>
            <p className="text-xs">مؤكد: {employee.confirmed} | ملغي: {employee.cancelled} | الإجمالي: {employee.total} | نسبة الإلغاء: {employee.cancelRate}%</p>
          </div>
        ))}
      </div>
    </div>
  </div>;
};

export default Employees;
