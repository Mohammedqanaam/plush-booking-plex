import { Lock, Upload, Users, Settings } from "lucide-react";

const Admin = () => {
  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">لوحة الإدارة</h2>
        <p className="text-muted-foreground text-sm">
          تسجيل الدخول مطلوب للوصول
        </p>
      </div>

      {/* Login prompt */}
      <div className="glass-card p-8 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">تسجيل دخول المسؤول</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          هذه المنطقة محمية. يرجى تفعيل Lovable Cloud للحصول على نظام المصادقة وقاعدة البيانات.
        </p>

        <div className="space-y-3 pt-2">
          <input
            type="email"
            placeholder="البريد الإلكتروني"
            disabled
            dir="ltr"
            className="w-full max-w-sm mx-auto h-11 px-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm opacity-50 cursor-not-allowed block"
          />
          <input
            type="password"
            placeholder="كلمة المرور"
            disabled
            dir="ltr"
            className="w-full max-w-sm mx-auto h-11 px-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm opacity-50 cursor-not-allowed block"
          />
          <button
            disabled
            className="w-full max-w-sm mx-auto h-11 rounded-lg gold-gradient text-primary-foreground font-semibold text-sm opacity-50 cursor-not-allowed block"
          >
            تسجيل الدخول
          </button>
        </div>
      </div>

      {/* Admin features preview */}
      <div className="grid grid-cols-1 gap-3">
        {[
          { icon: Upload, label: "رفع بيانات الحجوزات (CSV)", desc: "تحليل وحساب تلقائي" },
          { icon: Users, label: "إدارة طلبات التواصل", desc: "تحديث الحالة (جديد / تم)" },
          { icon: Settings, label: "إعدادات النظام", desc: "التحكم الكامل بالمنصة" },
        ].map((feat, i) => (
          <div key={i} className="glass-card p-4 flex items-center gap-4 opacity-60">
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

export default Admin;
