import { useState } from "react";
import { Send, CheckCircle2, ChevronDown } from "lucide-react";
import { hotelBranches } from "@/data/hotels";
import { api, type ContactRequest } from "@/lib/api";

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
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentRequests, setRecentRequests] = useState<ContactRequest[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const result = await api.createContactRequest(form);
      setSubmitted(true);
      setRecentRequests((prev) => [result.request, ...prev].slice(0, 5));
      setForm({ branchName: "", customerName: "", phone: "", note: "" });
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر إرسال الطلب");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full h-11 px-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition";

  const groups = [...new Set(hotelBranches.map((h) => h.group))];

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">طلبات التواصل</h2>
        <p className="text-muted-foreground text-sm">أرسل طلب تواصل من فرعك</p>
      </div>

      {submitted ? (
        <div className="glass-card p-8 text-center space-y-3 animate-fade-in">
          <CheckCircle2 className="w-12 h-12 mx-auto text-success" />
          <p className="font-semibold text-lg">تم إرسال الطلب بنجاح!</p>
          <p className="text-sm text-muted-foreground">تمت إضافة الطلب وسيظهر مباشرة في قسم الطلبات بلوحة الأدمن.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-card p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">اسم الفرع</label>
            <div className="relative">
              <select
                required
                value={form.branchName}
                onChange={(e) => setForm({ ...form, branchName: e.target.value })}
                className={`${inputClass} appearance-none pl-10`}
              >
                <option value="">-- اختر الفرع --</option>
                {groups.map((group) => (
                  <optgroup key={group} label={`── ${group} ──`}>
                    {hotelBranches
                      .filter((h) => h.group === group)
                      .map((h) => (
                        <option key={h.id} value={h.name}>
                          {h.name} - {h.city}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
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

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-lg gold-gradient text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {submitting ? "جاري الإرسال..." : "إرسال الطلب"}
          </button>
        </form>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold gold-text">آخر الطلبات المرسلة من هذه الجلسة</h3>
        {recentRequests.length ? (
          recentRequests.map((req) => (
            <div key={req.id} className="glass-card p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{req.customerName}</p>
                <p className="text-xs text-muted-foreground">{req.branchName} · {req.phone}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary">{req.status === "new" ? "جديد" : "تم"}</span>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">لا توجد طلبات مرسلة من هذه الجلسة بعد.</p>
        )}
      </div>
    </div>
  );
};

export default Contacts;
