import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Eye, EyeOff, Save, Search, SlidersHorizontal, TrendingUp, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { api, type EmployeeAdjustment } from "@/lib/api";
import { isEmployeeHidden, normalizeEmployeeName, normalizeHiddenEmployees } from "@/lib/employeeVisibility";
import { processBookings } from "@/lib/bookingProcessor";
import { getAdminSession, hasPermission } from "@/lib/adminAuth";
import PageHeader from "@/components/PageHeader";

type EmployeeRow = ReturnType<typeof processBookings>[number] & {
  sourceName: string;
  displayName: string;
  canonicalId: string;
  isHidden: boolean;
  confirmedAdjustment: number;
  cancelledAdjustment: number;
  totalAdjustment: number;
  finalConfirmed: number;
  finalCancelled: number;
  finalTotal: number;
  adjustmentReason: string;
  notes: string;
  updatedBy: string;
  updatedAt: string;
};

const namesAreSame = (a: string, b: string) => normalizeEmployeeName(a) === normalizeEmployeeName(b);

const Employees = () => {
  const [search, setSearch] = useState("");
  const [hidden, setHidden] = useState<string[]>([]);
  const [bookings, setBookings] = useState<Record<string, string | number | undefined>[]>([]);
  const [renames, setRenames] = useState<Record<string, string>>({});
  const [adjustments, setAdjustments] = useState<Record<string, EmployeeAdjustment>>({});
  const [showHiddenOnly, setShowHiddenOnly] = useState(false);
  const [showMConfirmedOnly, setShowMConfirmedOnly] = useState(false);

  const session = getAdminSession();
  const canManage = session ? hasPermission(session.role, "manage_employees") : false;

  useEffect(() => {
    api.getSettings().then((s) => {
      setHidden(normalizeHiddenEmployees(s.hiddenEmployees || []));
      setAdjustments(s.employeeAdjustments || {});
    });
    api.getBookings().then((d) => setBookings(d.bookings || [])).catch(() => setBookings([]));
  }, []);

  const rows = useMemo(
    () => processBookings(bookings, showMConfirmedOnly ? { confirmedStatuses: ["M"] } : undefined),
    [bookings, showMConfirmedOnly],
  );

  const allEmployeeTotals = useMemo(() => {
    const total = rows.reduce((sum, row) => sum + row.total, 0);
    const confirmed = rows.reduce((sum, row) => sum + row.confirmed, 0);
    return { total, confirmed, employees: rows.length };
  }, [rows]);

  const shown = useMemo(() => {
    const mapped: EmployeeRow[] = rows
      .map((r) => {
        const canonicalId = normalizeEmployeeName(r.agent);
        const adj = adjustments[canonicalId] || {};
        const confirmedAdjustment = Number(adj.confirmedAdjustment || 0);
        const cancelledAdjustment = Number(adj.cancelledAdjustment || 0);
        const totalAdjustment = confirmedAdjustment + cancelledAdjustment;
        const finalConfirmed = Math.max(0, r.confirmed + confirmedAdjustment);
        const finalCancelled = Math.max(0, r.cancelled + cancelledAdjustment);
        const finalTotal = finalConfirmed + finalCancelled;

        return {
          ...r,
          sourceName: r.agent,
          displayName: renames[r.agent] || r.agent,
          canonicalId,
          isHidden: isEmployeeHidden(r.agent, hidden),
          confirmedAdjustment,
          cancelledAdjustment,
          totalAdjustment,
          finalConfirmed,
          finalCancelled,
          finalTotal,
          adjustmentReason: adj.adjustmentReason || "",
          notes: adj.notes || "",
          updatedBy: adj.updatedBy || "",
          updatedAt: adj.updatedAt || "",
        };
      })
      .filter((r) => r.displayName.toLowerCase().includes(search.toLowerCase()));

    if (!canManage) {
      return mapped.filter((r) => !r.isHidden);
    }

    return mapped.filter((r) => (showHiddenOnly ? r.isHidden : true));
  }, [rows, search, renames, hidden, showHiddenOnly, canManage, adjustments]);

  const updateEmployeeAdjustment = (canonicalId: string, patch: Partial<EmployeeAdjustment>) => {
    const by = session?.username || "system";
    setAdjustments((prev) => ({
      ...prev,
      [canonicalId]: {
        ...prev[canonicalId],
        ...patch,
        updatedBy: by,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  return (
    <div className="page-wrap">
      <PageHeader title="قائمة الموظفين" subtitle="عرض واضح للموظفين المتاحين للزوار، مع إبقاء أدوات الإدارة داخل صلاحياتها فقط." icon={UsersRound} />

      <div className="page-surface space-y-3">
        <div className="grid gap-2 md:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="h-11 rounded-xl bg-secondary/70 border px-10 w-full" placeholder="بحث باسم الموظف" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {canManage ? (
            <button
              className={`h-11 px-4 rounded-xl border inline-flex items-center gap-2 ${showHiddenOnly ? "border-primary text-primary bg-primary/10" : "border-primary/18"}`}
              onClick={() => setShowHiddenOnly((prev) => !prev)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {showHiddenOnly ? "إظهار الكل" : "المخفون فقط"}
            </button>
          ) : null}
          <button
            className={`h-11 px-4 rounded-xl border inline-flex items-center gap-2 ${showMConfirmedOnly ? "border-primary text-primary bg-primary/10" : "border-primary/18"}`}
            onClick={() => setShowMConfirmedOnly((prev) => !prev)}
          >
            <BadgeCheck className="w-4 h-4" />
            مؤكد بحالة M فقط
          </button>
          {canManage ? (
            <button
              className="h-11 px-4 rounded-xl gold-gradient text-primary-foreground inline-flex items-center gap-2"
              onClick={() =>
                api.updateSettings({ hiddenEmployees: normalizeHiddenEmployees(hidden), employeeAdjustments: adjustments })
                  .then(() => toast.success("تم حفظ الإخفاء والتعديلات"))
                  .catch(() => toast.error("تعذر حفظ الإعدادات"))
              }
            >
              <Save className="w-4 h-4" /> حفظ
            </button>
          ) : null}
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="compact-card">
            <p className="text-xs text-muted-foreground">إجمالي الحجوزات العام</p>
            <p className="mt-1 text-xl font-black text-primary tabular-nums">{allEmployeeTotals.total}</p>
          </div>
          <div className="compact-card">
            <p className="text-xs text-muted-foreground">المؤكد العام</p>
            <p className="mt-1 text-xl font-black text-primary tabular-nums">{allEmployeeTotals.confirmed}</p>
          </div>
          <div className="compact-card">
            <p className="text-xs text-muted-foreground">عدد الموظفين في البيانات</p>
            <p className="mt-1 text-xl font-black text-primary tabular-nums">{allEmployeeTotals.employees}</p>
          </div>
        </div>

        {!canManage ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((employee, index) => (
              <article key={employee.canonicalId} className="employee-public-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary/80">#{index + 1}</p>
                    <h3 className="mt-1 truncate text-lg font-black text-foreground">{employee.displayName}</h3>
                  </div>
                  <span className="icon-chip h-10 w-10 shrink-0"><TrendingUp className="h-4 w-4" /></span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl border border-primary/15 bg-secondary/30 p-3">
                    <p className="text-xs text-muted-foreground">المؤكد</p>
                    <p className="mt-1 text-2xl font-black tabular-nums text-primary">{employee.finalConfirmed}</p>
                  </div>
                  <div className="rounded-2xl border border-primary/15 bg-secondary/30 p-3">
                    <p className="text-xs text-muted-foreground">الإجمالي</p>
                    <p className="mt-1 text-2xl font-black tabular-nums text-foreground">{employee.finalTotal}</p>
                  </div>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary/80">
                  <span className="block h-full rounded-full gold-gradient" style={{ width: `${Math.min(100, Math.max(12, employee.finalTotal ? (employee.finalConfirmed / employee.finalTotal) * 100 : 12))}%` }} />
                </div>
              </article>
            ))}
          </div>
        ) : (
        <div className="table-scroll">
          <table className="min-w-[920px] w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b border-border/30">
                <th className="text-right p-2.5">اسم الموظف</th>
                {canManage ? <th className="text-right p-2.5">اسم العرض</th> : null}
                <th className="text-right p-2.5">المؤكد</th>
                {canManage ? <th className="text-right p-2.5">تعديل المؤكد</th> : null}
                <th className="text-right p-2.5">الإجمالي</th>
                {canManage ? <th className="text-right p-2.5">سبب التعديل</th> : null}
                {canManage ? <th className="text-right p-2.5">ملاحظات</th> : null}
                {canManage ? <th className="text-right p-2.5">آخر تحديث</th> : null}
                {canManage ? <th className="text-right p-2.5">الحالة</th> : null}
                {canManage ? <th className="text-right p-2.5">إجراء</th> : null}
              </tr>
            </thead>
            <tbody>
              {shown.map((employee) => (
                <tr key={employee.canonicalId} className="border-b border-border/30 last:border-0 align-top">
                  <td className="p-2.5 font-medium">
                    <div>{employee.displayName}</div>
                    {canManage && !namesAreSame(employee.sourceName, employee.displayName) ? <div className="text-xs text-muted-foreground">المصدر: {employee.sourceName}</div> : null}
                  </td>
                  {canManage ? (
                    <td className="p-2.5">
                      <input className="h-9 rounded-lg border px-2 w-full max-w-[220px] bg-secondary/60" value={employee.displayName} onChange={(e) => setRenames((p) => ({ ...p, [employee.sourceName]: e.target.value }))} />
                    </td>
                  ) : null}
                  <td className="p-2.5">{employee.finalConfirmed}</td>
                  {canManage ? (
                    <td className="p-2.5"><input type="number" className="h-9 rounded-lg border px-2 w-24 bg-secondary/60" value={employee.confirmedAdjustment} onChange={(e) => updateEmployeeAdjustment(employee.canonicalId, { confirmedAdjustment: Number(e.target.value) })} /></td>
                  ) : null}
                  <td className="p-2.5">{employee.finalTotal}</td>
                  {canManage ? <td className="p-2.5"><input className="h-9 rounded-lg border px-2 w-44 bg-secondary/60" value={employee.adjustmentReason} onChange={(e) => updateEmployeeAdjustment(employee.canonicalId, { adjustmentReason: e.target.value })} /></td> : null}
                  {canManage ? <td className="p-2.5"><input className="h-9 rounded-lg border px-2 w-44 bg-secondary/60" value={employee.notes} onChange={(e) => updateEmployeeAdjustment(employee.canonicalId, { notes: e.target.value })} /></td> : null}
                  {canManage ? <td className="p-2.5 text-xs text-muted-foreground">{employee.updatedBy || "-"}<br />{employee.updatedAt ? new Date(employee.updatedAt).toLocaleString("ar-SA") : "-"}</td> : null}
                  {canManage ? (
                    <td className="p-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${employee.isHidden ? "border-amber-400/40 bg-amber-400/10 text-amber-300" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"}`}>
                        {employee.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {employee.isHidden ? "مخفي" : "ظاهر"}
                      </span>
                    </td>
                  ) : null}
                  {canManage ? (
                    <td className="p-2.5">
                      <button className="h-9 px-3 rounded-lg border border-primary/18 hover:border-primary/60" onClick={() => setHidden((current) => employee.isHidden ? current.filter((name) => !isEmployeeHidden(name, [employee.sourceName])) : normalizeHiddenEmployees([...current, employee.sourceName]))}>
                        {employee.isHidden ? "إظهار" : "إخفاء"}
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        )}

        {!shown.length ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">لا توجد نتائج مطابقة للبحث الحالي.</div>
        ) : canManage ? (
          <p className="text-xs text-muted-foreground inline-flex items-center gap-2">
            <BadgeCheck className="w-4 h-4 text-primary" />
            إعدادات العرض لا تؤثر على الإجماليات.
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default Employees;
