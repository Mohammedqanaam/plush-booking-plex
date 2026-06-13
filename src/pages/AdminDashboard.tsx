import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileText, LogOut, MessageSquareMore, Settings, Upload, User, UserPlus, Users } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, type ContactRequest } from "@/lib/api";
import { isEmployeeHidden, normalizeHiddenEmployees, parseHiddenEmployeesInput } from "@/lib/employeeVisibility";
import { clearAdminSession, getAdminSession, hasPermission, type UserRole } from "@/lib/adminAuth";
import { processBookings } from "@/lib/bookingProcessor";
import PageHeader from "@/components/PageHeader";

type User = { username: string; role: UserRole };
type EmployeeStat = { agent: string; confirmed: number; cancelled: number; total: number; cancelRate: number };
type AdminTab = "upload" | "users" | "employees" | "settings" | "requests" | "profile";

const ROLE_LABELS: Record<UserRole, string> = { superadmin: "مدير عام", admin: "مسؤول", editor: "محرر", viewer: "مشاهد" };

const AdminDashboard = () => {
  const session = getAdminSession();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<AdminTab>("upload");
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [employeeStats, setEmployeeStats] = useState<EmployeeStat[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("viewer");
  const [siteTitle, setSiteTitle] = useState("Res");
  const [bannerText, setBannerText] = useState("");
  const [reportMonth, setReportMonth] = useState("");
  const [reportYear, setReportYear] = useState("");
  const [hiddenEmployees, setHiddenEmployees] = useState("");
  const [complaintEmail, setComplaintEmail] = useState("");
  const [complaintEmailWebhook, setComplaintEmailWebhook] = useState("");
  const [complaintWhatsappNumber, setComplaintWhatsappNumber] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const hiddenEmployeesList = useMemo(() => parseHiddenEmployeesInput(hiddenEmployees), [hiddenEmployees]);

  const tabs = useMemo(
    () => [
      { id: "upload" as const, label: "رفع CSV", icon: Upload, perm: "upload" },
      { id: "users" as const, label: "المستخدمون", icon: Users, perm: "manage_users" },
      { id: "employees" as const, label: "الموظفون", icon: Users, perm: "edit_settings" },
      { id: "settings" as const, label: "الإعدادات", icon: Settings, perm: "edit_settings" },
      { id: "requests" as const, label: "طلبات التواصل", icon: MessageSquareMore, perm: "view" },
      { id: "profile" as const, label: "الملف الشخصي", icon: User, perm: "view" },
    ],
    [],
  );

  useEffect(() => {
    const tab = (searchParams.get("tab") || "upload") as AdminTab;
    if (["upload", "users", "employees", "settings", "requests", "profile"].includes(tab)) setActiveTab(tab);
    else setSearchParams({ tab: "upload" }, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    api.getUsers().then((d) => setUsers(d.users || [])).catch(() => setUsers([]));
    api.getSettings().then((s) => {
      setSiteTitle(s.siteTitle || "Res");
      setBannerText(s.bannerText || "");
      setReportMonth(s.reportMonth || "");
      setReportYear(s.reportYear || "");
      setHiddenEmployees(normalizeHiddenEmployees(s.hiddenEmployees || []).join(", "));
      setComplaintEmail(s.complaintEmail || "");
      setComplaintEmailWebhook(s.complaintEmailWebhook || "");
      setComplaintWhatsappNumber(s.complaintWhatsappNumber || "");
    });
  }, []);

  useEffect(() => {
    if (activeTab !== "requests") return;
    const load = () => api.getContactRequests().then((d) => setRequests(d.requests || [])).catch(() => setRequests([]));
    load();
    const timer = window.setInterval(load, 12000);
    return () => window.clearInterval(timer);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "employees") return;
    api.getBookings().then((d) => {
      const rows = Array.isArray(d.bookings) ? d.bookings : [];
      setEmployeeStats(processBookings(rows));
    }).catch(() => setEmployeeStats([]));
  }, [activeTab]);

  const can = (perm: string) => !!session && hasPermission(session.role, perm);

  const setTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="page-wrap">
      <PageHeader
        title="لوحة الإدارة"
        subtitle="إدارة مختصرة للمستخدمين والبيانات والإعدادات."
        icon={Settings}
        actions={<button className="h-10 px-4 rounded-xl border border-primary/18 bg-secondary/40 shrink-0 inline-flex items-center gap-2" onClick={async () => { await api.logout(); clearAdminSession(); navigate("/"); }}><LogOut className="w-4 h-4" /> تسجيل الخروج</button>}
      />
      <p className="text-xs text-muted-foreground rounded-full border border-primary/15 bg-secondary/25 px-3 py-1 w-fit">{session?.username} · {ROLE_LABELS[(session?.role as UserRole) || "viewer"]}</p>

      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => (can(tab.perm) ? setTab(tab.id) : setMessage("ليست لديك صلاحية"))} className={`px-3 py-2 rounded-xl text-xs md:text-sm inline-flex items-center gap-2 border interactive whitespace-nowrap ${activeTab === tab.id ? "border-primary/50 bg-primary/15 text-primary" : "border-border/50 bg-secondary/35 hover:bg-secondary text-muted-foreground hover:text-foreground"}`}>
            <tab.icon className="inline w-4 h-4 ms-1" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "upload" && (
        <div className="page-surface space-y-2.5">
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try { const data = await api.uploadBookings(await file.text()); setMessage(`تم رفع ${data.stats?.total || 0} سجل`); } catch { setMessage("فشل رفع الملف"); }
          }} />
          <button className="h-11 px-4 rounded-xl gold-gradient text-primary-foreground" onClick={() => fileInputRef.current?.click()}><FileText className="inline w-4 h-4" /> اختيار ملف CSV</button>
          <button className="h-11 px-4 rounded-xl border border-destructive/30" onClick={async () => { try { await api.resetBookings(); setMessage("تم تصفير البيانات"); } catch { setMessage("تعذر التصفير"); } }}>تصفير البيانات</button>
          <button className="h-11 px-4 rounded-xl border" onClick={() => navigate("/admin/branches")}>إدارة الفروع</button>
          <button className="h-11 px-4 rounded-xl border" onClick={() => navigate("/admin/knowledge-bank")}>إدارة بنك المعلومات</button>
          <button className="h-11 px-4 rounded-xl border" onClick={() => navigate("/admin/complaints")}>إدارة الشكاوى</button>
          <button className="h-11 px-4 rounded-xl border" onClick={() => navigate("/admin/discounts")}>إدارة الخصومات</button>
        </div>
      )}

      {activeTab === "users" && (
        <div className="grid md:grid-cols-2 gap-4">
          <form className="page-surface space-y-2" onSubmit={async (e) => { e.preventDefault(); try { await api.createUser(username, password, role); setMessage("تمت الإضافة"); setUsername(""); setPassword(""); } catch { setMessage("تعذر إضافة المستخدم"); } }}>
            <h3 className="font-semibold"><UserPlus className="inline w-4 h-4" /> إضافة مستخدم</h3>
            <input className="w-full h-10 rounded-xl bg-secondary/65 border border-primary/15 px-3" dir="ltr" placeholder="اسم المستخدم" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input className="w-full h-10 rounded-xl bg-secondary/65 border border-primary/15 px-3" dir="ltr" type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} />
            <select className="w-full h-10 rounded-xl bg-secondary/65 border border-primary/15 px-3" value={role} onChange={(e) => setRole(e.target.value as UserRole)}><option value="viewer">مشاهد</option><option value="editor">محرر</option><option value="admin">مسؤول</option><option value="superadmin">مدير عام</option></select>
            <button className="h-10 px-4 rounded-xl gold-gradient text-primary-foreground">حفظ</button>
          </form>
          <div className="page-surface space-y-2">{users.map((u) => <div className="flex justify-between border-b border-border/50 pb-2" key={u.username}><span>{u.username} ({ROLE_LABELS[u.role]})</span><button className="text-destructive" onClick={async () => { await api.deleteUser(u.username); setUsers((prev) => prev.filter((x) => x.username !== u.username)); }}>حذف</button></div>)}</div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="page-surface grid md:grid-cols-2 gap-3">
          <input className="h-10 rounded-xl bg-secondary/65 border border-primary/15 px-3" value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} placeholder="عنوان الموقع" />
          <input className="h-10 rounded-xl bg-secondary/65 border border-primary/15 px-3" value={bannerText} onChange={(e) => setBannerText(e.target.value)} placeholder="نص الشريط العلوي" />
          <input className="h-10 rounded-xl bg-secondary/65 border border-primary/15 px-3" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)} placeholder="فلتر الشهر" />
          <input className="h-10 rounded-xl bg-secondary/65 border border-primary/15 px-3" value={reportYear} onChange={(e) => setReportYear(e.target.value)} placeholder="فلتر السنة" dir="ltr" />
          <input className="h-10 rounded-xl bg-secondary/65 border border-primary/15 px-3 md:col-span-2" value={hiddenEmployees} onChange={(e) => setHiddenEmployees(e.target.value)} placeholder="الموظفون المخفيون (مفصولين بفاصلة)" />
          <input className="h-10 rounded-xl bg-secondary/65 border border-primary/15 px-3" value={complaintEmail} onChange={(e) => setComplaintEmail(e.target.value)} placeholder="بريد تنبيهات الشكاوى" dir="ltr" />
          <input className="h-10 rounded-xl bg-secondary/65 border border-primary/15 px-3" value={complaintEmailWebhook} onChange={(e) => setComplaintEmailWebhook(e.target.value)} placeholder="رابط Webhook للشكاوى" dir="ltr" />
          <input className="h-10 rounded-xl bg-secondary/65 border border-primary/15 px-3 md:col-span-2" value={complaintWhatsappNumber} onChange={(e) => setComplaintWhatsappNumber(e.target.value)} placeholder="رقم واتساب استقبال الشكاوى (مثال: 9665XXXXXXXX)" dir="ltr" />
          <button className="h-10 rounded-xl gold-gradient text-primary-foreground md:col-span-2" onClick={async () => {
            await api.updateSettings({ siteTitle, bannerText, reportMonth, reportYear, hiddenEmployees: hiddenEmployeesList, complaintEmail, complaintEmailWebhook, complaintWhatsappNumber });
            setHiddenEmployees(hiddenEmployeesList.join(", "));
            setMessage("تم حفظ الإعدادات");
          }}><Download className="inline w-4 h-4" /> حفظ الإعدادات</button>
        </div>
      )}

      {activeTab === "employees" && (
        <div className="page-surface space-y-3">
          <div className="flex gap-2 flex-wrap">
            <input className="h-10 rounded-xl bg-secondary/65 border border-primary/15 px-3 flex-1 min-w-64" value={employeeSearch} onChange={(e) => setEmployeeSearch(e.target.value)} placeholder="بحث باسم الموظف" />
          </div>
          <div className="space-y-2 max-h-[480px] overflow-auto custom-scrollbar">
            {employeeStats
              .filter((e) => !employeeSearch.trim() || e.agent.toLowerCase().includes(employeeSearch.trim().toLowerCase()))
              .map((employee) => {
                const isHidden = isEmployeeHidden(employee.agent, hiddenEmployeesList);
                return <div className="compact-card flex items-center justify-between gap-2" key={employee.agent}>
                  <div>
                    <p className="font-semibold">{employee.agent}</p>
                    <p className="text-xs text-muted-foreground">مؤكد: {employee.confirmed} | ملغي: {employee.cancelled} | إجمالي: {employee.total}</p>
                  </div>
                  <button className="h-9 px-3 rounded border" onClick={() => {
                    const next = isHidden
                      ? hiddenEmployeesList.filter((name) => !isEmployeeHidden(name, [employee.agent]))
                      : normalizeHiddenEmployees([...hiddenEmployeesList, employee.agent]);
                    setHiddenEmployees(next.join(", "));
                  }}>{isHidden ? "إظهار" : "إخفاء"}</button>
                </div>;
              })}
          </div>
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <p className="text-xs text-muted-foreground">تحديث العرض محفوظ دون تغيير البيانات الأساسية.</p>
            <button className="h-10 px-4 rounded-xl gold-gradient text-primary-foreground" onClick={async () => {
              try {
                await api.updateSettings({ hiddenEmployees: hiddenEmployeesList });
                setHiddenEmployees(hiddenEmployeesList.join(", "));
                setMessage("تم حفظ حالة الإخفاء للموظفين");
              } catch {
                setMessage("تعذر حفظ حالة الإخفاء");
              }
            }}>حفظ حالة الإخفاء</button>
          </div>
        </div>
      )}

      {activeTab === "requests" && <div className="page-surface grid gap-2 md:grid-cols-2">{requests.map((r) => <div key={r.id} className="compact-card flex items-center justify-between gap-2"><div className="min-w-0"><div className="font-medium truncate">{r.requestNo} · {r.guestName}</div><div className="text-xs text-muted-foreground truncate">{r.brand} · {r.branchName} · {r.guestPhone}</div><div className="text-xs text-muted-foreground line-clamp-1">{r.reason}</div></div><button className="h-8 shrink-0 px-3 rounded-xl border border-primary/15" onClick={async ()=>{await api.updateContactRequestStatus(r.id, r.status === "new" ? "done" : "new"); setRequests((prev)=>prev.map((x)=>x.id===r.id ? {...x, status: x.status === "new" ? "done" : "new"} : x));}}>{r.status === "new" ? "مكتمل" : "جديد"}</button></div>)}</div>}

      {activeTab === "profile" && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="page-surface space-y-3">
            <h3 className="font-semibold"><User className="inline w-4 h-4 ms-1" /> معلومات الحساب</h3>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">اسم المستخدم</p>
              <p className="font-medium">{session?.username}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">الدور</p>
              <p className="font-medium">{ROLE_LABELS[(session?.role as UserRole) || "viewer"]}</p>
            </div>
          </div>
          <form className="page-surface space-y-2" onSubmit={async (e) => {
            e.preventDefault();
            if (newPassword !== confirmPassword) { setMessage("كلمتا المرور غير متطابقتين"); return; }
            if (newPassword.length < 8) { setMessage("كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل"); return; }
            try {
              await api.changePassword(currentPassword, newPassword);
              setMessage("تم تغيير كلمة المرور بنجاح");
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
            } catch (err) {
              setMessage(err instanceof Error ? err.message : "تعذر تغيير كلمة المرور");
            }
          }}>
            <h3 className="font-semibold">تغيير كلمة المرور</h3>
            <input className="w-full h-10 rounded-xl bg-secondary/65 border border-primary/15 px-3" dir="ltr" type="password" placeholder="كلمة المرور الحالية" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            <input className="w-full h-10 rounded-xl bg-secondary/65 border border-primary/15 px-3" dir="ltr" type="password" placeholder="كلمة المرور الجديدة" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <input className="w-full h-10 rounded-xl bg-secondary/65 border border-primary/15 px-3" dir="ltr" type="password" placeholder="تأكيد كلمة المرور الجديدة" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            <button type="submit" className="h-10 px-4 rounded-xl gold-gradient text-primary-foreground">حفظ</button>
          </form>
        </div>
      )}
      {message && <p className="text-xs rounded-xl border border-border/60 bg-secondary/35 p-3 text-muted-foreground">{message}</p>}
    </div>
  );
};

export default AdminDashboard;
