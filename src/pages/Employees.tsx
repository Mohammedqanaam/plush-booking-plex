import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Search, ShieldCheck, UsersRound } from "lucide-react";
import { api } from "@/lib/api";
import { processBookings } from "@/lib/bookingProcessor";
import { getAdminSession, hasPermission } from "@/lib/adminAuth";
import PageHeader from "@/components/PageHeader";

const normalize = (value: string) => value.trim().toLowerCase();

const Employees = () => {
  const [search, setSearch] = useState("");
  const [hidden, setHidden] = useState<string[]>([]);
  const [rows, setRows] = useState<ReturnType<typeof processBookings>>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const session = getAdminSession();
  const canManage = session ? hasPermission(session.role, "manage_employees") : false;

  useEffect(() => {
    api.getSettings().then((s) => setHidden(s.hiddenEmployees || [])).catch(() => setHidden([]));
    api.getBookings().then((d) => setRows(processBookings(d.bookings || []))).catch(() => setRows([]));
  }, []);

  const hiddenSet = useMemo(() => new Set(hidden.map(normalize)), [hidden]);

  const shown = useMemo(
    () => rows
      .filter((r) => r.agent.toLowerCase().includes(search.toLowerCase()))
      .map((r) => ({ ...r, isHidden: hiddenSet.has(normalize(r.agent)) })),
    [rows, search, hiddenSet],
  );

  const toggleVisibility = (agentName: string) => {
    const key = normalize(agentName);
    setHidden((prev) => {
      const list = [...prev];
      const idx = list.findIndex((item) => normalize(item) === key);
      if (idx >= 0) list.splice(idx, 1);
      else list.push(agentName);
      return list;
    });
  };

  const saveHidden = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.updateSettings({ hiddenEmployees: hidden.map((name) => name.trim()).filter(Boolean) });
      setMessage("تم حفظ حالة الإظهار/الإخفاء بنجاح.");
    } catch {
      setMessage("تعذر حفظ الإعدادات، حاول مرة أخرى.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <PageHeader title="قسم الموظفين" subtitle="قراءة واضحة لأداء الموظفين مع تطبيق صارم للصلاحيات." icon={UsersRound} />

      <div className="page-surface">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="h-11 rounded-xl bg-secondary border px-10 w-full" placeholder="بحث باسم الموظف" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {!canManage ? (
          <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 text-xs text-muted-foreground inline-flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            وضع القراءة فقط: لا تتوفر صلاحية تعديل الإخفاء إلا للمصرح لهم.
          </div>
        ) : null}

        <div className="space-y-2">
          {shown.length ? shown.map((employee) => (
            <div key={employee.agent} className="border border-border/60 rounded-xl p-3 space-y-2 bg-card/50">
              <p className="font-medium text-sm">{employee.agent}</p>
              <p className="text-xs text-muted-foreground">مؤكد: {employee.confirmed} | ملغي: {employee.cancelled} | الإجمالي: {employee.total} | نسبة الإلغاء: {employee.cancelRate}%</p>
              {canManage ? <button className="h-9 px-3 rounded-lg border inline-flex items-center gap-1" onClick={() => toggleVisibility(employee.agent)}>{employee.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}{employee.isHidden ? "إظهار" : "إخفاء"}</button> : null}
            </div>
          )) : <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">لا توجد نتائج مطابقة للبحث.</div>}
        </div>

        {canManage ? <button disabled={saving} className="h-11 px-4 rounded-xl gold-gradient text-primary-foreground disabled:opacity-60" onClick={saveHidden}>{saving ? "جارٍ الحفظ..." : "حفظ حالة الإخفاء"}</button> : null}
        {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      </div>
    </div>
  );
};

export default Employees;
