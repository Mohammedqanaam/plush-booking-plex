import { useMemo, useState } from "react";
import { MessageSquareWarning, Copy, ExternalLink } from "lucide-react";
import { enterpriseApi } from "@/lib/enterpriseApi";
import { COMPLAINT_CATEGORIES } from "@/lib/enterpriseProtocol";

type ComplaintForm = {
  brand: "Boudl" | "Braira" | "Narcissus" | "Aber";
  branch: string;
  mainCategory: string;
  subCategory: string;
  urgency: boolean;
  guestName: string;
  bookingMobile: string;
  contactMobile: string;
  suiteNumber: string;
  checkInDate: string;
  inHouse: "Yes" | "No";
  notes: string;
};

const initialForm: ComplaintForm = {
  brand: "Boudl",
  branch: "",
  mainCategory: Object.keys(COMPLAINT_CATEGORIES)[0],
  subCategory: COMPLAINT_CATEGORIES[Object.keys(COMPLAINT_CATEGORIES)[0]][0],
  urgency: false,
  guestName: "",
  bookingMobile: "",
  contactMobile: "",
  suiteNumber: "",
  checkInDate: "",
  inHouse: "Yes",
  notes: "",
};

const Complaints = () => {
  const [form, setForm] = useState<ComplaintForm>(initialForm);
  const [branches, setBranches] = useState<string[]>([]);
  const [result, setResult] = useState<{ complaintNo: string; whatsappMessage: string; whatsappUrl: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useState(() => {
    enterpriseApi.getComplaints().then((d) => setBranches(d.branches || [])).catch(() => setBranches([]));
  });

  const subCategories = useMemo(() => COMPLAINT_CATEGORIES[form.mainCategory] || [], [form.mainCategory]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await enterpriseApi.createComplaint(form);
      setResult({
        complaintNo: data.complaint?.complaintNo,
        whatsappMessage: data.whatsappMessage,
        whatsappUrl: data.whatsappUrl,
      });
      setForm(initialForm);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold">نظام الشكاوى</h2>
      <form onSubmit={submit} className="glass-card p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <select value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value as ComplaintForm["brand"] })} className="h-11 rounded-lg bg-secondary border border-border px-3">
          {["Boudl", "Braira", "Narcissus", "Aber"].map((b) => <option key={b}>{b}</option>)}
        </select>
        <select value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} className="h-11 rounded-lg bg-secondary border border-border px-3" required>
          <option value="">اختر الفرع</option>
          {branches.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={form.mainCategory} onChange={(e) => setForm({ ...form, mainCategory: e.target.value, subCategory: COMPLAINT_CATEGORIES[e.target.value][0] })} className="h-11 rounded-lg bg-secondary border border-border px-3">
          {Object.keys(COMPLAINT_CATEGORIES).map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={form.subCategory} onChange={(e) => setForm({ ...form, subCategory: e.target.value })} className="h-11 rounded-lg bg-secondary border border-border px-3">
          {subCategories.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input className="h-11 rounded-lg bg-secondary border border-border px-3" placeholder="اسم الضيف" value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} required />
        <input className="h-11 rounded-lg bg-secondary border border-border px-3" placeholder="رقم الحجز" value={form.bookingMobile} onChange={(e) => setForm({ ...form, bookingMobile: e.target.value })} required />
        <input className="h-11 rounded-lg bg-secondary border border-border px-3" placeholder="جوال التواصل" value={form.contactMobile} onChange={(e) => setForm({ ...form, contactMobile: e.target.value })} required />
        <input className="h-11 rounded-lg bg-secondary border border-border px-3" placeholder="رقم الجناح" value={form.suiteNumber} onChange={(e) => setForm({ ...form, suiteNumber: e.target.value })} />
        <input type="date" className="h-11 rounded-lg bg-secondary border border-border px-3" value={form.checkInDate} onChange={(e) => setForm({ ...form, checkInDate: e.target.value })} />
        <select value={form.inHouse} onChange={(e) => setForm({ ...form, inHouse: e.target.value as "Yes" | "No" })} className="h-11 rounded-lg bg-secondary border border-border px-3">
          <option value="Yes">داخل الفندق: نعم</option>
          <option value="No">داخل الفندق: لا</option>
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.checked })} /> عاجل</label>
        <textarea className="md:col-span-2 rounded-lg bg-secondary border border-border p-3" rows={4} placeholder="ملاحظات" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <button className="md:col-span-2 h-11 rounded-lg gold-gradient text-primary-foreground font-semibold" disabled={loading}>{loading ? "جاري الإرسال..." : "إرسال الشكوى"}</button>
      </form>

      {result && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2"><MessageSquareWarning className="w-5 h-5 text-warning" /> <p>تم إنشاء الشكوى: {result.complaintNo}</p></div>
          <pre className="whitespace-pre-wrap text-xs bg-secondary p-3 rounded-lg border border-border">{result.whatsappMessage}</pre>
          <div className="flex gap-2">
            <button className="h-10 px-3 rounded-lg border border-border" onClick={() => navigator.clipboard.writeText(result.whatsappMessage)}><Copy className="inline w-4 h-4" /> نسخ</button>
            <a className="h-10 px-3 rounded-lg border border-border inline-flex items-center gap-2" href={result.whatsappUrl} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /> واتساب</a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Complaints;
