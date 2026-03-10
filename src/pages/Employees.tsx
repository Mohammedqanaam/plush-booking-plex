import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { processBookings } from "@/lib/bookingProcessor";
import { getAdminSession, hasPermission } from "@/lib/adminAuth";

const Employees = () => {
  const [search, setSearch] = useState("");
  const [hidden, setHidden] = useState<string[]>([]);
  const [rows, setRows] = useState<ReturnType<typeof processBookings>>([]);
  const [renames, setRenames] = useState<Record<string, string>>({});
  const session = getAdminSession();
  const canManage = session ? hasPermission(session.role, "manage_employees") : false;

  useEffect(() => {
    api.getSettings().then((s) => setHidden(s.hiddenEmployees || []));
    api.getBookings().then((d) => setRows(processBookings(d.bookings || []))).catch(() => setRows([]));
  }, []);

  const shown = useMemo(
    () => rows
      .filter((r) => r.agent.toLowerCase().includes(search.toLowerCase()))
      .map((r) => ({ ...r, display: renames[r.agent] || r.agent, isHidden: hidden.includes(r.agent) })),
    [rows, search, renames, hidden],
  );

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <div className="glass-card p-4 space-y-3">
        <h2 className="text-2xl font-bold">قسم الموظفين</h2>
        <input className="h-10 rounded-lg bg-secondary border px-3 w-full" placeholder="بحث باسم الموظف" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="space-y-2">
          {shown.map((employee) => (
            <div key={employee.agent} className="border rounded-lg p-3 space-y-2">
              {canManage ? <input className="h-9 rounded border px-2 w-full bg-secondary" value={employee.display} onChange={(e) => setRenames((p) => ({ ...p, [employee.agent]: e.target.value }))} /> : <p className="font-medium text-sm">{employee.display}</p>}
              <p className="text-xs">مؤكد: {employee.confirmed} | ملغي: {employee.cancelled} | الإجمالي: {employee.total} | نسبة الإلغاء: {employee.cancelRate}%</p>
              {canManage ? <button className="h-8 px-3 rounded border" onClick={() => setHidden((p) => p.includes(employee.agent) ? p.filter((n) => n !== employee.agent) : [...p, employee.agent])}>{employee.isHidden ? "إظهار" : "إخفاء"}</button> : null}
            </div>
          ))}
        </div>
        {canManage ? <button className="h-10 px-4 rounded-lg gold-gradient text-primary-foreground" onClick={() => api.updateSettings({ hiddenEmployees: hidden }).then(() => alert("تم حفظ الإعدادات"))}>حفظ حالة الإخفاء</button> : null}
      </div>
    </div>
  );
};

export default Employees;
