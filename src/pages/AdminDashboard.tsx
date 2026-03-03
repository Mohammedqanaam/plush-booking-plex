import { useState, useEffect, useRef } from "react";
import { Upload, Settings, LogOut, UserPlus, Edit3, Shield, Trash2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAdminSession, clearAdminSession, hasPermission, type UserRole } from "@/lib/adminAuth";
import { api } from "@/lib/api";
import EnterpriseControlCenter from "@/components/admin/EnterpriseControlCenter";

type User = { username: string; role: UserRole };
type Employee = { id: string; name: string; department: string; phone: string; active: boolean };

const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: "مدير عام",
  admin: "مسؤول",
  editor: "محرر",
  viewer: "مشاهد",
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const session = getAdminSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("viewer");
  const [message, setMessage] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [siteTitle, setSiteTitle] = useState("");
  const [bannerText, setBannerText] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"upload" | "users" | "settings">("upload");

  useEffect(() => {
    loadUsers();
    loadSettings();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data.users || []);
    } catch {
      setUsers([]);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSiteTitle(data.siteTitle || "");
      setBannerText(data.bannerText || "");
      setEmployees(data.enterprise?.employees || []);
    } catch {
      setEmployees([]);
    }
  };

  const checkPermission = (action: string): boolean => {
    if (!session) return false;
    return hasPermission(session.role as UserRole, action);
  };

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!checkPermission("manage_users")) return setMessage("صلاحية مرفوضة - Permission Denied");
    try {
      await api.createUser(username.trim(), password.trim(), selectedRole);
      setMessage("تمت إضافة المستخدم بنجاح.");
      setUsername("");
      setPassword("");
      setSelectedRole("viewer");
      await loadUsers();
    } catch (err: any) {
      setMessage(err.message || "تعذر إضافة المستخدم.");
    }
  };

  const handleDeleteUser = async (targetUsername: string) => {
    if (!checkPermission("delete_users")) return setMessage("صلاحية مرفوضة - Permission Denied");
    try {
      await api.deleteUser(targetUsername);
      setMessage(`تم حذف المستخدم ${targetUsername}.`);
      await loadUsers();
    } catch {
      setMessage("تعذر حذف المستخدم.");
    }
  };

  const handleUploadCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!checkPermission("upload")) return setUploadMessage("صلاحية مرفوضة - Permission Denied");
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage(null);
    try {
      const text = await file.text();
      const result = await api.uploadBookings(text);
      setUploadMessage(`تم رفع ${result.stats?.total || 0} حجز بنجاح. مؤكد: ${result.stats?.confirmed || 0} | ملغي: ${result.stats?.cancelled || 0} | نسبة الإلغاء: ${result.stats?.cancelRate || 0}%`);
    } catch {
      setUploadMessage("فشل رفع الملف. تأكد من صيغة CSV.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveSettings = async () => {
    if (!checkPermission("edit_settings")) return setSettingsMessage("صلاحية مرفوضة - Permission Denied");
    try {
      await api.updateSettings({ siteTitle, bannerText, enterprise: { employees } });
      setSettingsMessage("تم حفظ الإعدادات والموظفين بنجاح.");
      await loadSettings();
    } catch {
      setSettingsMessage("فشل حفظ الإعدادات.");
    }
  };

  const addEmployee = () => {
    setEmployees((prev) => [...prev, { id: crypto.randomUUID(), name: "", department: "", phone: "", active: true }]);
  };

  const handleLogout = async () => {
    await api.logout();
    clearAdminSession();
    navigate("/");
  };

  const tabs = [
    { id: "upload" as const, label: "رفع البيانات", icon: Upload, permission: "upload" },
    { id: "users" as const, label: "إدارة المستخدمين", icon: Users, permission: "manage_users" },
    { id: "settings" as const, label: "الإعدادات", icon: Settings, permission: "edit_settings" },
  ];

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">لوحة الإدارة</h2>
          <p className="text-muted-foreground text-sm">مرحباً {session?.username || "مسؤول"} ({ROLE_LABELS[(session?.role as UserRole) || "viewer"]})</p>
        </div>
        <button onClick={handleLogout} className="h-10 px-4 rounded-lg border border-border text-sm flex items-center gap-2 hover:bg-secondary transition">
          <LogOut className="w-4 h-4" /> تسجيل الخروج
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {tabs.filter((tab) => checkPermission(tab.permission)).map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition ${activeTab === tab.id ? "gold-gradient text-primary-foreground" : "glass-card hover:bg-secondary/70"}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "upload" && (
        <div className="glass-card p-5 space-y-3">
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleUploadCSV} className="w-full text-sm" />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="px-4 py-2 rounded-lg bg-secondary">{uploading ? "جاري الرفع..." : "اختيار ملف CSV"}</button>
          {uploadMessage && <p className="text-xs text-muted-foreground">{uploadMessage}</p>}
        </div>
      )}

      {activeTab === "users" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-3"><UserPlus className="w-5 h-5 text-primary" /><h3 className="text-sm font-semibold">إضافة مستخدم جديد</h3></div>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <input type="text" placeholder="اسم المستخدم" dir="ltr" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full h-11 px-4 rounded-lg bg-secondary border border-border text-sm" />
              <input type="password" placeholder="كلمة المرور" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-11 px-4 rounded-lg bg-secondary border border-border text-sm" />
              <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as UserRole)} className="w-full h-11 px-4 rounded-lg bg-secondary border border-border text-sm">
                <option value="viewer">مشاهد (Viewer)</option><option value="editor">محرر (Editor)</option><option value="admin">مسؤول (Admin)</option><option value="superadmin">مدير عام (Superadmin)</option>
              </select>
              <button type="submit" className="w-full h-11 rounded-lg gold-gradient text-primary-foreground font-semibold text-sm">إضافة المستخدم</button>
            </form>
            {message && <p className="text-xs text-muted-foreground">{message}</p>}
          </div>

          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center gap-3"><Shield className="w-5 h-5 text-primary" /><h3 className="text-sm font-semibold">المستخدمين المسجلين</h3></div>
            {users.map((user) => (
              <div key={user.username} className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
                <div>{user.username} <span className="text-xs text-muted-foreground">({ROLE_LABELS[user.role]})</span></div>
                {checkPermission("delete_users") && user.username !== "admin" && user.username !== session?.username && (
                  <button onClick={() => handleDeleteUser(user.username)} className="text-destructive p-1"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-3"><Edit3 className="w-5 h-5 text-primary" /><h3 className="text-sm font-semibold">إعدادات الموقع والأقسام</h3></div>
          <input type="text" placeholder="عنوان الموقع" dir="ltr" value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} className="w-full h-11 px-4 rounded-lg bg-secondary border border-border text-sm" />
          <input type="text" placeholder="نص البانر العلوي" value={bannerText} onChange={(e) => setBannerText(e.target.value)} className="w-full h-11 px-4 rounded-lg bg-secondary border border-border text-sm" />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">دليل الموظفين (متزامن مع الرئيسية/الخصومات/الشكاوى)</h4>
              <button className="px-3 py-1 rounded bg-secondary text-xs" onClick={addEmployee}>إضافة موظف</button>
            </div>
            {employees.map((employee) => (
              <div key={employee.id} className="grid md:grid-cols-5 gap-2">
                <input className="bg-secondary rounded-lg p-2" placeholder="الاسم" value={employee.name} onChange={(e) => setEmployees((prev) => prev.map((item) => item.id === employee.id ? { ...item, name: e.target.value } : item))} />
                <input className="bg-secondary rounded-lg p-2" placeholder="القسم" value={employee.department} onChange={(e) => setEmployees((prev) => prev.map((item) => item.id === employee.id ? { ...item, department: e.target.value } : item))} />
                <input className="bg-secondary rounded-lg p-2" placeholder="الهاتف" value={employee.phone} onChange={(e) => setEmployees((prev) => prev.map((item) => item.id === employee.id ? { ...item, phone: e.target.value } : item))} />
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={employee.active} onChange={(e) => setEmployees((prev) => prev.map((item) => item.id === employee.id ? { ...item, active: e.target.checked } : item))} /> مفعّل</label>
                <button className="px-3 py-2 rounded bg-secondary" onClick={() => setEmployees((prev) => prev.filter((item) => item.id !== employee.id))}>حذف</button>
              </div>
            ))}
          </div>

          <button onClick={handleSaveSettings} className="w-full h-11 rounded-lg gold-gradient text-primary-foreground font-semibold text-sm">حفظ جميع الأقسام</button>
          {settingsMessage && <p className="text-xs text-muted-foreground">{settingsMessage}</p>}
          <EnterpriseControlCenter />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
