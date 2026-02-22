import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authenticateAdmin, getAdminSession } from "@/lib/adminAuth";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (getAdminSession()) {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const success = authenticateAdmin(username, password);
    if (success) {
      navigate("/admin", { replace: true });
      return;
    }
    setError("بيانات الدخول غير صحيحة.");
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">تسجيل دخول المسؤول</h2>
        <p className="text-muted-foreground text-sm">
          يرجى تسجيل الدخول للوصول إلى لوحة الإدارة.
        </p>
      </div>

      <div className="glass-card p-8 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">تسجيل الدخول</h3>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <input
            type="text"
            placeholder="اسم المستخدم"
            dir="ltr"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full max-w-sm mx-auto h-11 px-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm block"
          />
          <input
            type="password"
            placeholder="كلمة المرور"
            dir="ltr"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full max-w-sm mx-auto h-11 px-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm block"
          />
          <button
            type="submit"
            className="w-full max-w-sm mx-auto h-11 rounded-lg gold-gradient text-primary-foreground font-semibold text-sm block"
          >
            تسجيل الدخول
          </button>
        </form>

        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
};

export default AdminLogin;
