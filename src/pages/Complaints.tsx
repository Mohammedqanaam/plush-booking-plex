import { useEffect, useState } from "react";
import { Copy, ExternalLink, MessageSquareWarning } from "lucide-react";
import { api } from "@/lib/api";

type FormState = {
  brand: "Boudl" | "Braira" | "Narcissus" | "Aber";
  branch: string;
  guestName: string;
  bookingMobile: string;
  contactMobile: string;
  suiteNumber: string;
  checkInDate: string;
  priority: "normal" | "high";
  notes: string;
};

const initial: FormState = { brand: "Boudl", branch: "", guestName: "", bookingMobile: "", contactMobile: "", suiteNumber: "", checkInDate: "", priority: "normal", notes: "" };

const Complaints = () => {
  const [form, setForm] = useState<FormState>(initial);
  const [branches, setBranches] = useState<string[]>([]);
  const [result, setResult] = useState<{ complaintNo: string; whatsappMessage: string; whatsappUrl: string } | null>(null);

  useEffect(() => {
    api.listComplaints().then((d: any) => setBranches(d.branches || [])).catch(() => setBranches([]));
    api.listComplaints().then((d: { branches?: string[] }) => setBranches(d.branches || [])).catch(() => setBranches([]));
  }, []);

  return <div className="p-4 max-w-4xl mx-auto space-y-4">
    <h2 className="text-2xl font-bold">نموذج الشكاوى</h2>
    <form className="glass-card p-4 grid md:grid-cols-2 gap-3" onSubmit={async (e) => { e.preventDefault(); const data = await api.submitComplaint(form as any); setResult({ complaintNo: data.complaint?.complaintNo, whatsappMessage: data.whatsappMessage, whatsappUrl: data.whatsappUrl }); setForm(initial); }}>
      <select className="h-11 rounded-lg bg-secondary border px-3" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value as any })}>{["Boudl", "Braira", "Narcissus", "Aber"].map((b) => <option key={b}>{b}</option>)}</select>
    <form className="glass-card p-4 grid md:grid-cols-2 gap-3" onSubmit={async (e) => { e.preventDefault(); const data = await api.submitComplaint(form as Record<string, unknown>); setResult({ complaintNo: data.complaint?.complaintNo, whatsappMessage: data.whatsappMessage, whatsappUrl: data.whatsappUrl }); setForm(initial); }}>
      <select className="h-11 rounded-lg bg-secondary border px-3" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value as FormState["brand"] })}>{["Boudl", "Braira", "Narcissus", "Aber"].map((b) => <option key={b}>{b}</option>)}</select>
      <select className="h-11 rounded-lg bg-secondary border px-3" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} required><option value="">اختر الفرع</option>{branches.map((b) => <option key={b}>{b}</option>)}</select>
      <input className="h-11 rounded-lg bg-secondary border px-3" placeholder="اسم الضيف" value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} required />
      <input className="h-11 rounded-lg bg-secondary border px-3" dir="ltr" placeholder="جوال الحجز" value={form.bookingMobile} onChange={(e) => setForm({ ...form, bookingMobile: e.target.value })} required />
      <input className="h-11 rounded-lg bg-secondary border px-3" dir="ltr" placeholder="جوال التواصل" value={form.contactMobile} onChange={(e) => setForm({ ...form, contactMobile: e.target.value })} required />
      <input className="h-11 rounded-lg bg-secondary border px-3" dir="ltr" placeholder="رقم السويت" value={form.suiteNumber} onChange={(e) => setForm({ ...form, suiteNumber: e.target.value })} />
      <input type="date" className="h-11 rounded-lg bg-secondary border px-3" value={form.checkInDate} onChange={(e) => setForm({ ...form, checkInDate: e.target.value })} />
      <select className="h-11 rounded-lg bg-secondary border px-3" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as any })}><option value="normal">أولوية عادية</option><option value="high">أولوية عالية</option></select>
      <select className="h-11 rounded-lg bg-secondary border px-3" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as FormState["priority"] })}><option value="normal">أولوية عادية</option><option value="high">أولوية عالية</option></select>
      <textarea className="md:col-span-2 rounded-lg bg-secondary border p-3" rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="الملاحظات" />
      <button className="md:col-span-2 h-11 rounded-lg gold-gradient text-primary-foreground">إرسال الشكوى</button>
    </form>

    {result && <div className="glass-card p-4 space-y-3"><div className="flex items-center gap-2"><MessageSquareWarning className="w-5 h-5" /> تم إنشاء الشكوى: {result.complaintNo}</div><pre className="text-xs whitespace-pre-wrap bg-secondary p-3 rounded">{result.whatsappMessage}</pre><div className="flex gap-2"><button className="h-10 px-3 rounded border" onClick={() => navigator.clipboard.writeText(result.whatsappMessage)}><Copy className="inline w-4 h-4" /> نسخ</button><a className="h-10 px-3 rounded border inline-flex items-center gap-2" href={result.whatsappUrl} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /> فتح واتساب</a></div></div>}
  </div>;
};

export default Complaints;
