import { useMemo, useState } from "react";
import { AlertCircle, Copy, ExternalLink, MailCheck, OctagonAlert, SendHorizonal, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { branchRecords } from "@/data/knowledge";
import PageHeader from "@/components/PageHeader";

type FormState = {
  brand: "Boudl" | "Braira" | "Narcissus" | "Aber";
  branch: string;
  mainCategory: string;
  subCategory: string;
  guestName: string;
  bookingMobile: string;
  contactMobile: string;
  suiteNumber: string;
  checkInDate: string;
  priority: "normal" | "high";
  notes: string;
};

const initial: FormState = { brand: "Boudl", branch: "", mainCategory: "", subCategory: "", guestName: "", bookingMobile: "", contactMobile: "", suiteNumber: "", checkInDate: "", priority: "normal", notes: "" };
type ResultState = { complaintNo: string; whatsappMessage: string; whatsappUrl: string; emailResult?: { sent?: boolean; reason?: string } };

const MAIN_CATEGORIES: Record<string, string[]> = {
  "الاستقبال": ["تأخير تسجيل الدخول", "سوء خدمة", "معلومة غير دقيقة"],
  "الغرف": ["نظافة", "صيانة", "نوع الغرفة"],
  "المرافق": ["مسبح", "مواقف", "مطعم أو إفطار"],
  "الدفع والفوترة": ["مبلغ زائد", "استرداد", "طريقة الدفع"],
};

const Complaints = () => {
  const [form, setForm] = useState<FormState>(initial);
  const [result, setResult] = useState<ResultState | null>(null);
  const [submitError, setSubmitError] = useState("");

  const branches = useMemo(() => branchRecords
    .filter((row) => row.brand === form.brand)
    .map((row) => ({ id: row.id, name: row.branch, city: row.city, phone: row.hotelPhone || "-" })), [form.brand]);

  const selectedBranch = useMemo(() => branches.find((b) => b.name === form.branch), [branches, form.branch]);
  const subCategories = useMemo(() => MAIN_CATEGORIES[form.mainCategory] || [], [form.mainCategory]);

  return <div className="page-wrap">
    <PageHeader title="تسجيل شكوى" subtitle="أدخل بيانات الضيف والشكوى." icon={OctagonAlert} />

    <form className="page-surface grid md:grid-cols-2 gap-3" onSubmit={async (e) => {
      e.preventDefault();
      setSubmitError("");
      try {
        const data = await api.submitComplaint(form as Record<string, unknown>);
        setResult({ complaintNo: data.complaint?.complaintNo, whatsappMessage: data.whatsappMessage, whatsappUrl: data.whatsappUrl, emailResult: data.emailResult });
        setForm(initial);
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "تعذر إرسال الشكوى. يرجى المحاولة مجددًا.");
      }
    }}>
      <label className="space-y-1 text-sm"><span className="font-medium">العلامة</span><select className="h-11 w-full rounded-xl bg-secondary/70 border px-3" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value as FormState["brand"], branch: "" })}>{["Boudl", "Braira", "Narcissus", "Aber"].map((b) => <option key={b}>{b}</option>)}</select></label>
      <label className="space-y-1 text-sm"><span className="font-medium">الفرع</span><select className="h-11 w-full rounded-xl bg-secondary/70 border px-3" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} required>
        <option value="">اختر الفرع</option>{branches.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
      </select></label>

      {selectedBranch ? <div className="md:col-span-2 rounded-xl border border-primary/18 bg-secondary/24 p-3 text-xs text-muted-foreground">{selectedBranch.city} · الاستقبال: <span dir="ltr">{selectedBranch.phone}</span></div> : null}

      <label className="space-y-1 text-sm"><span className="font-medium">التصنيف</span><select className="h-11 w-full rounded-xl bg-secondary/70 border px-3" value={form.mainCategory} onChange={(e) => setForm({ ...form, mainCategory: e.target.value, subCategory: "" })} required>
        <option value="">اختر التصنيف الرئيسي</option>{Object.keys(MAIN_CATEGORIES).map((item) => <option key={item}>{item}</option>)}
      </select></label>
      <label className="space-y-1 text-sm"><span className="font-medium">نوع الشكوى</span><select className="h-11 w-full rounded-xl bg-secondary/70 border px-3" value={form.subCategory} onChange={(e) => setForm({ ...form, subCategory: e.target.value })} required disabled={!form.mainCategory}>
        <option value="">اختر التصنيف الفرعي</option>{subCategories.map((item) => <option key={item} value={item}>{item}</option>)}
      </select></label>

      <label className="space-y-1 text-sm"><span className="font-medium">اسم الضيف</span><input className="h-11 w-full rounded-xl bg-secondary/70 border px-3" placeholder="الاسم الكامل" value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} required /></label>
      <label className="space-y-1 text-sm"><span className="font-medium">جوال الحجز</span><input className="h-11 w-full rounded-xl bg-secondary/70 border px-3" dir="ltr" inputMode="tel" placeholder="05XXXXXXXX" value={form.bookingMobile} onChange={(e) => setForm({ ...form, bookingMobile: e.target.value })} required /></label>
      <label className="space-y-1 text-sm"><span className="font-medium">جوال التواصل</span><input className="h-11 w-full rounded-xl bg-secondary/70 border px-3" dir="ltr" inputMode="tel" placeholder="05XXXXXXXX" value={form.contactMobile} onChange={(e) => setForm({ ...form, contactMobile: e.target.value })} required /></label>
      <label className="space-y-1 text-sm"><span className="font-medium">رقم الغرفة أو الجناح</span><input className="h-11 w-full rounded-xl bg-secondary/70 border px-3" dir="ltr" placeholder="اختياري" value={form.suiteNumber} onChange={(e) => setForm({ ...form, suiteNumber: e.target.value })} /></label>
      <label className="space-y-1 text-sm"><span className="font-medium">تاريخ الوصول</span><input type="date" className="h-11 w-full rounded-xl bg-secondary/70 border px-3" value={form.checkInDate} onChange={(e) => setForm({ ...form, checkInDate: e.target.value })} /></label>
      <label className="space-y-1 text-sm"><span className="font-medium">الأولوية</span><select className="h-11 w-full rounded-xl bg-secondary/70 border px-3" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as FormState["priority"] })}><option value="normal">عادية</option><option value="high">عالية</option></select></label>
      <label className="space-y-1 text-sm md:col-span-2"><span className="font-medium">الملاحظات</span><textarea className="w-full rounded-xl bg-secondary/70 border p-3" rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="اشرح المشكلة باختصار" /></label>
      <button className="md:col-span-2 h-11 rounded-xl gold-gradient text-primary-foreground inline-flex items-center justify-center gap-2"><SendHorizonal className="w-4 h-4" />حفظ الشكوى</button>
      {submitError && <p className="md:col-span-2 text-xs rounded-xl border border-rose-400/30 bg-rose-400/10 text-rose-300 p-3 inline-flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {submitError}</p>}
    </form>

    {result && <div className="page-surface space-y-3"><div className="flex items-center gap-2 font-medium"><ShieldCheck className="w-5 h-5 text-primary" /> تم إنشاء الشكوى: {result.complaintNo}</div><pre className="text-xs whitespace-pre-wrap bg-secondary/40 p-3 rounded-xl border border-primary/18">{result.whatsappMessage}</pre><div className="flex gap-2 flex-wrap"><button className="h-10 px-3 rounded-lg border border-primary/18 inline-flex items-center gap-2" onClick={() => navigator.clipboard.writeText(result.whatsappMessage)}><Copy className="w-4 h-4" /> نسخ الرسالة</button><a className="h-10 px-3 rounded-lg border border-primary/18 inline-flex items-center gap-2" href={result.whatsappUrl} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /> فتح واتساب</a></div>
      <p className="text-xs text-muted-foreground flex items-center gap-1"><MailCheck className="w-4 h-4" /> {result.emailResult?.sent ? "تم إرسال نسخة بالبريد" : "لم تُرسل نسخة بالبريد؛ راجع الإعدادات."}</p></div>}
  </div>;
};

export default Complaints;
