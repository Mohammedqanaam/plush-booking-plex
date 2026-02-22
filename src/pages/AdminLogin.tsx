import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAdminSession } from "@/lib/adminAuth";
import { api } from "@/lib/api";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getAdminSession()) {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.login(username, password);
      navigate("/admin", { replace: true });
    } catch {
      setError("بيانات الدخول غير صحيحة.");
    } finally {
      setLoading(false);
    }
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
            disabled={loading}
            className="w-full max-w-sm mx-auto h-11 rounded-lg gold-gradient text-primary-foreground font-semibold text-sm block disabled:opacity-50"
          >
            {loading ? "جاري التحقق..." : "تسجيل الدخول"}
          </button>
        </form>

        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
};

export default AdminLogin;
