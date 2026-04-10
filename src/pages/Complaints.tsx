import { useMemo, useState } from "react";
import { Copy, ExternalLink, MailCheck, OctagonAlert, SendHorizonal, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { branchInventoryByBrand, branchRecords, brandOptions, type BrandKey } from "@/data/knowledge";
import PageHeader from "@/components/PageHeader";

type FormState = {
  brand: BrandKey;
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

const initial: FormState = {
  brand: "Boudl",
  branch: "",
  mainCategory: "",
  subCategory: "",
  guestName: "",
  bookingMobile: "",
  contactMobile: "",
  suiteNumber: "",
  checkInDate: "",
  priority: "normal",
  notes: "",
};

type ResultState = { complaintNo: string; whatsappMessage: string; whatsappUrl: string; emailResult?: { sent?: boolean; reason?: string } };

const MAIN_CATEGORIES: Record<string, string[]> = {
  الاستقبال: ["تأخير تسجيل الدخول", "سوء خدمة", "معلومة غير دقيقة"],
  الغرف: ["نظافة", "صيانة", "نوع الغرفة"],
  المرافق: ["مسبح", "مواقف", "مطعم/فطور"],
  "الدفع والفوترة": ["مبلغ زائد", "استرداد", "طريقة الدفع"],
};

const Complaints = () => {
  const [form, setForm] = useState<FormState>(initial);
  const [result, setResult] = useState<ResultState | null>(null);

  const branches = useMemo(() => branchInventoryByBrand[form.brand] || [], [form.brand]);

  const selectedBranch = useMemo(
    () => branchRecords.find((branch) => branch.brand === form.brand && branch.branch === form.branch),
    [form.brand, form.branch],
  );

  const subCategories = useMemo(() => MAIN_CATEGORIES[form.mainCategory] || [], [form.mainCategory]);

  const updateBrand = (nextBrand: BrandKey) => {
    setForm((prev) => ({ ...prev, brand: nextBrand, branch: "" }));
  };

  return (
    <div className="p-3 md:p-4 max-w-6xl mx-auto space-y-4 pb-28 md:pb-8">
      <PageHeader title="إدارة الشكاوى" subtitle="نموذج واضح وسريع لموظف الكول سنتر مع تصفية الفروع حسب البراند تلقائيًا." icon={OctagonAlert} />

      <form
        className="page-surface grid md:grid-cols-2 gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const data = await api.submitComplaint(form as Record<string, unknown>);
          setResult({ complaintNo: data.complaint?.complaintNo, whatsappMessage: data.whatsappMessage, whatsappUrl: data.whatsappUrl, emailResult: data.emailResult });
          setForm(initial);
        }}
      >
        <select className="h-11 rounded-xl bg-secondary/70 border px-3" value={form.brand} onChange={(e) => updateBrand(e.target.value as BrandKey)}>
          {brandOptions.map((brand) => (
            <option key={brand}>{brand}</option>
          ))}
        </select>

        <select className="h-11 rounded-xl bg-secondary/70 border px-3" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} required>
          <option value="">اختر الفرع</option>
          {branches.map((branchName) => (
            <option key={branchName} value={branchName}>
              {branchName}
            </option>
          ))}
        </select>

        {selectedBranch ? (
          <div className="md:col-span-2 rounded-xl border border-border/70 bg-secondary/30 p-3 text-xs text-muted-foreground">
            {selectedBranch.city} · استقبال: {selectedBranch.hotelPhone} · الفطور: {selectedBranch.breakfastInfo}
          </div>
        ) : null}

        <select className="h-11 rounded-xl bg-secondary/70 border px-3" value={form.mainCategory} onChange={(e) => setForm({ ...form, mainCategory: e.target.value, subCategory: "" })} required>
          <option value="">اختر التصنيف الرئيسي</option>
          {Object.keys(MAIN_CATEGORIES).map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>

        <select className="h-11 rounded-xl bg-secondary/70 border px-3" value={form.subCategory} onChange={(e) => setForm({ ...form, subCategory: e.target.value })} required>
          <option value="">اختر التصنيف الفرعي</option>
          {subCategories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <input className="h-11 rounded-xl bg-secondary/70 border px-3" placeholder="اسم الضيف" value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} required />
        <input className="h-11 rounded-xl bg-secondary/70 border px-3" dir="ltr" placeholder="جوال الحجز" value={form.bookingMobile} onChange={(e) => setForm({ ...form, bookingMobile: e.target.value })} required />
        <input className="h-11 rounded-xl bg-secondary/70 border px-3" dir="ltr" placeholder="جوال التواصل" value={form.contactMobile} onChange={(e) => setForm({ ...form, contactMobile: e.target.value })} required />
        <input className="h-11 rounded-xl bg-secondary/70 border px-3" dir="ltr" placeholder="رقم السويت" value={form.suiteNumber} onChange={(e) => setForm({ ...form, suiteNumber: e.target.value })} />
        <input type="date" className="h-11 rounded-xl bg-secondary/70 border px-3" value={form.checkInDate} onChange={(e) => setForm({ ...form, checkInDate: e.target.value })} />
        <select className="h-11 rounded-xl bg-secondary/70 border px-3" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as FormState["priority"] })}>
          <option value="normal">أولوية عادية</option>
          <option value="high">أولوية عالية</option>
        </select>
        <textarea className="md:col-span-2 rounded-xl bg-secondary/70 border p-3" rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="الملاحظات" />
        <button className="md:col-span-2 h-11 rounded-xl gold-gradient text-primary-foreground inline-flex items-center justify-center gap-2">
          <SendHorizonal className="w-4 h-4" />إرسال الشكوى
        </button>
      </form>

      {result ? (
        <div className="page-surface space-y-3">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="w-5 h-5 text-primary" /> تم إنشاء الشكوى: {result.complaintNo}
          </div>
          <pre className="text-xs whitespace-pre-wrap bg-secondary/40 p-3 rounded-xl border border-border/70">{result.whatsappMessage}</pre>
          <div className="flex gap-2 flex-wrap">
            <button className="h-10 px-3 rounded-lg border border-border/70 inline-flex items-center gap-2" onClick={() => navigator.clipboard.writeText(result.whatsappMessage)}>
              <Copy className="w-4 h-4" /> نسخ الرسالة
            </button>
            <a className="h-10 px-3 rounded-lg border border-border/70 inline-flex items-center gap-2" href={result.whatsappUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="w-4 h-4" /> فتح واتساب
            </a>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MailCheck className="w-4 h-4" /> {result.emailResult?.sent ? "تم إرسال نسخة بريدية للشكوى" : "تعذر/تخطي إرسال البريد (راجع إعدادات البريد)"}
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default Complaints;
