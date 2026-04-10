import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Eye, EyeOff, Search, SlidersHorizontal, UsersRound } from "lucide-react";
import { api } from "@/lib/api";
import { isEmployeeHidden, normalizeHiddenEmployees } from "@/lib/employeeVisibility";
import { processBookings } from "@/lib/bookingProcessor";
import { getAdminSession, hasPermission } from "@/lib/adminAuth";
import PageHeader from "@/components/PageHeader";

const Employees = () => {
  const [search, setSearch] = useState("");
  const [hidden, setHidden] = useState<string[]>([]);
  const [rows, setRows] = useState<ReturnType<typeof processBookings>>([]);
  const [renames, setRenames] = useState<Record<string, string>>({});
  const [showHiddenOnly, setShowHiddenOnly] = useState(false);

  const session = getAdminSession();
  const canManage = session ? hasPermission(session.role, "manage_employees") : false;

  useEffect(() => {
    api.getSettings().then((s) => setHidden(normalizeHiddenEmployees(s.hiddenEmployees || [])));
    api.getBookings().then((d) => setRows(processBookings(d.bookings || []))).catch(() => setRows([]));
  }, []);

  const shown = useMemo(
    () =>
      rows
        .map((r) => ({ ...r, display: renames[r.agent] || r.agent, isHidden: isEmployeeHidden(r.agent, hidden) }))
        .filter((r) => r.display.toLowerCase().includes(search.toLowerCase()))
        .filter((r) => (showHiddenOnly ? r.isHidden : true)),
    [rows, search, renames, hidden, showHiddenOnly],
  );

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <PageHeader
        title="لوحة الموظفين"
        subtitle="عرض واضح للأداء اليومي مع خيار إخفاء العرض من مؤشر الأداء فقط دون التأثير على الإجماليات."
        icon={UsersRound}
      />

      <div className="page-surface space-y-3">
        <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-11 rounded-xl bg-secondary/70 border px-10 w-full"
              placeholder="بحث باسم الموظف"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className={`h-11 px-4 rounded-xl border inline-flex items-center gap-2 ${showHiddenOnly ? "border-primary text-primary bg-primary/10" : "border-border/70"}`}
            onClick={() => setShowHiddenOnly((prev) => !prev)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {showHiddenOnly ? "إظهار الكل" : "المخفي فقط"}
          </button>
          {canManage ? (
            <button
              className="h-11 px-4 rounded-xl gold-gradient text-primary-foreground"
              onClick={() =>
                api.updateSettings({ hiddenEmployees: normalizeHiddenEmployees(hidden) }).then(() => alert("تم حفظ حالة الإخفاء"))
              }
            >
              حفظ إعدادات الإخفاء
            </button>
          ) : null}
        </div>

        <div className="table-scroll">
          <p className="text-xs text-muted-foreground mb-2">{shown.length} موظف</p>
          <table className="min-w-[880px] w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b border-border/60">
                <th className="text-right p-3">اسم الموظف</th>
                <th className="text-right p-3">اسم العرض</th>
                <th className="text-right p-3">المؤكد</th>
                <th className="text-right p-3">الملغي</th>
                <th className="text-right p-3">الإجمالي</th>
                <th className="text-right p-3">نسبة الإلغاء</th>
                <th className="text-right p-3">الحالة في مؤشر الأداء</th>
                {canManage ? <th className="text-right p-3">إجراء</th> : null}
              </tr>
            </thead>
            <tbody>
              {shown.map((employee) => (
                <tr key={employee.agent} className="border-b border-border/40 last:border-0">
                  <td className="p-3 font-medium">{employee.agent}</td>
                  <td className="p-3">
                    {canManage ? (
                      <input
                        className="h-9 rounded-lg border px-2 w-full max-w-[220px] bg-secondary/60"
                        value={employee.display}
                        onChange={(e) => setRenames((p) => ({ ...p, [employee.agent]: e.target.value }))}
                      />
                    ) : (
                      employee.display
                    )}
                  </td>
                  <td className="p-3">{employee.confirmed}</td>
                  <td className="p-3">{employee.cancelled}</td>
                  <td className="p-3">{employee.total}</td>
                  <td className="p-3 text-primary">{employee.cancelRate}%</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${employee.isHidden ? "border-amber-400/40 bg-amber-400/10 text-amber-300" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"}`}>
                      {employee.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {employee.isHidden ? "مخفي من المؤشر" : "ظاهر في المؤشر"}
                    </span>
                  </td>
                  {canManage ? (
                    <td className="p-3">
                      <button
                        className="h-9 px-3 rounded-lg border border-border/70 hover:border-primary/60"
                        onClick={() =>
                          setHidden((current) =>
                            employee.isHidden
                              ? current.filter((name) => !isEmployeeHidden(name, [employee.agent]))
                              : normalizeHiddenEmployees([...current, employee.agent]),
                          )
                        }
                      >
                        {employee.isHidden ? "إظهار" : "إخفاء"}
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!shown.length ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            لا توجد نتائج مطابقة للبحث الحالي.
          </div>
        ) : (
          <p className="text-xs text-muted-foreground inline-flex items-center gap-2">
            <BadgeCheck className="w-4 h-4 text-primary" />
            الإخفاء يخص عرض مؤشرات الأداء فقط، ولا يستبعد الموظف من الإجماليات التاريخية.
          </p>
        )}
      </div>
    </div>
  );
};

export default Employees;
