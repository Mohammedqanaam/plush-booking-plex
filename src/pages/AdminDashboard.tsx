import { useState, useEffect, useRef, useCallback } from "react";
import {
  LogOut,
  Upload,
  Users,
  Settings,
  UserPlus,
  BarChart3,
  MessageSquare,
  Trash2,
  CalendarCheck,
  CalendarX,
  Hotel,
  FileText,
  CheckCircle2,
  Clock,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getAdminSession,
  clearAdminSession,
  hasPermission,
  apiCall,
  roleLabels,
  type UserRole,
} from "@/lib/adminAuth";

type Tab = "dashboard" | "upload" | "users" | "contacts" | "settings";

type StatsData = {
  total: number;
  confirmed: number;
  cancelled: number;
  cancelRate: number;
  employees: Array<{
    name: string;
    total: number;
    confirmed: number;
    cancelled: number;
    cancelRate: number;
  }>;
} | null;

type UserInfo = { username: string; role: UserRole };

type ContactInfo = {
  id: string;
  branchName: string;
  customerName: string;
  phone: string;
  note: string;
  status: "new" | "done";
  createdAt: string;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const session = getAdminSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  // Dashboard state
  const [stats, setStats] = useState<StatsData>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // User management state
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("viewer");
  const [userMessage, setUserMessage] = useState<string | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);

  // Settings state
  const [siteTitle, setSiteTitle] = useState("");
  const [bannerText, setBannerText] = useState("");
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Contacts state
  const [contacts, setContacts] = useState<ContactInfo[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      setStats(data.stats);
    } catch {
      // Keep null stats
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!hasPermission(session?.role, "manage_users")) return;
    setUsersLoading(true);
    try {
      const res = await apiCall("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      // Keep empty
    } finally {
      setUsersLoading(false);
    }
  }, [session?.role]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setSiteTitle(data.settings?.siteTitle || "WORM-AI");
      setBannerText(data.settings?.bannerText || "");
    } catch {
      // Keep defaults
    }
  }, []);

  const fetchContacts = useCallback(async () => {
    if (!hasPermission(session?.role, "manage_contacts")) return;
    setContactsLoading(true);
    try {
      const res = await apiCall("/api/contacts");
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
      }
    } catch {
      // Keep empty
    } finally {
      setContactsLoading(false);
    }
  }, [session?.role]);

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchSettings();
    fetchContacts();
  }, [fetchStats, fetchUsers, fetchSettings, fetchContacts]);

  const handleLogout = () => {
    clearAdminSession();
    navigate("/");
  };

  const handleUploadCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!hasPermission(session?.role, "upload")) {
      setUploadMessage("Permission Denied");
      return;
    }

    setUploading(true);
    setUploadMessage(null);

    try {
      const text = await file.text();
      const res = await apiCall("/api/bookings", {
        method: "POST",
        body: JSON.stringify({ csv: text }),
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setUploadMessage(`تم رفع ${data.recordCount} سجل بنجاح.`);
      } else {
        const data = await res.json();
        setUploadMessage(
          data.error === "Permission denied"
            ? "Permission Denied"
            : `خطأ: ${data.error || "فشل في رفع البيانات."}`
        );
      }
    } catch {
      setUploadMessage("فشل في رفع البيانات. تحقق من الاتصال.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission(session?.role, "manage_users")) {
      setUserMessage("Permission Denied");
      return;
    }

    setUserMessage(null);
    try {
      const res = await apiCall("/api/users", {
        method: "POST",
        body: JSON.stringify({
          action: "add",
          username: newUsername,
          password: newPassword,
          role: newRole,
        }),
      });

      if (res.ok) {
        setUserMessage("تمت إضافة المستخدم بنجاح.");
        setNewUsername("");
        setNewPassword("");
        setNewRole("viewer");
        fetchUsers();
      } else {
        const data = await res.json();
        if (data.error === "Permission denied") {
          setUserMessage("Permission Denied");
        } else if (data.error === "Username already exists") {
          setUserMessage("اسم المستخدم موجود مسبقاً.");
        } else {
          setUserMessage(data.error || "فشل في إضافة المستخدم.");
        }
      }
    } catch {
      setUserMessage("فشل في إضافة المستخدم. تحقق من الاتصال.");
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!hasPermission(session?.role, "delete_users")) {
      setUserMessage("Permission Denied");
      return;
    }

    try {
      const res = await apiCall("/api/users", {
        method: "POST",
        body: JSON.stringify({ action: "delete", username }),
      });

      if (res.ok) {
        setUserMessage(`تم حذف المستخدم ${username}.`);
        fetchUsers();
      } else {
        const data = await res.json();
        setUserMessage(
          data.error === "Permission denied"
            ? "Permission Denied"
            : data.error || "فشل في حذف المستخدم."
        );
      }
    } catch {
      setUserMessage("فشل في حذف المستخدم.");
    }
  };

  const handleSaveSettings = async () => {
    if (!hasPermission(session?.role, "manage_settings")) {
      setSettingsMessage("Permission Denied");
      return;
    }

    setSettingsLoading(true);
    setSettingsMessage(null);

    try {
      const res = await apiCall("/api/settings", {
        method: "POST",
        body: JSON.stringify({ siteTitle, bannerText }),
      });

      if (res.ok) {
        setSettingsMessage("تم حفظ الإعدادات بنجاح.");
      } else {
        const data = await res.json();
        setSettingsMessage(
          data.error === "Permission denied"
            ? "Permission Denied"
            : "فشل في حفظ الإعدادات."
        );
      }
    } catch {
      setSettingsMessage("فشل في حفظ الإعدادات.");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleUpdateContact = async (id: string, status: "done" | "new") => {
    if (!hasPermission(session?.role, "manage_contacts")) {
      return;
    }

    try {
      const res = await apiCall("/api/contacts", {
        method: "POST",
        body: JSON.stringify({ action: "update", id, status }),
      });

      if (res.ok) {
        fetchContacts();
      }
    } catch {
      // Silently fail
    }
  };

  const tabs: Array<{ id: Tab; label: string; icon: typeof BarChart3; permission?: string }> = [
    { id: "dashboard", label: "لوحة التحكم", icon: BarChart3 },
    { id: "upload", label: "رفع البيانات", icon: Upload, permission: "upload" },
    { id: "users", label: "المستخدمون", icon: Users, permission: "manage_users" },
    { id: "contacts", label: "طلبات التواصل", icon: MessageSquare, permission: "manage_contacts" },
    { id: "settings", label: "الإعدادات", icon: Settings, permission: "manage_settings" },
  ];

  const inputClass =
    "w-full h-11 px-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm";

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">لوحة الإدارة</h2>
          <p className="text-muted-foreground text-sm">
            مرحباً {session?.username || "مسؤول"} ({roleLabels[session?.role as UserRole] || session?.role})
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
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              activeTab === tab.id
                ? "gold-gradient text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "dashboard" && (
        <div className="space-y-4">
          {statsLoading ? (
            <div className="glass-card p-8 text-center">
              <p className="text-muted-foreground text-sm">جاري تحميل الإحصائيات...</p>
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "إجمالي الحجوزات", value: stats.total, icon: Hotel, color: "text-primary" },
                  { label: "الحجوزات المؤكدة", value: stats.confirmed, icon: CalendarCheck, color: "text-success" },
                  { label: "الإلغاءات", value: stats.cancelled, icon: CalendarX, color: "text-destructive" },
                  { label: "نسبة الإلغاء", value: `${stats.cancelRate.toFixed(1)}%`, icon: BarChart3, color: "text-warning" },
                ].map((kpi) => (
                  <div key={kpi.label} className="kpi-card">
                    <div className="flex items-center justify-between mb-3">
                      <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                    </div>
                    <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
                  </div>
                ))}
              </div>

              {stats.employees && stats.employees.length > 0 && (
                <div className="glass-card p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold gold-text">موظفي الحجز المركزي</h3>
                    <span className="text-xs text-muted-foreground">
                      {stats.employees.length} موظف
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {stats.employees.map((emp) => (
                      <div key={emp.name} className="glass-card p-3 space-y-2">
                        <p className="text-sm font-semibold truncate">{emp.name}</p>
                        <p className="text-lg font-bold text-primary">{emp.total}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-success">مؤكد</span>
                          <span className="font-semibold">{emp.confirmed}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-destructive">ملغي</span>
                          <span className="font-semibold">{emp.cancelled}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-warning">نسبة الإلغاء</span>
                          <span className="font-semibold">{emp.cancelRate.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="glass-card p-8 text-center space-y-3">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                لا توجد بيانات حجوزات. قم برفع ملف CSV من تبويب "رفع البيانات".
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "upload" && (
        <div className="space-y-4">
          {!hasPermission(session?.role, "upload") ? (
            <div className="glass-card p-8 text-center">
              <Shield className="w-12 h-12 mx-auto text-destructive mb-3" />
              <p className="text-sm font-semibold text-destructive">Permission Denied</p>
              <p className="text-xs text-muted-foreground mt-1">ليس لديك صلاحية رفع البيانات.</p>
            </div>
          ) : (
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">رفع بيانات الحجوزات (CSV)</h3>
                  <p className="text-xs text-muted-foreground">
                    تحليل وحساب تلقائي للإحصائيات بعد الرفع
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleUploadCSV}
                  className="hidden"
                  id="csv-upload"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full h-11 rounded-lg gold-gradient text-primary-foreground font-semibold text-sm disabled:opacity-50"
                >
                  {uploading ? "جاري الرفع والتحليل..." : "اختر ملف CSV للرفع"}
                </button>
              </div>

              {uploadMessage && (
                <p
                  className={`text-xs ${
                    uploadMessage === "Permission Denied" || uploadMessage.startsWith("خطأ") || uploadMessage.startsWith("فشل")
                      ? "text-destructive"
                      : "text-success"
                  }`}
                >
                  {uploadMessage}
                </p>
              )}

              <div className="border-t border-border/50 pt-4">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">قواعد تصنيف الحالة:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success" />
                    <span>N, M, Confirmed = مؤكد</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-destructive" />
                    <span>C, NS = ملغي</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-4">
          {!hasPermission(session?.role, "manage_users") ? (
            <div className="glass-card p-8 text-center">
              <Shield className="w-12 h-12 mx-auto text-destructive mb-3" />
              <p className="text-sm font-semibold text-destructive">Permission Denied</p>
              <p className="text-xs text-muted-foreground mt-1">ليس لديك صلاحية إدارة المستخدمين.</p>
            </div>
          ) : (
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
                      حدد الدور والصلاحيات للمستخدم.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAddUser} className="space-y-3">
                  <input
                    type="text"
                    placeholder="اسم المستخدم"
                    dir="ltr"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                    className={inputClass}
                  />
                  <input
                    type="password"
                    placeholder="كلمة المرور"
                    dir="ltr"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className={inputClass}
                  />
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className={inputClass}
                  >
                    <option value="viewer">مشاهد (عرض فقط)</option>
                    <option value="editor">محرر (رفع بيانات)</option>
                    <option value="admin">مدير (رفع + إدارة مستخدمين)</option>
                    {session?.role === "superadmin" && (
                      <option value="superadmin">مدير أعلى (تحكم كامل)</option>
                    )}
                  </select>
                  <button
                    type="submit"
                    className="w-full h-11 rounded-lg gold-gradient text-primary-foreground font-semibold text-sm"
                  >
                    إضافة المستخدم
                  </button>
                </form>

                {userMessage && (
                  <p
                    className={`text-xs ${
                      userMessage === "Permission Denied" || userMessage.startsWith("فشل") || userMessage.startsWith("اسم")
                        ? "text-destructive"
                        : "text-success"
                    }`}
                  >
                    {userMessage}
                  </p>
                )}
              </div>

              {/* User List */}
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">إدارة المستخدمين</h3>
                    <p className="text-xs text-muted-foreground">
                      إجمالي المستخدمين: {users.length}
                    </p>
                  </div>
                </div>

                {usersLoading ? (
                  <p className="text-xs text-muted-foreground">جاري التحميل...</p>
                ) : (
                  <div className="space-y-2">
                    {users.map((user) => (
                      <div
                        key={user.username}
                        className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-2">
                          <span>{user.username}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              user.role === "superadmin"
                                ? "bg-primary/15 text-primary"
                                : user.role === "admin"
                                ? "bg-warning/15 text-warning"
                                : user.role === "editor"
                                ? "bg-success/15 text-success"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {roleLabels[user.role]}
                          </span>
                        </div>
                        {user.username !== "admin" && hasPermission(session?.role, "delete_users") && (
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
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "contacts" && (
        <div className="space-y-4">
          {!hasPermission(session?.role, "manage_contacts") ? (
            <div className="glass-card p-8 text-center">
              <Shield className="w-12 h-12 mx-auto text-destructive mb-3" />
              <p className="text-sm font-semibold text-destructive">Permission Denied</p>
              <p className="text-xs text-muted-foreground mt-1">ليس لديك صلاحية إدارة طلبات التواصل.</p>
            </div>
          ) : (
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">إدارة طلبات التواصل</h3>
                  <p className="text-xs text-muted-foreground">
                    إجمالي الطلبات: {contacts.length} | جديد:{" "}
                    {contacts.filter((c) => c.status === "new").length}
                  </p>
                </div>
              </div>

              {contactsLoading ? (
                <p className="text-xs text-muted-foreground">جاري التحميل...</p>
              ) : contacts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  لا توجد طلبات تواصل حالياً.
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="glass-card p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">{contact.customerName}</p>
                          <p className="text-xs text-muted-foreground">
                            {contact.branchName} · {contact.phone}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            contact.status === "new"
                              ? "bg-primary/15 text-primary"
                              : "bg-success/15 text-success"
                          }`}
                        >
                          {contact.status === "new" ? "جديد" : "تم"}
                        </span>
                      </div>
                      {contact.note && (
                        <p className="text-xs text-muted-foreground">{contact.note}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(contact.createdAt).toLocaleDateString("ar-SA")}
                        </span>
                        {contact.status === "new" ? (
                          <button
                            onClick={() => handleUpdateContact(contact.id, "done")}
                            className="text-xs text-success flex items-center gap-1 hover:opacity-80 transition"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            تم التواصل
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateContact(contact.id, "new")}
                            className="text-xs text-muted-foreground flex items-center gap-1 hover:opacity-80 transition"
                          >
                            إعادة فتح
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-4">
          {!hasPermission(session?.role, "manage_settings") ? (
            <div className="glass-card p-8 text-center">
              <Shield className="w-12 h-12 mx-auto text-destructive mb-3" />
              <p className="text-sm font-semibold text-destructive">Permission Denied</p>
              <p className="text-xs text-muted-foreground mt-1">ليس لديك صلاحية تعديل إعدادات الموقع.</p>
            </div>
          ) : (
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">إعدادات الموقع</h3>
                  <p className="text-xs text-muted-foreground">
                    تعديل عنوان الموقع ونص البانر
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">عنوان الموقع</label>
                  <input
                    type="text"
                    placeholder="WORM-AI"
                    dir="ltr"
                    value={siteTitle}
                    onChange={(e) => setSiteTitle(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">نص البانر</label>
                  <input
                    type="text"
                    placeholder="نص يظهر أعلى الصفحة (اتركه فارغاً لإخفائه)"
                    value={bannerText}
                    onChange={(e) => setBannerText(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <button
                  onClick={handleSaveSettings}
                  disabled={settingsLoading}
                  className="w-full h-11 rounded-lg gold-gradient text-primary-foreground font-semibold text-sm disabled:opacity-50"
                >
                  {settingsLoading ? "جاري الحفظ..." : "حفظ الإعدادات"}
                </button>
              </div>

              {settingsMessage && (
                <p
                  className={`text-xs ${
                    settingsMessage === "Permission Denied" || settingsMessage.startsWith("فشل")
                      ? "text-destructive"
                      : "text-success"
                  }`}
                >
                  {settingsMessage}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
