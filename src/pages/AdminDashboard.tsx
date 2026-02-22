import { useState } from "react";
import { Lock, Upload, Users, Settings, LogOut, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { addAdminUser, clearAdminSession, getAdminSession, getAdminUsers } from "@/lib/adminAuth";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [users, setUsers] = useState(() => getAdminUsers());
  const session = getAdminSession();

  const handleCreateUser = (event: React.FormEvent) => {
    event.preventDefault();
    const success = addAdminUser(username, password);
    if (success) {
      setMessage("تمت إضافة المستخدم بنجاح.");
      setUsername("");
      setPassword("");
      setUsers(getAdminUsers());
      return;
    }
    setMessage("تعذر إضافة المستخدم. تأكد من إدخال بيانات صحيحة وأن الاسم غير مستخدم.");
  };

  const handleLogout = () => {
    clearAdminSession();
    navigate("/");
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">لوحة الإدارة</h2>
          <p className="text-muted-foreground text-sm">
            مرحباً {session?.username || "مسؤول"}، إدارة النظام محمية محلياً.
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">إضافة مسؤول جديد</h3>
              <p className="text-xs text-muted-foreground">
                يمكن إضافة أكثر من مسؤول لإدارة النظام.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-3">
            <input
              type="text"
              placeholder="اسم المستخدم"
              dir="ltr"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full h-11 px-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm"
            />
            <input
              type="password"
              placeholder="كلمة المرور"
              dir="ltr"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full h-11 px-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm"
            />
            <button
              type="submit"
              className="w-full h-11 rounded-lg gold-gradient text-primary-foreground font-semibold text-sm"
            >
              إضافة المستخدم
            </button>
          </form>

          {message && <p className="text-xs text-muted-foreground">{message}</p>}
        </div>

        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">إدارة المسؤولين</h3>
              <p className="text-xs text-muted-foreground">
                إجمالي المستخدمين المسجلين: {users.length}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.username}
                className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0"
              >
                <span>{user.username}</span>
                <span className="text-xs text-muted-foreground">مسؤول</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {[
          { icon: Upload, label: "رفع بيانات الحجوزات (CSV)", desc: "تحليل وحساب تلقائي" },
          { icon: Users, label: "إدارة طلبات التواصل", desc: "تحديث الحالة (جديد / تم)" },
          { icon: Settings, label: "إعدادات النظام", desc: "التحكم الكامل بالمنصة" },
        ].map((feat, i) => (
          <div key={i} className="glass-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <feat.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{feat.label}</p>
              <p className="text-xs text-muted-foreground">{feat.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
