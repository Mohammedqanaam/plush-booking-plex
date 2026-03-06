import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type AdminComplaint, type AdminComplaintStatus } from "@/lib/api";

const STATUS_OPTIONS: AdminComplaintStatus[] = ["جديدة", "جاري المتابعة", "تم الحل", "مؤرشف"];

const statusClassName: Record<AdminComplaintStatus, string> = {
  "جديدة": "bg-primary/15 text-primary",
  "جاري المتابعة": "bg-amber-500/15 text-amber-700",
  "تم الحل": "bg-emerald-500/15 text-emerald-700",
  "مؤرشف": "bg-slate-500/15 text-slate-700",
};

const AdminComplaints = () => {
  const [items, setItems] = useState<AdminComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAdminComplaints();
      setItems(Array.isArray(data) ? data : []);
      setMessage(null);
    } catch {
      setMessage("تعذر تحميل الشكاوى.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) => {
      const haystack = [
        item.complaintNo,
        item.brand,
        item.branch,
        item.guestName,
        item.mainCategory,
        item.subCategory,
        item.status,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [items, search]);

  const handleStatusChange = async (complaintNo: string, status: AdminComplaintStatus) => {
    try {
      const data = await api.updateAdminComplaintStatus(complaintNo, status);
      setItems((prev) =>
        prev.map((item) => (item.complaintNo === complaintNo ? data.complaint : item)),
      );
      setMessage("تم تحديث حالة الشكوى.");
    } catch {
      setMessage("تعذر تحديث حالة الشكوى.");
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">إدارة الشكاوى</h2>
          <p className="text-xs text-muted-foreground">
            مزامنة مباشرة مع الشكاوى الواردة من صفحة الشكاوى وتحديث حالتها من لوحة الأدمن.
          </p>
        </div>
        <button
          type="button"
          onClick={loadComplaints}
          className="h-10 px-4 rounded-lg border border-border text-sm"
        >
          تحديث
        </button>
      </div>

      <input
        className="w-full h-11 rounded-lg bg-secondary border border-border px-3"
        placeholder="بحث برقم الشكوى / الفرع / الضيف / الحالة"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}

      {loading ? (
        <div className="glass-card p-4 text-sm text-muted-foreground">جاري تحميل الشكاوى...</div>
      ) : null}

      {!loading && !filtered.length ? (
        <div className="glass-card p-4 text-sm text-muted-foreground">لا توجد شكاوى حالياً.</div>
      ) : null}

      <div className="space-y-2">
        {filtered.map((item) => (
          <div key={item.complaintNo} className="glass-card p-3 md:p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-sm">{item.complaintNo}</p>
                <p className="text-xs text-muted-foreground">
                  {item.brand} · {item.branch} · {new Date(item.createdAt).toLocaleString("ar-SA")}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${statusClassName[item.status] || "bg-secondary"}`}>
                {item.status}
              </span>
            </div>

            <div className="grid gap-2 text-xs md:grid-cols-2">
              <p><span className="text-muted-foreground">الضيف:</span> {item.guestName || "-"}</p>
              <p><span className="text-muted-foreground">التصنيف:</span> {item.mainCategory} / {item.subCategory}</p>
              <p><span className="text-muted-foreground">جوال الحجز:</span> {item.bookingMobile || "-"}</p>
              <p><span className="text-muted-foreground">جوال التواصل:</span> {item.contactMobile || "-"}</p>
            </div>

            {item.notes ? (
              <p className="text-xs text-muted-foreground bg-secondary/70 rounded-md p-2">{item.notes}</p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs text-muted-foreground">تغيير الحالة:</label>
              <select
                className="h-9 rounded-md border border-border bg-secondary px-2 text-sm"
                value={item.status}
                onChange={(e) =>
                  handleStatusChange(item.complaintNo, e.target.value as AdminComplaintStatus)
                }
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminComplaints;
