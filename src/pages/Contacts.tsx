import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";

interface ContactForm {
  branchName: string;
  customerName: string;
  phone: string;
  note: string;
}

const Contacts = () => {
  const [form, setForm] = useState<ContactForm>({
    branchName: "",
    customerName: "",
    phone: "",
    note: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submission
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setForm({ branchName: "", customerName: "", phone: "", note: "" });
    }, 3000);
  };

  const inputClass =
    "w-full h-11 px-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition";

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">طلبات التواصل</h2>
        <p className="text-muted-foreground text-sm">
          أرسل طلب تواصل من فرعك
        </p>
      </div>

      {submitted ? (
        <div className="glass-card p-8 text-center space-y-3 animate-fade-in">
          <CheckCircle2 className="w-12 h-12 mx-auto text-success" />
          <p className="font-semibold text-lg">تم إرسال الطلب بنجاح!</p>
          <p className="text-sm text-muted-foreground">سيتم التواصل معكم قريباً</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-card p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">اسم الفرع</label>
            <input
              required
              type="text"
              placeholder="مثال: فرع الرياض"
              value={form.branchName}
              onChange={(e) => setForm({ ...form, branchName: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">اسم العميل</label>
            <input
              required
              type="text"
              placeholder="الاسم الكامل"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">رقم الجوال</label>
            <input
              required
              type="tel"
              placeholder="+966 5XX XXX XXXX"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputClass}
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">ملاحظات</label>
            <textarea
              placeholder="أي تفاصيل إضافية..."
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full h-11 rounded-lg gold-gradient text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Send className="w-4 h-4" />
            إرسال الطلب
          </button>
        </form>
      )}

      {/* Recent requests (mock) */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold gold-text">آخر الطلبات</h3>
        {[
          { branch: "فرع الرياض", customer: "أحمد محمد", status: "new" as const, time: "منذ ساعة" },
          { branch: "فرع جدة", customer: "سارة أحمد", status: "done" as const, time: "منذ 3 ساعات" },
        ].map((req, i) => (
          <div key={i} className="glass-card p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{req.customer}</p>
              <p className="text-xs text-muted-foreground">{req.branch} · {req.time}</p>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                req.status === "new"
                  ? "bg-primary/15 text-primary"
                  : "bg-success/15 text-success"
              }`}
            >
              {req.status === "new" ? "جديد" : "تم"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Contacts;
