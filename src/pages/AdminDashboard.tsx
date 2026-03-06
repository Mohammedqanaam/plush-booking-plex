import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileText, LogOut, MessageSquareMore, Settings, Upload, UserPlus, Users } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, type ContactRequest } from "@/lib/api";
import { clearAdminSession, getAdminSession, hasPermission, type UserRole } from "@/lib/adminAuth";

type User = { username: string; role: UserRole };
type AdminTab = "upload" | "users" | "settings" | "requests";

const ROLE_LABELS: Record<UserRole, string> = { superadmin: "مدير عام", admin: "مسؤول", editor: "محرر", viewer: "مشاهد" };

const AdminDashboard = () => {
  const session = getAdminSession();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<AdminTab>("upload");
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("viewer");
  const [siteTitle, setSiteTitle] = useState("Worm-AI");
  const [bannerText, setBannerText] = useState("");
  const [reportMonth, setReportMonth] = useState("");
  const [reportYear, setReportYear] = useState("");
  const [hiddenEmployees, setHiddenEmployees] = useState("");
  const [complaintEmail, setComplaintEmail] = useState("");
  const [complaintEmailWebhook, setComplaintEmailWebhook] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const tabs = useMemo(
    () => [
      { id: "upload" as const, label: "رفع CSV", icon: Upload, perm: "upload" },
      { id: "users" as const, label: "المستخدمون", icon: Users, perm: "manage_users" },
      { id: "settings" as const, label: "الإعدادات", icon: Settings, perm: "edit_settings" },
      { id: "requests" as const, label: "طلبات التواصل", icon: MessageSquareMore, perm: "view" },
    ],
    [],
  );

  useEffect(() => {
    const tab = (searchParams.get("tab") || "upload") as AdminTab;
    if (["upload", "users", "settings", "requests"].includes(tab)) setActiveTab(tab);
    else setSearchParams({ tab: "upload" }, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    api.getUsers().then((d) => setUsers(d.users || [])).catch(() => setUsers([]));
    api.getSettings().then((s) => {
      setSiteTitle(s.siteTitle || "Worm-AI");
      setBannerText(s.bannerText || "");
      setReportMonth(s.reportMonth || "");
      setReportYear(s.reportYear || "");
      setHiddenEmployees((s.hiddenEmployees || []).join(", "));
      setComplaintEmail(s.complaintEmail || "");
      setComplaintEmailWebhook(s.complaintEmailWebhook || "");
    });
  }, []);

  useEffect(() => {
    if (activeTab !== "requests") return;
    const load = () => api.getContactRequests().then((d) => setRequests(d.requests || [])).catch(() => setRequests([]));
    load();
    const timer = window.setInterval(load, 12000);
    return () => window.clearInterval(timer);
  }, [activeTab]);

  const can = (perm: string) => !!session && hasPermission(session.role, perm);

  const setTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">لوحة الإدارة</h2>
        <button className="h-10 px-4 rounded-lg border" onClick={async () => { await api.logout(); clearAdminSession(); navigate("/"); }}>
          <LogOut className="inline w-4 h-4" /> تسجيل الخروج
        </button>
      </div>
      <p className="text-xs text-muted-foreground">مرحباً {session?.username} ({ROLE_LABELS[(session?.role as UserRole) || "viewer"]})</p>

      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => (can(tab.perm) ? setTab(tab.id) : setMessage("ليست لديك صلاحية"))} className={`px-3 py-2 rounded-lg text-sm ${activeTab === tab.id ? "gold-gradient text-primary-foreground" : "glass-card"}`}>
            <tab.icon className="inline w-4 h-4 ms-1" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "upload" && (
        <div className="glass-card p-4 space-y-3">
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try { const data = await api.uploadBookings(await file.text()); setMessage(`تم رفع ${data.stats?.total || 0} سجل`); } catch { setMessage("فشل رفع الملف"); }
          }} />
          <button className="h-11 px-4 rounded-lg gold-gradient text-primary-foreground" onClick={() => fileInputRef.current?.click()}><FileText className="inline w-4 h-4" /> اختيار ملف CSV</button>
          <button className="h-11 px-4 rounded-lg border border-destructive/30" onClick={async () => { try { await api.resetBookings(); setMessage("تم تصفير البيانات"); } catch { setMessage("تعذر التصفير"); } }}>تصفير البيانات</button>
          <button className="h-11 px-4 rounded-lg border" onClick={() => navigate("/admin/complaints")}>إدارة الشكاوى</button>
          <button className="h-11 px-4 rounded-lg border" onClick={() => navigate("/admin/discounts")}>إدارة الخصومات</button>
        </div>
      )}

      {activeTab === "users" && (
        <div className="grid md:grid-cols-2 gap-4">
          <form className="glass-card p-4 space-y-2" onSubmit={async (e) => { e.preventDefault(); try { await api.createUser(username, password, role); setMessage("تمت الإضافة"); setUsername(""); setPassword(""); } catch { setMessage("تعذر إضافة المستخدم"); } }}>
            <h3 className="font-semibold"><UserPlus className="inline w-4 h-4" /> إضافة مستخدم</h3>
            <input className="w-full h-10 rounded-lg bg-secondary border px-3" dir="ltr" placeholder="اسم المستخدم" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input className="w-full h-10 rounded-lg bg-secondary border px-3" dir="ltr" type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} />
            <select className="w-full h-10 rounded-lg bg-secondary border px-3" value={role} onChange={(e) => setRole(e.target.value as UserRole)}><option value="viewer">مشاهد</option><option value="editor">محرر</option><option value="admin">مسؤول</option><option value="superadmin">مدير عام</option></select>
            <button className="h-10 px-4 rounded-lg gold-gradient text-primary-foreground">حفظ</button>
          </form>
          <div className="glass-card p-4 space-y-2">{users.map((u) => <div className="flex justify-between border-b pb-2" key={u.username}><span>{u.username} ({ROLE_LABELS[u.role]})</span><button onClick={async () => { await api.deleteUser(u.username); setUsers((prev) => prev.filter((x) => x.username !== u.username)); }}>حذف</button></div>)}</div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="glass-card p-4 grid md:grid-cols-2 gap-3">
          <input className="h-10 rounded-lg bg-secondary border px-3" value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} placeholder="عنوان الموقع" />
          <input className="h-10 rounded-lg bg-secondary border px-3" value={bannerText} onChange={(e) => setBannerText(e.target.value)} placeholder="نص الشريط العلوي" />
          <input className="h-10 rounded-lg bg-secondary border px-3" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)} placeholder="فلتر الشهر" />
          <input className="h-10 rounded-lg bg-secondary border px-3" value={reportYear} onChange={(e) => setReportYear(e.target.value)} placeholder="فلتر السنة" dir="ltr" />
          <input className="h-10 rounded-lg bg-secondary border px-3 md:col-span-2" value={hiddenEmployees} onChange={(e) => setHiddenEmployees(e.target.value)} placeholder="الموظفون المخفيون (مفصولين بفاصلة)" />
          <input className="h-10 rounded-lg bg-secondary border px-3" value={complaintEmail} onChange={(e) => setComplaintEmail(e.target.value)} placeholder="بريد تنبيهات الشكاوى" dir="ltr" />
          <input className="h-10 rounded-lg bg-secondary border px-3" value={complaintEmailWebhook} onChange={(e) => setComplaintEmailWebhook(e.target.value)} placeholder="رابط Webhook للشكاوى" dir="ltr" />
          <button className="h-10 rounded-lg gold-gradient text-primary-foreground md:col-span-2" onClick={async () => {
            await api.updateSettings({ siteTitle, bannerText, reportMonth, reportYear, hiddenEmployees: hiddenEmployees.split(",").map((x) => x.trim()).filter(Boolean), complaintEmail, complaintEmailWebhook });
            setMessage("تم حفظ الإعدادات");
          }}><Download className="inline w-4 h-4" /> حفظ الإعدادات</button>
        </div>
      )}

      {activeTab === "requests" && <div className="glass-card p-4 space-y-2">{requests.map((r) => <div key={r.id} className="border-b pb-2"><div>{r.customerName} - {r.branchName}</div><div className="text-xs">{r.phone}</div></div>)}</div>}
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
};

export default AdminDashboard;
