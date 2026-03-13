import { useEffect, useMemo, useState } from "react";
import { api, type ComplaintRecord, type ComplaintStatus } from "@/lib/api";
import { Siren } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const colors: Record<ComplaintStatus, string> = {
  open: "bg-destructive/20 text-destructive",
  under_review: "bg-warning/20 text-warning",
  closed: "bg-success/20 text-success",
};

const AdminComplaints = () => {
  const [rows, setRows] = useState<ComplaintRecord[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    const load = () => api.listComplaints().then((d) => setRows(d.complaints || [])).catch(() => setRows([]));
    load();
    const timer = window.setInterval(load, 10000);
    return () => window.clearInterval(timer);
  }, []);

  const filtered = useMemo(() => rows.filter((r) => `${r.complaintNo} ${r.guestName} ${r.branch} ${r.contactMobile}`.toLowerCase().includes(q.toLowerCase())), [rows, q]);

  return <div className="p-4 max-w-6xl mx-auto space-y-4">
    <PageHeader title="إدارة الشكاوى" subtitle="متابعة الشكاوى وتحديث حالتها بشكل مباشر." icon={Siren} />
    <input className="h-10 w-full rounded-lg bg-secondary border px-3" placeholder="بحث برقم الشكوى / اسم الضيف / الفرع / الجوال" value={q} onChange={(e) => setQ(e.target.value)} />
    <div className="space-y-2">{filtered.map((r) => <div key={r.complaintNo} className="glass-card p-3 grid md:grid-cols-5 gap-2 items-center"><div className="font-semibold">{r.complaintNo}</div><div>{r.guestName}<div className="text-xs text-muted-foreground">{r.branch}</div></div><div className="text-xs" dir="ltr">{r.contactMobile}</div><span className={`text-xs rounded-full px-2 py-1 w-fit ${colors[r.status]}`}>{r.status}</span><select className="h-9 rounded bg-secondary border px-2" value={r.status} onChange={async (e) => { const status = e.target.value as ComplaintStatus; await api.updateComplaint({ complaintNo: r.complaintNo, status }); setRows((prev) => prev.map((x) => x.complaintNo === r.complaintNo ? { ...x, status } : x)); }}><option value="open">مفتوحة</option><option value="under_review">قيد المراجعة</option><option value="closed">مغلقة</option></select></div>)}</div>
  </div>;
};

export default AdminComplaints;
