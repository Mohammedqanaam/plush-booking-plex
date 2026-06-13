import { useMemo, useState } from "react";
import { Send, CheckCircle2, ChevronDown, PhoneCall, Clock3, Hash } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { hotelBranches } from "@/data/hotels";
import { api, type ContactRequest } from "@/lib/api";

interface ContactForm {
  brand: string;
  branchName: string;
  guestName: string;
  guestPhone: string;
  reason: string;
}

const Contacts = () => {
  const [form, setForm] = useState<ContactForm>({ brand: "", branchName: "", guestName: "", guestPhone: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentRequests, setRecentRequests] = useState<ContactRequest[]>([]);

  const brands = useMemo(() => [...new Set(hotelBranches.map((h) => h.group))].sort((a, b) => a.localeCompare(b, "ar")), []);
  const branches = useMemo(() => hotelBranches.filter((h) => !form.brand || h.group === form.brand), [form.brand]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const result = await api.createContactRequest(form);
      setSubmitted(true);
      setRecentRequests((prev) => [result.request, ...prev].slice(0, 5));
      setForm({ brand: "", branchName: "", guestName: "", guestPhone: "", reason: "" });
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر إرسال الطلب");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full h-10 px-3 rounded-xl bg-secondary/70 border border-primary/15 text-foreground placeholder:text-muted-foreground text-sm";

  return (
    <div className="page-wrap-narrow">
      <PageHeader title="طلبات التواصل" subtitle="تسجيل طلب تواصل الضيف بسرعة." icon={PhoneCall} />

      {submitted ? (
        <div className="page-surface text-center space-y-3 animate-fade-in">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-300" />
          <p className="font-semibold text-lg">تم إرسال الطلب بنجاح.</p>
          <p className="text-sm text-muted-foreground">تمت إضافة الطلب للمتابعة.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="page-surface space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">البراند</label>
              <div className="relative">
                <select
                  required
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value, branchName: "" })}
                  className={`${inputClass} appearance-none pl-10`}
                >
                  <option value="">-- اختر البراند --</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">الفرع</label>
              <div className="relative">
                <select
                  required
                  value={form.branchName}
                  onChange={(e) => setForm({ ...form, branchName: e.target.value })}
                  className={`${inputClass} appearance-none pl-10`}
                  disabled={!form.brand}
                >
                  <option value="">-- اختر الفرع --</option>
                  {branches.map((h) => (
                    <option key={h.id} value={h.name}>
                      {h.name} - {h.city}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">اسم الضيف</label>
              <input required type="text" placeholder="الاسم الكامل" value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} className={inputClass} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">جوال الضيف</label>
              <input required type="tel" placeholder="+966 5XX XXX XXXX" value={form.guestPhone} onChange={(e) => setForm({ ...form, guestPhone: e.target.value })} className={inputClass} dir="ltr" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">سبب التواصل</label>
              <textarea required placeholder="اذكر سبب التواصل بشكل مختصر" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-xl bg-secondary/70 border border-border text-foreground placeholder:text-muted-foreground text-sm resize-none" />
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button type="submit" disabled={submitting} className="w-full h-10 rounded-xl gold-gradient text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            <Send className="w-4 h-4" />
            {submitting ? "جاري الإرسال..." : "إرسال الطلب"}
          </button>
        </form>
      )}

      <div className="page-surface space-y-2">
        <h3 className="text-sm font-semibold inline-flex items-center gap-1"><Clock3 className="w-4 h-4 text-primary" /> آخر الطلبات المرسلة من هذه الجلسة</h3>
        {recentRequests.length ? (
          recentRequests.map((req) => (
            <div key={req.id} className="rounded-xl border border-primary/18 bg-secondary/24 p-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium inline-flex items-center gap-2"><Hash className="w-3.5 h-3.5 text-primary" />{req.requestNo}</p>
                <p className="text-sm font-medium">{req.guestName}</p>
                <p className="text-xs text-muted-foreground">{req.brand} · {req.branchName} · {req.guestPhone}</p>
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
