import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  BookOpenCheck,
  Building2,
  Download,
  Eye,
  EyeOff,
  FileText,
  FileSpreadsheet,
  FileWarning,
  Gauge,
  LogOut,
  MessageSquareMore,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Tags,
  Upload,
  User,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, type ContactRequest, type EmployeeAdjustment, type PublicBookingReport } from "@/lib/api";
import { isEmployeeHidden, normalizeEmployeeName, normalizeHiddenEmployees } from "@/lib/employeeVisibility";
import { clearAdminSession, getAdminSession, hasPermission, type PermissionAction, type UserRole } from "@/lib/adminAuth";
import { processBookings } from "@/lib/bookingProcessor";
import PageHeader from "@/components/PageHeader";
import AdminAnalytics from "@/components/admin/AdminAnalytics";

type UserRecord = { username: string; role: UserRole };
type AdminTab = "overview" | "analytics" | "bookings" | "employees" | "requests" | "users" | "settings" | "profile";

const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: "مدير النظام",
  admin: "مشرف",
  editor: "محرر بيانات",
  viewer: "مشاهد داخلي",
};

const TAB_DEFINITIONS: Array<{ id: AdminTab; label: string; icon: typeof Gauge; permission: PermissionAction }> = [
  { id: "overview", label: "نظرة عامة", icon: Gauge, permission: "view" },
  { id: "analytics", label: "زيارات الموقع", icon: BarChart3, permission: "view" },
  { id: "bookings", label: "بيانات الحجوزات", icon: Upload, permission: "upload" },
  { id: "employees", label: "إدارة الموظفين", icon: UsersRound, permission: "manage_employees" },
  { id: "requests", label: "طلبات التواصل", icon: MessageSquareMore, permission: "view" },
  { id: "users", label: "المستخدمون", icon: Users, permission: "manage_users" },
  { id: "settings", label: "الإعدادات", icon: Settings, permission: "edit_settings" },
  { id: "profile", label: "الحساب", icon: User, permission: "view" },
];

const AdminDashboard = () => {
  const session = getAdminSession();
  const sessionRole = session?.role;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const can = (permission: PermissionAction) => !!session && hasPermission(session.role, permission);
  const visibleTabs = useMemo(
    () => TAB_DEFINITIONS.filter((tab) => !!sessionRole && hasPermission(sessionRole, tab.permission)),
    [sessionRole],
  );

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [bookings, setBookings] = useState<Record<string, string | number | undefined>[]>([]);
  const [publicReport, setPublicReport] = useState<PublicBookingReport | null>(null);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [hiddenEmployees, setHiddenEmployees] = useState<string[]>([]);
  const [employeeDisplayNames, setEmployeeDisplayNames] = useState<Record<string, string>>({});
  const [employeeAdjustments, setEmployeeAdjustments] = useState<Record<string, EmployeeAdjustment>>({});
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("viewer");
  const [siteTitle, setSiteTitle] = useState("Res");
  const [bannerText, setBannerText] = useState("");
  const [reportMonth, setReportMonth] = useState("");
  const [reportYear, setReportYear] = useState("");
  const [complaintEmail, setComplaintEmail] = useState("");
  const [complaintEmailWebhook, setComplaintEmailWebhook] = useState("");
  const [complaintWhatsappNumber, setComplaintWhatsappNumber] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const employeeStats = useMemo(() => processBookings(bookings), [bookings]);
  const shownEmployees = useMemo(
    () => employeeStats.filter((employee) => !employeeSearch.trim() || employee.agent.toLocaleLowerCase("ar").includes(employeeSearch.trim().toLocaleLowerCase("ar"))),
    [employeeStats, employeeSearch],
  );

  const loadPublicReport = async () => {
    try {
      setPublicReport(await api.getPublicBookingReport());
    } catch {
      setPublicReport(null);
    }
  };

  const loadBookings = async () => {
    try {
      const data = await api.getBookings();
      setBookings(Array.isArray(data.bookings) ? data.bookings : []);
    } catch {
      setBookings([]);
    }
  };

  useEffect(() => {
    const requested = (searchParams.get("tab") || "overview") as AdminTab;
    const allowed = visibleTabs.some((tab) => tab.id === requested) ? requested : "overview";
    setActiveTab(allowed);
    if (requested !== allowed) setSearchParams({ tab: allowed }, { replace: true });
  }, [searchParams, setSearchParams, visibleTabs]);

  useEffect(() => {
    void loadPublicReport();
    api.getSettings().then((settings) => {
      setSiteTitle(settings.siteTitle || "Res");
      setBannerText(settings.bannerText || "");
      setReportMonth(settings.reportMonth || "");
      setReportYear(settings.reportYear || "");
      setHiddenEmployees(normalizeHiddenEmployees(settings.hiddenEmployees || []));
      setEmployeeDisplayNames(settings.employeeDisplayNames || {});
      setEmployeeAdjustments(settings.employeeAdjustments || {});
      setComplaintEmail(settings.complaintEmail || "");
      setComplaintEmailWebhook(settings.complaintEmailWebhook || "");
      setComplaintWhatsappNumber(settings.complaintWhatsappNumber || "");
    }).catch(() => setMessage("تعذر تحميل بعض الإعدادات."));

    if (can("manage_users")) api.getUsers().then((data) => setUsers(data.users || [])).catch(() => setUsers([]));
    if (can("manage_employees") || can("upload")) void loadBookings();
    if (can("view")) api.getContactRequests().then((data) => setRequests(data.requests || [])).catch(() => setRequests([]));
    // Session permissions do not change while this page is mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab !== "requests") return;
    const load = () => api.getContactRequests().then((data) => setRequests(data.requests || [])).catch(() => setRequests([]));
    void load();
    const timer = window.setInterval(load, 12_000);
    return () => window.clearInterval(timer);
  }, [activeTab]);

  const setTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setMessage(null);
  };

  const updateEmployeeAdjustment = (id: string, patch: Partial<EmployeeAdjustment>) => {
    setEmployeeAdjustments((current) => ({
      ...current,
      [id]: {
        ...current[id],
        ...patch,
        updatedBy: session?.username || "",
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const saveEmployeeSettings = async () => {
    try {
      await api.updateSettings({ hiddenEmployees: normalizeHiddenEmployees(hiddenEmployees), employeeDisplayNames, employeeAdjustments });
      await loadPublicReport();
      setMessage("تم حفظ عرض الموظفين والتعديلات.");
    } catch {
      setMessage("تعذر حفظ إعدادات الموظفين.");
    }
  };

  const handleUpload = async (file?: File) => {
    if (!file) return;
    try {
      const data = await api.uploadBookings(await file.text());
      setMessage(`تم رفع ${Number(data.stats?.total || 0).toLocaleString("ar-SA")} سجل.`);
      await Promise.all([loadBookings(), loadPublicReport()]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "فشل رفع الملف.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const report = publicReport?.summary;

  return (
    <div className="page-wrap">
      <PageHeader
        title="لوحة الإدارة"
        subtitle="إدارة آمنة منفصلة عن صفحات الزوار."
        icon={ShieldCheck}
        showBack={false}
        actions={
          <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-primary/18 bg-secondary/40 px-3 text-xs font-bold" onClick={async () => { await api.logout(); clearAdminSession(); navigate("/"); }}>
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">تسجيل الخروج</span>
          </button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-primary/15 bg-secondary/20 px-4 py-3 text-xs">
        <span className="font-bold">{session?.username} · {ROLE_LABELS[(session?.role as UserRole) || "viewer"]}</span>
        <span className="text-muted-foreground">تقرير الحجوزات العام متاح للزوار بوضع مشاهدة فقط.</span>
      </div>

      <nav className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar" aria-label="أقسام لوحة الإدارة">
        {visibleTabs.map((tab) => (
          <button key={tab.id} onClick={() => setTab(tab.id)} className={`inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl border px-3 text-xs font-bold interactive ${activeTab === tab.id ? "border-primary/50 bg-primary/15 text-primary" : "border-border/30 bg-secondary/30 text-muted-foreground hover:text-foreground"}`}>
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </nav>

      {message ? <div className="rounded-xl border border-primary/20 bg-primary/8 p-3 text-sm">{message}</div> : null}

      {activeTab === "overview" ? (
        <div className="space-y-4">
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
            {[
              ["الحجوزات", report?.classifiedTotal || 0, FileText],
              ["المؤكدة", report?.confirmed || 0, ShieldCheck],
              ["الملغاة", report?.cancelled || 0, BarChart3],
              ["الموظفون", report?.employeeCount || 0, UsersRound],
              ["طلبات التواصل", requests.length, MessageSquareMore],
            ].map(([label, value, Icon]) => (
              <div key={label as string} className="compact-card">
                <div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">{label as string}</p><Icon className="h-4 w-4 text-primary" /></div>
                <p className="mt-2 kpi-value">{Number(value).toLocaleString("ar-SA")}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="page-surface space-y-3">
              <h2 className="section-title">اختصارات الإدارة</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {can("upload") ? <button className="compact-card flex items-center gap-3 text-right hover:border-primary/40" onClick={() => setTab("bookings")}><Upload className="h-5 w-5 text-primary" /><span><strong className="block">بيانات الحجوزات</strong><small className="text-muted-foreground">رفع الملف ومراجعة الملخص</small></span></button> : null}
                {can("upload") ? <button className="compact-card flex items-center gap-3 text-right hover:border-primary/40" onClick={() => navigate("/admin/avaya-reports")}><FileSpreadsheet className="h-5 w-5 text-primary" /><span><strong className="block">تقارير Avaya</strong><small className="text-muted-foreground">دمج التقارير وتحليل أداء الموظفين</small></span></button> : null}
                {can("manage_employees") ? <button className="compact-card flex items-center gap-3 text-right hover:border-primary/40" onClick={() => setTab("employees")}><UsersRound className="h-5 w-5 text-primary" /><span><strong className="block">إدارة الموظفين</strong><small className="text-muted-foreground">الأسماء والظهور والتعديلات</small></span></button> : null}
                {can("manage_employees") ? <button className="compact-card flex items-center gap-3 text-right hover:border-primary/40" onClick={() => navigate("/admin/warnings")}><FileWarning className="h-5 w-5 text-primary" /><span><strong className="block">إنذارات الموظفين</strong><small className="text-muted-foreground">إنشاء الإنذار وتصديره وأرشفته</small></span></button> : null}
                {can("manage_knowledge") ? <button className="compact-card flex items-center gap-3 text-right hover:border-primary/40" onClick={() => navigate("/admin/branches")}><Building2 className="h-5 w-5 text-primary" /><span><strong className="block">إدارة الفروع</strong><small className="text-muted-foreground">معلومات الفروع والخدمات</small></span></button> : null}
                {can("manage_knowledge") ? <button className="compact-card flex items-center gap-3 text-right hover:border-primary/40" onClick={() => navigate("/admin/knowledge-bank")}><BookOpenCheck className="h-5 w-5 text-primary" /><span><strong className="block">إدارة المعلومات</strong><small className="text-muted-foreground">المحتوى والغرف والمرافق</small></span></button> : null}
                {can("edit_settings") ? <button className="compact-card flex items-center gap-3 text-right hover:border-primary/40" onClick={() => navigate("/admin/complaints")}><MessageSquareMore className="h-5 w-5 text-primary" /><span><strong className="block">إدارة الشكاوى</strong><small className="text-muted-foreground">المراجعة وتحديث الحالة</small></span></button> : null}
                {can("edit_settings") ? <button className="compact-card flex items-center gap-3 text-right hover:border-primary/40" onClick={() => navigate("/admin/discounts")}><Tags className="h-5 w-5 text-primary" /><span><strong className="block">إدارة الخصومات</strong><small className="text-muted-foreground">العروض والفترات</small></span></button> : null}
              </div>
            </div>

            <div className="page-surface space-y-3">
              <h2 className="section-title">مستويات الوصول</h2>
              {[
                ["زائر", "يشاهد التقارير المجمعة دون تسجيل دخول."],
                ["مشاهد داخلي", "يشاهد لوحة القياس بعد تسجيل الدخول."],
                ["محرر بيانات", "يرفع ملف الحجوزات دون إدارة الحسابات."],
                ["مشرف", "يدير الموظفين والمستخدمين والإعدادات."],
              ].map(([title, description]) => <div key={title} className="compact-card"><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div>)}
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "analytics" ? <AdminAnalytics /> : null}

      {activeTab === "bookings" ? (
        <div className="space-y-4">
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["السجلات المصنفة", report?.classifiedTotal || 0],
              ["المؤكدة", report?.confirmed || 0],
              ["الملغاة", report?.cancelled || 0],
              ["غير المعروفة", report?.ignored || 0],
            ].map(([label, value]) => <div key={label as string} className="compact-card"><p className="text-xs text-muted-foreground">{label as string}</p><p className="mt-2 text-2xl font-black">{Number(value).toLocaleString("ar-SA")}</p></div>)}
          </section>
          <section className="page-surface space-y-4">
            <div><h2 className="section-title">تحديث بيانات الحجوزات</h2><p className="mt-1 text-xs text-muted-foreground">يقبل ملف CSV حتى 5 ميجابايت و50 ألف سجل.</p></div>
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => void handleUpload(event.target.files?.[0])} />
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex h-11 items-center gap-2 rounded-xl gold-gradient px-4 font-bold text-primary-foreground" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4" /> اختيار ملف CSV</button>
              {session?.role === "admin" || session?.role === "superadmin" ? (
                <button className="h-11 rounded-xl border border-destructive/35 px-4 text-destructive" onClick={async () => {
                  if (!window.confirm("سيتم حذف جميع بيانات الحجوزات الحالية. هل تريد المتابعة؟")) return;
                  try { await api.resetBookings(); await Promise.all([loadBookings(), loadPublicReport()]); setMessage("تم حذف بيانات الحجوزات."); } catch { setMessage("تعذر حذف البيانات."); }
                }}>حذف جميع البيانات</button>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "employees" ? (
        <section className="page-surface space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><h2 className="section-title">إدارة عرض الموظفين</h2><p className="mt-1 text-xs text-muted-foreground">التغييرات تؤثر في صفحة الزوار المجمعة فقط ولا تعدّل السجلات الأصلية.</p></div>
            <button className="inline-flex h-10 items-center gap-2 rounded-xl gold-gradient px-4 text-sm font-bold text-primary-foreground" onClick={() => void saveEmployeeSettings()}><Save className="h-4 w-4" /> حفظ التغييرات</button>
          </div>
          <label className="relative block">
            <span className="sr-only">بحث باسم الموظف</span>
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input className="h-11 w-full rounded-xl border bg-secondary/65 px-10" placeholder="بحث باسم الموظف" value={employeeSearch} onChange={(event) => setEmployeeSearch(event.target.value)} />
          </label>
          <div className="grid max-h-[640px] gap-3 overflow-auto pr-0.5 custom-scrollbar lg:grid-cols-2">
            {shownEmployees.map((employee) => {
              const id = normalizeEmployeeName(employee.agent);
              const hidden = isEmployeeHidden(employee.agent, hiddenEmployees);
              const adjustment = employeeAdjustments[id] || {};
              const confirmedAdjustment = Number(adjustment.confirmedAdjustment || 0);
              const cancelledAdjustment = Number(adjustment.cancelledAdjustment || 0);
              return (
                <article key={id} className="compact-card space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0"><p className="truncate font-bold">{employeeDisplayNames[id] || employee.agent}</p><p className="text-xs text-muted-foreground">الأصل: {employee.agent}</p></div>
                    <button className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs ${hidden ? "border-amber-400/30 text-amber-300" : "border-emerald-400/30 text-emerald-300"}`} onClick={() => setHiddenEmployees((current) => hidden ? current.filter((name) => !isEmployeeHidden(name, [employee.agent])) : normalizeHiddenEmployees([...current, employee.agent]))}>
                      {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {hidden ? "مخفي" : "ظاهر"}
                    </button>
                  </div>
                  <label className="block text-xs"><span className="mb-1 block text-muted-foreground">اسم العرض</span><input className="h-10 w-full rounded-xl border bg-secondary/65 px-3" value={employeeDisplayNames[id] ?? employee.agent} onChange={(event) => setEmployeeDisplayNames((current) => ({ ...current, [id]: event.target.value }))} /></label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs"><span className="mb-1 block text-muted-foreground">تعديل المؤكد</span><input type="number" className="h-10 w-full rounded-xl border bg-secondary/65 px-3" value={confirmedAdjustment} onChange={(event) => updateEmployeeAdjustment(id, { confirmedAdjustment: Number(event.target.value) })} /></label>
                    <label className="text-xs"><span className="mb-1 block text-muted-foreground">تعديل الملغي</span><input type="number" className="h-10 w-full rounded-xl border bg-secondary/65 px-3" value={cancelledAdjustment} onChange={(event) => updateEmployeeAdjustment(id, { cancelledAdjustment: Number(event.target.value) })} /></label>
                  </div>
                  <label className="block text-xs"><span className="mb-1 block text-muted-foreground">سبب التعديل</span><input className="h-10 w-full rounded-xl border bg-secondary/65 px-3" value={adjustment.adjustmentReason || ""} onChange={(event) => updateEmployeeAdjustment(id, { adjustmentReason: event.target.value })} placeholder="اختياري" /></label>
                  <div className="flex items-center justify-between rounded-xl bg-secondary/30 px-3 py-2 text-xs"><span>بعد التعديل</span><strong>{Math.max(0, employee.confirmed + confirmedAdjustment)} مؤكد · {Math.max(0, employee.cancelled + cancelledAdjustment)} ملغي</strong></div>
                </article>
              );
            })}
          </div>
          {!shownEmployees.length ? <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">لا توجد بيانات موظفين.</div> : null}
        </section>
      ) : null}

      {activeTab === "requests" ? (
        <section className="page-surface grid gap-3 md:grid-cols-2">
          {requests.map((request) => (
            <article key={request.id} className="compact-card flex items-center justify-between gap-3">
              <div className="min-w-0"><p className="truncate font-bold">{request.requestNo} · {request.guestName}</p><p className="truncate text-xs text-muted-foreground">{request.brand} · {request.branchName} · {request.guestPhone}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{request.reason}</p></div>
              <button className="h-9 shrink-0 rounded-xl border border-primary/15 px-3 text-xs" onClick={async () => { await api.updateContactRequestStatus(request.id, request.status === "new" ? "done" : "new"); setRequests((current) => current.map((item) => item.id === request.id ? { ...item, status: item.status === "new" ? "done" : "new" } : item)); }}>{request.status === "new" ? "إكمال" : "إعادة فتح"}</button>
            </article>
          ))}
          {!requests.length ? <p className="text-sm text-muted-foreground">لا توجد طلبات حاليًا.</p> : null}
        </section>
      ) : null}

      {activeTab === "users" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <form className="page-surface space-y-3" onSubmit={async (event) => { event.preventDefault(); try { await api.createUser(username, password, role); const data = await api.getUsers(); setUsers(data.users || []); setUsername(""); setPassword(""); setMessage("تمت إضافة المستخدم."); } catch (error) { setMessage(error instanceof Error ? error.message : "تعذر إضافة المستخدم."); } }}>
            <h2 className="section-title"><UserPlus className="ml-1 inline h-4 w-4" /> إضافة مستخدم</h2>
            <label className="block text-xs"><span className="mb-1 block text-muted-foreground">اسم المستخدم</span><input required className="h-11 w-full rounded-xl border bg-secondary/65 px-3" dir="ltr" value={username} onChange={(event) => setUsername(event.target.value)} /></label>
            <label className="block text-xs"><span className="mb-1 block text-muted-foreground">كلمة المرور</span><input required className="h-11 w-full rounded-xl border bg-secondary/65 px-3" dir="ltr" type="password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} /><small className="mt-1 block text-muted-foreground">12 حرفًا على الأقل.</small></label>
            <label className="block text-xs"><span className="mb-1 block text-muted-foreground">الدور</span><select className="h-11 w-full rounded-xl border bg-secondary/65 px-3" value={role} onChange={(event) => setRole(event.target.value as UserRole)}><option value="viewer">مشاهد داخلي</option><option value="editor">محرر بيانات</option><option value="admin">مشرف</option><option value="superadmin">مدير النظام</option></select></label>
            <button className="h-11 rounded-xl gold-gradient px-4 font-bold text-primary-foreground">حفظ المستخدم</button>
          </form>
          <section className="page-surface space-y-2">
            <h2 className="section-title">الحسابات الحالية</h2>
            {users.map((user) => <div className="flex items-center justify-between gap-2 border-b border-border/20 py-2 last:border-0" key={user.username}><div><p className="font-bold">{user.username}</p><p className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</p></div><button disabled={user.username === session?.username} className="text-xs text-destructive disabled:cursor-not-allowed disabled:opacity-30" onClick={async () => { await api.deleteUser(user.username); setUsers((current) => current.filter((item) => item.username !== user.username)); }}>حذف</button></div>)}
          </section>
        </div>
      ) : null}

      {activeTab === "settings" ? (
        <section className="page-surface space-y-4">
          <div><h2 className="section-title">إعدادات الموقع والتقارير</h2><p className="mt-1 text-xs text-muted-foreground">لا تتضمن هذه الصفحة إعدادات الموظفين؛ لها قسم مستقل.</p></div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs"><span className="mb-1 block text-muted-foreground">عنوان الموقع</span><input className="h-11 w-full rounded-xl border bg-secondary/65 px-3" value={siteTitle} onChange={(event) => setSiteTitle(event.target.value)} /></label>
            <label className="text-xs"><span className="mb-1 block text-muted-foreground">الشريط العلوي</span><input className="h-11 w-full rounded-xl border bg-secondary/65 px-3" value={bannerText} onChange={(event) => setBannerText(event.target.value)} /></label>
            <label className="text-xs"><span className="mb-1 block text-muted-foreground">شهر التقرير</span><input className="h-11 w-full rounded-xl border bg-secondary/65 px-3" value={reportMonth} onChange={(event) => setReportMonth(event.target.value)} /></label>
            <label className="text-xs"><span className="mb-1 block text-muted-foreground">سنة التقرير</span><input className="h-11 w-full rounded-xl border bg-secondary/65 px-3" dir="ltr" value={reportYear} onChange={(event) => setReportYear(event.target.value)} /></label>
            <label className="text-xs"><span className="mb-1 block text-muted-foreground">بريد تنبيهات الشكاوى</span><input className="h-11 w-full rounded-xl border bg-secondary/65 px-3" dir="ltr" value={complaintEmail} onChange={(event) => setComplaintEmail(event.target.value)} /></label>
            <label className="text-xs"><span className="mb-1 block text-muted-foreground">رقم واتساب</span><input className="h-11 w-full rounded-xl border bg-secondary/65 px-3" dir="ltr" value={complaintWhatsappNumber} onChange={(event) => setComplaintWhatsappNumber(event.target.value)} /></label>
            <label className="text-xs md:col-span-2"><span className="mb-1 block text-muted-foreground">رابط تنبيهات الشكاوى</span><input className="h-11 w-full rounded-xl border bg-secondary/65 px-3" dir="ltr" value={complaintEmailWebhook} onChange={(event) => setComplaintEmailWebhook(event.target.value)} /></label>
          </div>
          <button className="inline-flex h-11 items-center gap-2 rounded-xl gold-gradient px-4 font-bold text-primary-foreground" onClick={async () => { try { await api.updateSettings({ siteTitle, bannerText, reportMonth, reportYear, complaintEmail, complaintEmailWebhook, complaintWhatsappNumber }); await loadPublicReport(); setMessage("تم حفظ الإعدادات."); } catch { setMessage("تعذر حفظ الإعدادات."); } }}><Download className="h-4 w-4" /> حفظ الإعدادات</button>
        </section>
      ) : null}

      {activeTab === "profile" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="page-surface space-y-3"><h2 className="section-title">معلومات الحساب</h2><div className="compact-card"><p className="text-xs text-muted-foreground">اسم المستخدم</p><p className="mt-1 font-bold">{session?.username}</p></div><div className="compact-card"><p className="text-xs text-muted-foreground">الدور</p><p className="mt-1 font-bold">{ROLE_LABELS[(session?.role as UserRole) || "viewer"]}</p></div></section>
          <form className="page-surface space-y-3" onSubmit={async (event) => { event.preventDefault(); if (newPassword !== confirmPassword) { setMessage("كلمتا المرور غير متطابقتين."); return; } if (newPassword.length < 12) { setMessage("كلمة المرور الجديدة يجب أن تكون 12 حرفًا على الأقل."); return; } try { await api.changePassword(currentPassword, newPassword); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setMessage("تم تغيير كلمة المرور."); } catch (error) { setMessage(error instanceof Error ? error.message : "تعذر تغيير كلمة المرور."); } }}>
            <h2 className="section-title">تغيير كلمة المرور</h2>
            <input required className="h-11 w-full rounded-xl border bg-secondary/65 px-3" dir="ltr" type="password" placeholder="كلمة المرور الحالية" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
            <input required className="h-11 w-full rounded-xl border bg-secondary/65 px-3" dir="ltr" type="password" minLength={12} placeholder="كلمة المرور الجديدة" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            <input required className="h-11 w-full rounded-xl border bg-secondary/65 px-3" dir="ltr" type="password" placeholder="تأكيد كلمة المرور" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            <button className="h-11 rounded-xl gold-gradient px-4 font-bold text-primary-foreground">حفظ كلمة المرور</button>
          </form>
        </div>
      ) : null}
    </div>
  );
};

export default AdminDashboard;
