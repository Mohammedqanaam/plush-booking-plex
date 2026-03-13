import { useEffect, useMemo, useState } from "react";
import { Search, UsersRound } from "lucide-react";
import { api } from "@/lib/api";
import { processBookings } from "@/lib/bookingProcessor";
import { getAdminSession, hasPermission } from "@/lib/adminAuth";
import PageHeader from "@/components/PageHeader";

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
      <PageHeader title="قسم الموظفين" subtitle="قراءة واضحة لأداء الموظفين مع تحكم صلاحيات آمن." icon={UsersRound} />

      <div className="glass-card p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="h-11 rounded-xl bg-secondary border px-10 w-full" placeholder="بحث باسم الموظف" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="space-y-2">
          {shown.length ? shown.map((employee) => (
            <div key={employee.agent} className="border border-border/60 rounded-xl p-3 space-y-2 bg-card/50">
              {canManage ? <input className="h-10 rounded-lg border px-2 w-full bg-secondary" value={employee.display} onChange={(e) => setRenames((p) => ({ ...p, [employee.agent]: e.target.value }))} /> : <p className="font-medium text-sm">{employee.display}</p>}
              <p className="text-xs text-muted-foreground">مؤكد: {employee.confirmed} | ملغي: {employee.cancelled} | الإجمالي: {employee.total} | نسبة الإلغاء: {employee.cancelRate}%</p>
              {canManage ? <button className="h-9 px-3 rounded-lg border" onClick={() => setHidden((p) => p.includes(employee.agent) ? p.filter((n) => n !== employee.agent) : [...p, employee.agent])}>{employee.isHidden ? "إظهار" : "إخفاء"}</button> : null}
            </div>
          )) : <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">لا توجد نتائج مطابقة للبحث.</div>}
        </div>

        {canManage ? <button className="h-11 px-4 rounded-xl gold-gradient text-primary-foreground" onClick={() => api.updateSettings({ hiddenEmployees: hidden }).then(() => alert("تم حفظ الإعدادات"))}>حفظ حالة الإخفاء</button> : null}
      </div>
    </div>
  );
};

export default Employees;
