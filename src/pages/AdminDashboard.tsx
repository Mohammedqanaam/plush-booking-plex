import { useState, useEffect, useRef } from "react";
import {
  Upload,
  Settings,
  LogOut,
  UserPlus,
  FileText,
  Edit3,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getAdminSession,
  clearAdminSession,
  hasPermission,
  type UserRole,
} from "@/lib/adminAuth";
import { api } from "@/lib/api";

type User = {
  username: string;
  role: UserRole;
};

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
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"upload" | "users" | "settings">(
    "upload"
  );

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
    } catch {}
  };

  const checkPermission = (action: string): boolean => {
    if (!session) return false;
    return hasPermission(session.role as UserRole, action);
  };

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!checkPermission("manage_users")) {
      setMessage("صلاحية مرفوضة - Permission Denied");
      return;
    }
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
    if (!checkPermission("delete_users")) {
      setMessage("صلاحية مرفوضة - Permission Denied");
      return;
    }
    try {
      await api.deleteUser(targetUsername);
      setMessage(`تم حذف المستخدم ${targetUsername}.`);
      await loadUsers();
    } catch {
      setMessage("تعذر حذف المستخدم.");
    }
  };

  const handleUploadCSV = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!checkPermission("upload")) {
      setUploadMessage("صلاحية مرفوضة - Permission Denied");
      return;
    }
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage(null);

    try {
      const text = await file.text();
      const result = await api.uploadBookings(text);
      setUploadMessage(
        `تم رفع ${result.stats?.total || 0} حجز بنجاح. مؤكد: ${result.stats?.confirmed || 0} | ملغي: ${result.stats?.cancelled || 0} | نسبة الإلغاء: ${result.stats?.cancelRate || 0}%`
      );
    } catch {
      setUploadMessage("فشل رفع الملف. تأكد من صيغة CSV.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveSettings = async () => {
    if (!checkPermission("edit_settings")) {
      setSettingsMessage("صلاحية مرفوضة - Permission Denied");
      return;
    }
    try {
      await api.updateSettings({ siteTitle, bannerText });
      setSettingsMessage("تم حفظ الإعدادات بنجاح.");
    } catch {
      setSettingsMessage("فشل حفظ الإعدادات.");
    }
  };

  const handleLogout = async () => {
    await api.logout();
    clearAdminSession();
    navigate("/");
  };

  const tabs = [
    {
      id: "upload" as const,
      label: "رفع البيانات",
      icon: Upload,
      permission: "upload",
    },
    {
      id: "users" as const,
      label: "إدارة المستخدمين",
      icon: Users,
      permission: "manage_users",
    },
    {
      id: "settings" as const,
      label: "الإعدادات",
      icon: Settings,
      permission: "edit_settings",
    },
  ];

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">لوحة الإدارة</h2>
          <p className="text-muted-foreground text-sm">
            مرحباً {session?.username || "مسؤول"} (
            {ROLE_LABELS[(session?.role as UserRole) || "viewer"] ||
              session?.role}
            )
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="h-10 px-4 rounded-lg border border-border text-sm flex items-center gap-2 hover:bg-secondary transition"
        >
          <LogOut className="w-4 h-4" />
          تسجيل الخروج
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          const permitted = checkPermission(tab.permission);
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (!permitted) {
                  setMessage("صلاحية مرفوضة - Permission Denied");
                  return;
                }
                setActiveTab(tab.id);
                setMessage(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "gold-gradient text-primary-foreground"
                  : permitted
                    ? "glass-card hover:bg-secondary"
                    : "glass-card opacity-50 cursor-not-allowed"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Permission denied message */}
      {message && (
        <p className="text-xs text-muted-foreground glass-card p-3">
          {message}
        </p>
      )}

      {/* Upload Tab */}
      {activeTab === "upload" && (
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">
                رفع بيانات الحجوزات (CSV)
              </h3>
              <p className="text-xs text-muted-foreground">
                رفع ملف CSV لتحليل وحساب الإحصائيات تلقائياً
              </p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground glass-card p-3 space-y-1">
            <p className="font-semibold text-foreground">
              حالات الحجز المدعومة:
            </p>
            <p>N, M, Confirmed = مؤكد</p>
            <p>C = ملغي | NS = لم يحضر (ملغي)</p>
            <p>أي حالة أخرى = غير مؤكد</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleUploadCSV}
            className="hidden"
            id="csv-upload"
          />
          <button
            onClick={() => {
              if (!checkPermission("upload")) {
                setUploadMessage("صلاحية مرفوضة - Permission Denied");
                return;
              }
              fileInputRef.current?.click();
            }}
            disabled={uploading}
            className="w-full h-11 rounded-lg gold-gradient text-primary-foreground font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {uploading ? "جاري الرفع..." : "اختيار ملف CSV"}
          </button>

          {uploadMessage && (
            <p className="text-xs text-muted-foreground">{uploadMessage}</p>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Add User Form */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">إضافة مستخدم جديد</h3>
                <p className="text-xs text-muted-foreground">
                  إضافة مستخدم مع تحديد الصلاحية
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <input
                type="text"
                placeholder="اسم المستخدم"
                dir="ltr"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-11 px-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm"
              />
              <input
                type="password"
                placeholder="كلمة المرور"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm"
              />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full h-11 px-4 rounded-lg bg-secondary border border-border text-foreground text-sm"
              >
                <option value="viewer">مشاهد (Viewer)</option>
                <option value="editor">محرر (Editor)</option>
                <option value="admin">مسؤول (Admin)</option>
                <option value="superadmin">مدير عام (Superadmin)</option>
              </select>
              <button
                type="submit"
                className="w-full h-11 rounded-lg gold-gradient text-primary-foreground font-semibold text-sm"
              >
                إضافة المستخدم
              </button>
            </form>
          </div>

          {/* Users List */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">المستخدمين المسجلين</h3>
                <p className="text-xs text-muted-foreground">
                  إجمالي: {users.length}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.username}
                  className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0"
                >
                  <div>
                    <span>{user.username}</span>
                    <span className="text-xs text-muted-foreground mr-2">
                      ({ROLE_LABELS[user.role] || user.role})
                    </span>
                  </div>
                  {checkPermission("delete_users") &&
                    user.username !== "admin" &&
                    user.username !== session?.username && (
                      <button
                        onClick={() => handleDeleteUser(user.username)}
                        className="text-destructive hover:text-destructive/80 transition p-1"
                        title="حذف المستخدم"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">إعدادات الموقع</h3>
              <p className="text-xs text-muted-foreground">
                تعديل عنوان الموقع ونص البانر
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                عنوان الموقع
              </label>
              <input
                type="text"
                placeholder="Worm-AI"
                dir="ltr"
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                className="w-full h-11 px-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                نص البانر
              </label>
              <input
                type="text"
                placeholder="نص البانر العلوي"
                value={bannerText}
                onChange={(e) => setBannerText(e.target.value)}
                className="w-full h-11 px-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm"
              />
            </div>
            <button
              onClick={handleSaveSettings}
              className="w-full h-11 rounded-lg gold-gradient text-primary-foreground font-semibold text-sm"
            >
              حفظ الإعدادات
            </button>
          </div>

          {settingsMessage && (
            <p className="text-xs text-muted-foreground">{settingsMessage}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
