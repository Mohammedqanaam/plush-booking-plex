import { useMemo, useState } from "react";
import { Send, CheckCircle2, ChevronDown, PhoneCall, Clock3 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { api, type ContactRequest } from "@/lib/api";
import { branchInventoryByBrand, brandOptions, type BrandKey } from "@/data/knowledge";

interface ContactForm {
  brand: BrandKey;
  branchName: string;
  customerName: string;
  phone: string;
  note: string;
}

const Contacts = () => {
  const [form, setForm] = useState<ContactForm>({ brand: "Boudl", branchName: "", customerName: "", phone: "", note: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentRequests, setRecentRequests] = useState<ContactRequest[]>([]);

  const branchOptions = useMemo(() => branchInventoryByBrand[form.brand], [form.brand]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const result = await api.createContactRequest({
        branchName: form.branchName,
        customerName: form.customerName,
        phone: form.phone,
        note: `${form.brand} | ${form.note}`,
      });
      setSubmitted(true);
      setRecentRequests((prev) => [result.request, ...prev].slice(0, 5));
      setForm((prev) => ({ ...prev, branchName: "", customerName: "", phone: "", note: "" }));
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر إرسال الطلب");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full h-11 px-4 rounded-xl bg-secondary/70 border border-border text-foreground placeholder:text-muted-foreground text-sm";

  return (
    <div className="p-3 md:p-4 max-w-5xl mx-auto space-y-5 pb-28 md:pb-8">
      <PageHeader title="طلبات التواصل" subtitle="واجهة أسرع للوصول إلى فروع كل براند بدون تداخل بيانات." icon={PhoneCall} />

      {submitted ? (
        <div className="page-surface text-center space-y-3 animate-fade-in">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-300" />
          <p className="font-semibold text-lg">تم إرسال الطلب بنجاح!</p>
          <p className="text-sm text-muted-foreground">تمت إضافة الطلب وسيظهر مباشرة في قسم الطلبات بلوحة الأدمن.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="page-surface space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">البراند</label>
              <select
                value={form.brand}
                onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value as BrandKey, branchName: "" }))}
                className={`${inputClass} appearance-none`}
              >
                {brandOptions.map((brand) => (
                  <option key={brand}>{brand}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">اسم الفرع</label>
              <div className="relative">
                <select required value={form.branchName} onChange={(e) => setForm({ ...form, branchName: e.target.value })} className={`${inputClass} appearance-none pl-10`}>
                  <option value="">-- اختر الفرع --</option>
                  {branchOptions.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">اسم العميل</label>
              <input required type="text" placeholder="الاسم الكامل" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className={inputClass} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">رقم الجوال</label>
              <input required type="tel" placeholder="+966 5XX XXX XXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} dir="ltr" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">ملاحظات</label>
              <textarea placeholder="أي تفاصيل إضافية..." value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl bg-secondary/70 border border-border text-foreground placeholder:text-muted-foreground text-sm resize-none" />
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button type="submit" disabled={submitting} className="w-full h-11 rounded-xl gold-gradient text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            <Send className="w-4 h-4" />
            {submitting ? "جاري الإرسال..." : "إرسال الطلب"}
          </button>
        </form>
      )}

      <div className="page-surface space-y-2">
        <h3 className="text-sm font-semibold inline-flex items-center gap-1">
          <Clock3 className="w-4 h-4 text-primary" /> آخر الطلبات المرسلة من هذه الجلسة
        </h3>
        {recentRequests.length ? (
          recentRequests.map((req) => (
            <div key={req.id} className="rounded-xl border border-border/70 bg-secondary/25 p-3 flex items-center justify-between">
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
