import { useEffect, useMemo, useState } from "react";
import { api, type ComplaintRecord, type ComplaintStatus } from "@/lib/api";
import { Search, Siren } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const statusBadge: Record<ComplaintStatus, string> = {
  open: "bg-destructive/20 text-destructive",
  under_review: "bg-warning/20 text-warning",
  closed: "bg-success/20 text-success",
};

const statusLabel: Record<ComplaintStatus, string> = {
  open: "مفتوحة",
  under_review: "قيد المراجعة",
  closed: "مغلقة",
};

const AdminComplaints = () => {
  const [rows, setRows] = useState<ComplaintRecord[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      setLoading(true);
      api.listComplaints().then((d) => setRows(d.complaints || [])).catch(() => setRows([])).finally(() => setLoading(false));
    };
    load();
    const timer = window.setInterval(load, 10000);
    return () => window.clearInterval(timer);
  }, []);

  const filtered = useMemo(
    () => rows.filter((r) => `${r.complaintNo} ${r.guestName} ${r.branch} ${r.contactMobile}`.toLowerCase().includes(q.toLowerCase())),
    [rows, q],
  );

  return <div className="p-4 max-w-6xl mx-auto space-y-4">
    <PageHeader title="إدارة الشكاوى" subtitle="متابعة الشكاوى وتحديث حالتها بشكل مباشر." icon={Siren} />
    <div className="relative">
      <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input className="h-11 w-full rounded-xl bg-secondary border px-10" placeholder="بحث برقم الشكوى / اسم الضيف / الفرع / الجوال" value={q} onChange={(e) => setQ(e.target.value)} />
    </div>

    {loading ? <div className="page-surface text-sm text-muted-foreground">جارٍ تحميل الشكاوى...</div> : null}

    {!loading && filtered.length === 0 ? <div className="page-surface text-sm text-muted-foreground">لا توجد شكاوى مطابقة للبحث الحالي.</div> : null}

    <div className="space-y-2">{filtered.map((r) => <div key={r.complaintNo} className="page-surface grid md:grid-cols-5 gap-2 items-center"><div className="font-semibold">{r.complaintNo}</div><div>{r.guestName}<div className="text-xs text-muted-foreground">{r.branch}</div></div><div className="text-xs" dir="ltr">{r.contactMobile}</div><span className={`text-xs rounded-full px-2 py-1 w-fit ${statusBadge[r.status]}`}>{statusLabel[r.status]}</span><select className="h-9 rounded bg-secondary border px-2" value={r.status} onChange={async (e) => { const status = e.target.value as ComplaintStatus; await api.updateComplaint({ complaintNo: r.complaintNo, status }); setRows((prev) => prev.map((x) => x.complaintNo === r.complaintNo ? { ...x, status } : x)); }}><option value="open">مفتوحة</option><option value="under_review">قيد المراجعة</option><option value="closed">مغلقة</option></select></div>)}</div>
  </div>;
};

export default AdminComplaints;
