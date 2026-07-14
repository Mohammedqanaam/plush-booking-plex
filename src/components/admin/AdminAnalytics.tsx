import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Eye, Laptop, Radio, RefreshCw, UsersRound } from "lucide-react";
import { api, type AnalyticsSummary } from "@/lib/api";

const pageNames: Record<string, string> = {
  "/": "الرئيسية",
  "/operations": "البحث",
  "/branches": "دليل الفروع",
  "/knowledge-bank": "بنك المعلومات",
  "/policies": "السياسات",
  "/complaints": "الشكاوى",
  "/contact-requests": "طلبات التواصل",
  "/employees": "نتائج الموظفين",
  "/booking-reports": "تقارير الحجوزات",
  "/admin": "لوحة المشرف",
  "/admin/login": "دخول المشرف",
};

const sortedEntries = (values: Record<string, number>) =>
  Object.entries(values).sort((a, b) => b[1] - a[1]);

const AdminAnalytics = () => {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      setData(await api.getAnalytics(days));
      setError("");
    } catch {
      setError("تعذر تحميل إحصائيات الموقع حاليًا.");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load(true);
    const timer = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const maxTrendViews = useMemo(
    () => Math.max(1, ...(data?.trend.map((item) => item.views) || [1])),
    [data],
  );

  if (loading && !data) {
    return <div className="page-surface text-sm text-muted-foreground">جاري تحميل إحصائيات الزيارات…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-bold">إحصائيات زيارة الموقع</h2>
          <p className="mt-1 text-xs text-muted-foreground">المتصل الآن هو المستخدم الذي أرسل نشاطًا خلال آخر دقيقتين.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-10 rounded-xl border border-primary/15 bg-secondary/50 px-3 text-sm"
            value={days}
            onChange={(event) => setDays(Number(event.target.value) as 7 | 30 | 90)}
          >
            <option value={7}>آخر 7 أيام</option>
            <option value={30}>آخر 30 يومًا</option>
            <option value={90}>آخر 90 يومًا</option>
          </select>
          <button className="h-10 rounded-xl border border-primary/15 px-3" onClick={() => void load(true)} aria-label="تحديث الإحصائيات">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error ? <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {[
          { label: "متصل الآن", value: data?.onlineCount || 0, icon: Radio, live: true },
          { label: "زيارات اليوم", value: data?.todayViews || 0, icon: Eye },
          { label: "زوار اليوم", value: data?.todayVisitors || 0, icon: UsersRound },
          { label: "إجمالي المشاهدات", value: data?.totalViews || 0, icon: Activity },
          { label: "الزوار الفريدون", value: data?.uniqueVisitors || 0, icon: UsersRound },
          { label: "الجلسات", value: data?.sessions || 0, icon: Laptop },
        ].map((item) => (
          <div key={item.label} className="compact-card">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <item.icon className={`h-4 w-4 ${item.live ? "text-emerald-400" : "text-primary"}`} />
            </div>
            <p className="mt-2 text-2xl font-black tabular-nums">{item.value.toLocaleString("ar-SA")}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <section className="page-surface space-y-3">
          <h3 className="text-sm font-bold">حركة الزيارات اليومية</h3>
          <div className="max-h-[360px] space-y-2 overflow-auto custom-scrollbar">
            {(data?.trend || []).map((item) => (
              <div key={item.date} className="grid grid-cols-[85px_1fr_auto] items-center gap-3 text-xs">
                <span className="text-muted-foreground" dir="ltr">{item.date.slice(5)}</span>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full gold-gradient" style={{ width: `${Math.max(2, (item.views / maxTrendViews) * 100)}%` }} />
                </div>
                <span className="min-w-20 text-left tabular-nums">{item.views} زيارة · {item.visitors} زائر</span>
              </div>
            ))}
          </div>
        </section>

        <section className="page-surface space-y-3">
          <h3 className="text-sm font-bold">الصفحات الأكثر زيارة</h3>
          <div className="space-y-2">
            {sortedEntries(data?.pages || {}).slice(0, 10).map(([path, count]) => (
              <div key={path} className="flex items-center justify-between gap-3 rounded-xl border border-primary/12 bg-secondary/20 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{pageNames[path] || path}</p>
                  <p className="truncate text-[11px] text-muted-foreground" dir="ltr">{path}</p>
                </div>
                <span className="font-bold tabular-nums text-primary">{count.toLocaleString("ar-SA")}</span>
              </div>
            ))}
            {!Object.keys(data?.pages || {}).length ? <p className="text-xs text-muted-foreground">ستظهر البيانات بعد بدء تسجيل الزيارات.</p> : null}
          </div>
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["نوع الجهاز", data?.devices || {}],
          ["المتصفح", data?.browsers || {}],
          ["النظام", data?.operatingSystems || {}],
        ].map(([title, values]) => (
          <section key={title as string} className="page-surface space-y-3">
            <h3 className="text-sm font-bold">{title as string}</h3>
            {sortedEntries(values as Record<string, number>).map(([label, count]) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-bold tabular-nums">{count.toLocaleString("ar-SA")}</span>
              </div>
            ))}
          </section>
        ))}
      </div>

      <section className="page-surface space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">المستخدمون المتصلون الآن</h3>
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">{data?.onlineCount || 0} متصل</span>
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {(data?.online || []).map((user) => (
            <div key={user.visitorId} className="rounded-xl border border-primary/12 bg-secondary/20 p-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold">زائر {user.visitorId.slice(-6)}</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>
              <p className="mt-2 text-muted-foreground">{user.device} · {user.browser} · {user.os}</p>
              <p className="mt-1 text-muted-foreground">{user.city}، {user.country}</p>
              <p className="mt-1 truncate" dir="ltr">{user.path}</p>
            </div>
          ))}
          {!data?.online.length ? <p className="text-xs text-muted-foreground">لا يوجد مستخدم نشط خلال آخر دقيقتين.</p> : null}
        </div>
      </section>

      <p className="text-[11px] text-muted-foreground">لا يتم حفظ عنوان IP أو الاسم أو رقم الجوال؛ يُستخدم معرّف عشوائي للمتصفح فقط لأغراض العد.</p>
    </div>
  );
};

export default AdminAnalytics;
