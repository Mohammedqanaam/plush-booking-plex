import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Eye, EyeOff, Search, SlidersHorizontal, UsersRound } from "lucide-react";
import { api, type AppSettings } from "@/lib/api";
import { normalizeHiddenEmployees } from "@/lib/employeeVisibility";
import { processBookings } from "@/lib/bookingProcessor";
import { getAdminSession, hasPermission } from "@/lib/adminAuth";
import { buildEmployeeRows, extractAdjustmentPayload, type EmployeeRow } from "@/lib/employeePerformance";
import PageHeader from "@/components/PageHeader";

const Employees = () => {
  const [search, setSearch] = useState("");
  const [hidden, setHidden] = useState<string[]>([]);
  const [rows, setRows] = useState<ReturnType<typeof processBookings>>([]);
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const [adjustments, setAdjustments] = useState<Record<string, Record<string, string | number>>>({});
  const [showHiddenOnly, setShowHiddenOnly] = useState(false);
  const [reasonDraft, setReasonDraft] = useState<Record<string, string>>({});
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  const session = getAdminSession();
  const canManage = session ? hasPermission(session.role, "manage_employees") : false;

  useEffect(() => {
    api
      .getSettings()
      .then((s: AppSettings) => {
        setHidden(normalizeHiddenEmployees(s.hiddenEmployees || []));
        setAliases(s.employeeAliases || {});
        setAdjustments(s.employeeAdjustments || {});
      })
      .catch(() => null);

    api
      .getBookings()
      .then((d) => setRows(processBookings(d.bookings || [])))
      .catch(() => setRows([]));
  }, []);

  const preparedRows = useMemo(
    () => buildEmployeeRows({ stats: rows, hiddenEmployees: hidden, aliases, adjustments }),
    [rows, hidden, aliases, adjustments],
  );

  const shown = useMemo(
    () =>
      preparedRows
        .filter((r) => (canManage ? true : !r.hiddenFromPerformance))
        .filter((r) => (canManage && showHiddenOnly ? r.hiddenFromPerformance : true))
        .filter((r) => r.displayName.toLowerCase().includes(search.toLowerCase()) || r.sourceName.toLowerCase().includes(search.toLowerCase())),
    [preparedRows, canManage, showHiddenOnly, search],
  );

  const saveSettings = async () => {
    try {
      await api.updateSettings({
        hiddenEmployees: normalizeHiddenEmployees(hidden),
        employeeAliases: aliases,
        employeeAdjustments: extractAdjustmentPayload(preparedRows),
      });
      setMessage("تم حفظ إعدادات الموظفين بنجاح");
    } catch {
      setMessage("تعذر حفظ الإعدادات");
    }
  };

  const updateAdjustment = (employee: EmployeeRow, key: "confirmedAdjustment" | "cancelledAdjustment" | "totalAdjustment", value: number) => {
    setAdjustments((prev) => ({
      ...prev,
      [employee.employeeKey]: {
        ...(prev[employee.employeeKey] || {}),
        [key]: Number.isNaN(value) ? 0 : value,
        adjustmentReason: reasonDraft[employee.employeeKey] || String(prev[employee.employeeKey]?.adjustmentReason || ""),
        notes: notesDraft[employee.employeeKey] || String(prev[employee.employeeKey]?.notes || ""),
        updatedBy: session?.username || "",
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  return (
    <div className="p-3 md:p-4 max-w-6xl mx-auto space-y-4 pb-28 md:pb-8">
      <PageHeader
        title="لوحة الموظفين"
        subtitle="عرض الأداء العام للزوار مع أدوات إدارة متقدمة للمشرفين دون التأثير على إجماليات النظام."
        icon={UsersRound}
      />

      <div className="page-surface space-y-3 md:space-y-4">
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
          {canManage ? (
            <button
              className={`h-11 px-4 rounded-xl border inline-flex items-center gap-2 ${showHiddenOnly ? "border-primary text-primary bg-primary/10" : "border-border/70"}`}
              onClick={() => setShowHiddenOnly((prev) => !prev)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {showHiddenOnly ? "إظهار الكل" : "المخفي فقط"}
            </button>
          ) : null}
          {canManage ? (
            <button className="h-11 px-4 rounded-xl gold-gradient text-primary-foreground" onClick={saveSettings}>
              حفظ إعدادات الموظفين
            </button>
          ) : null}
        </div>

        <div className="grid gap-3 md:hidden">
          {shown.map((employee) => (
            <article key={employee.employeeKey} className="rounded-2xl border border-border/60 bg-secondary/30 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-base">{employee.displayName}</p>
                  {canManage && !employee.duplicateName ? (
                    <p className="text-xs text-muted-foreground mt-1">الاسم بالمصدر: {employee.sourceName}</p>
                  ) : null}
                </div>
                {canManage ? (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${employee.hiddenFromPerformance ? "border-amber-400/40 bg-amber-400/10 text-amber-300" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"}`}>
                    {employee.hiddenFromPerformance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {employee.hiddenFromPerformance ? "مخفي" : "ظاهر"}
                  </span>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p>المؤكد: <span className="text-primary">{employee.confirmed}</span></p>
                <p>الملغي: <span className="text-primary">{employee.cancelled}</span></p>
                <p>الإجمالي: <span className="text-primary">{employee.total}</span></p>
                <p>الإلغاء: <span className="text-primary">{employee.cancelRate}%</span></p>
              </div>
              {canManage ? (
                <div className="space-y-2 border-t border-border/60 pt-3">
                  <button
                    className="h-9 px-3 rounded-lg border border-border/70 hover:border-primary/60"
                    onClick={() =>
                      setHidden((current) =>
                        employee.hiddenFromPerformance
                          ? current.filter((name) => name !== employee.employeeKey)
                          : normalizeHiddenEmployees([...current, employee.employeeKey]),
                      )
                    }
                  >
                    {employee.hiddenFromPerformance ? "إظهار في المؤشر" : "إخفاء من المؤشر"}
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>

        <div className="table-scroll hidden md:block">
          <table className="min-w-[980px] w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b border-border/60">
                <th className="text-right p-3">اسم الموظف</th>
                {canManage ? <th className="text-right p-3">اسم المصدر</th> : null}
                <th className="text-right p-3">المؤكد</th>
                <th className="text-right p-3">الملغي</th>
                <th className="text-right p-3">الإجمالي</th>
                <th className="text-right p-3">نسبة الإلغاء</th>
                {canManage ? <th className="text-right p-3">الحالة</th> : null}
                {canManage ? <th className="text-right p-3">إجراءات الإدارة</th> : null}
              </tr>
            </thead>
            <tbody>
              {shown.map((employee) => (
                <tr key={employee.employeeKey} className="border-b border-border/40 last:border-0 align-top">
                  <td className="p-3 font-medium">{employee.displayName}</td>
                  {canManage ? <td className="p-3">{employee.sourceName}</td> : null}
                  <td className="p-3">{employee.confirmed}</td>
                  <td className="p-3">{employee.cancelled}</td>
                  <td className="p-3">{employee.total}</td>
                  <td className="p-3 text-primary">{employee.cancelRate}%</td>
                  {canManage ? (
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${employee.hiddenFromPerformance ? "border-amber-400/40 bg-amber-400/10 text-amber-300" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"}`}>
                        {employee.hiddenFromPerformance ? "مخفي" : "ظاهر"}
                      </span>
                    </td>
                  ) : null}
                  {canManage ? (
                    <td className="p-3">
                      <div className="space-y-2 min-w-[280px]">
                        <button
                          className="h-9 px-3 rounded-lg border border-border/70 hover:border-primary/60"
                          onClick={() =>
                            setHidden((current) =>
                              employee.hiddenFromPerformance
                                ? current.filter((name) => name !== employee.employeeKey)
                                : normalizeHiddenEmployees([...current, employee.employeeKey]),
                            )
                          }
                        >
                          {employee.hiddenFromPerformance ? "إظهار" : "إخفاء"}
                        </button>
                        <div className="grid grid-cols-3 gap-1">
                          <input className="h-8 rounded border bg-secondary/40 px-2" type="number" placeholder="Δ مؤكد" value={String(adjustments[employee.employeeKey]?.confirmedAdjustment ?? 0)} onChange={(e) => updateAdjustment(employee, "confirmedAdjustment", Number(e.target.value))} />
                          <input className="h-8 rounded border bg-secondary/40 px-2" type="number" placeholder="Δ ملغي" value={String(adjustments[employee.employeeKey]?.cancelledAdjustment ?? 0)} onChange={(e) => updateAdjustment(employee, "cancelledAdjustment", Number(e.target.value))} />
                          <input className="h-8 rounded border bg-secondary/40 px-2" type="number" placeholder="Δ إجمالي" value={String(adjustments[employee.employeeKey]?.totalAdjustment ?? 0)} onChange={(e) => updateAdjustment(employee, "totalAdjustment", Number(e.target.value))} />
                        </div>
                        <input
                          className="h-8 rounded border bg-secondary/40 px-2 w-full"
                          placeholder="سبب التعديل"
                          value={reasonDraft[employee.employeeKey] ?? String(adjustments[employee.employeeKey]?.adjustmentReason ?? "")}
                          onChange={(e) => {
                            setReasonDraft((prev) => ({ ...prev, [employee.employeeKey]: e.target.value }));
                            setAdjustments((prev) => ({
                              ...prev,
                              [employee.employeeKey]: {
                                ...(prev[employee.employeeKey] || {}),
                                adjustmentReason: e.target.value,
                                updatedBy: session?.username || "",
                                updatedAt: new Date().toISOString(),
                              },
                            }));
                          }}
                        />

                        <input
                          className="h-8 rounded border bg-secondary/40 px-2 w-full"
                          placeholder="ملاحظات إدارية"
                          value={notesDraft[employee.employeeKey] ?? String(adjustments[employee.employeeKey]?.notes ?? "")}
                          onChange={(e) => {
                            setNotesDraft((prev) => ({ ...prev, [employee.employeeKey]: e.target.value }));
                            setAdjustments((prev) => ({
                              ...prev,
                              [employee.employeeKey]: {
                                ...(prev[employee.employeeKey] || {}),
                                notes: e.target.value,
                                updatedBy: session?.username || "",
                                updatedAt: new Date().toISOString(),
                              },
                            }));
                          }}
                        />
                        <button
                          className="h-8 rounded border border-destructive/40 text-destructive"
                          onClick={() =>
                            setAdjustments((prev) => ({
                              ...prev,
                              [employee.employeeKey]: {
                                ...(prev[employee.employeeKey] || {}),
                                confirmedAdjustment: -employee.adjustment.baseConfirmed,
                                cancelledAdjustment: -employee.adjustment.baseCancelled,
                                totalAdjustment: -employee.adjustment.baseTotal,
                                adjustmentReason: "تصفير إداري",
                                updatedBy: session?.username || "",
                                updatedAt: new Date().toISOString(),
                              },
                            }))
                          }
                        >
                          تصفير الأرقام
                        </button>
                      </div>
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
            الإخفاء يخص ظهور الموظف في مؤشر الأداء العام فقط، بينما الإجماليات العامة للنظام تبقى كما هي.
          </p>
        )}

        {message ? <p className="text-xs rounded-xl border border-border/60 bg-secondary/35 p-3 text-muted-foreground">{message}</p> : null}
      </div>
    </div>
  );
};

export default Employees;
