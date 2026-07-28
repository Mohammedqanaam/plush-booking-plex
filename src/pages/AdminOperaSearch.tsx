import { useEffect, useState } from "react";
import {
  Archive,
  CalendarRange,
  Database,
  ExternalLink,
  History,
  Loader2,
  Phone,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { api, type OperaReservationSummary, type OperaSearchStatus } from "@/lib/api";
import { getAdminSession } from "@/lib/adminAuth";

const OPERA_LINKS = [
  {
    label: "OPERA السعودية / القديم",
    url: "https://mtce11.oraclehospitality.eu-frankfurt-1.ocs.oraclecloud.com/BHG/operacloud",
  },
  {
    label: "OPERA الجديد",
    url: "https://mtce2.oraclehospitality.eu-frankfurt-1.ocs.oraclecloud.com/BHG/operacloud/faces/adf.task-flow?adf.tfId=opera-cloud-index&adf.tfDoc=/WEB-INF/taskflows/opera-cloud-index.xml",
  },
];

const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Riyadh",
  }).format(date);
};

const AdminOperaSearch = () => {
  const session = getAdminSession();
  const allowed = session?.role === "superadmin" || session?.role === "admin";
  const [status, setStatus] = useState<OperaSearchStatus | null>(null);
  const [mobile, setMobile] = useState("");
  const [results, setResults] = useState<OperaReservationSummary[]>([]);
  const [searched, setSearched] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    api.getOperaSearchStatus()
      .then(setStatus)
      .catch((error) => setMessage(error instanceof Error ? error.message : "تعذر تحميل حالة الأرشيف."))
      .finally(() => setLoadingStatus(false));
  }, [allowed]);

  const submitSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    setSearching(true);
    setMessage(null);
    setSearched(false);
    try {
      const data = await api.searchOperaReservations({ mobile });
      setResults(data.reservations);
      setStatus((current) => current ? { ...current, archive: data.archive } : current);
      setSearched(true);
    } catch (error) {
      setResults([]);
      setMessage(error instanceof Error ? error.message : "تعذر إكمال البحث.");
    } finally {
      setSearching(false);
    }
  };

  if (!allowed) return <Navigate to="/admin" replace />;

  const archive = status?.archive;
  const searchReady = Boolean(archive?.searchAvailable);

  return (
    <div className="page-wrap">
      <PageHeader
        title="البحث عن حجز برقم الجوال"
        icon={Search}
      />

      <section className="relative overflow-hidden rounded-[1.75rem] border border-primary/15 bg-gradient-to-br from-primary/12 via-background to-secondary/45 p-5 shadow-sm sm:p-6">
        <div className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid items-center gap-5 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/75 px-3 py-1.5 text-xs font-bold text-primary shadow-sm backdrop-blur">
              <ShieldCheck className="h-4 w-4" /> مشرف فقط · قراءة فقط
            </div>
            <h2 className="text-xl font-black tracking-tight sm:text-2xl">أرشيف حجوزات موحّد</h2>
          </div>
          <Link
            to="/admin/cro-export"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-background/80 px-4 text-sm font-bold shadow-sm interactive"
          >
            <Archive className="h-4 w-4 text-primary" /> أرشفة فترة سابقة
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="compact-card">
          <div className="flex items-center justify-between gap-2"><span className="text-xs text-muted-foreground">الفترات</span><CalendarRange className="h-4 w-4 text-primary" /></div>
          <p className="mt-2 text-xl font-black">{loadingStatus ? "…" : (archive?.periodCount || 0).toLocaleString("ar-SA")}</p>
        </div>
        <div className="compact-card">
          <div className="flex items-center justify-between gap-2"><span className="text-xs text-muted-foreground">الحجوزات المفهرسة</span><Database className="h-4 w-4 text-primary" /></div>
          <p className="mt-2 text-xl font-black">{loadingStatus ? "…" : (archive?.indexedReservations || 0).toLocaleString("ar-SA")}</p>
        </div>
        <div className="compact-card">
          <div className="flex items-center justify-between gap-2"><span className="text-xs text-muted-foreground">بداية الأرشيف</span><History className="h-4 w-4 text-primary" /></div>
          <p className="mt-2 text-sm font-black">{loadingStatus ? "…" : formatDate(archive?.earliestFrom)}</p>
        </div>
        <div className="compact-card">
          <div className="flex items-center justify-between gap-2"><span className="text-xs text-muted-foreground">نهاية الأرشيف</span><CalendarRange className="h-4 w-4 text-primary" /></div>
          <p className="mt-2 text-sm font-black">{loadingStatus ? "…" : formatDate(archive?.latestTo)}</p>
        </div>
      </section>

      {!loadingStatus && !archive?.configured ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/8 p-4 text-sm leading-7 text-amber-800">
          مفتاح الأرشيف الآمن غير مهيأ على السيرفر. يلزم تفعيل سر مزامنة CRO قبل استخدام البحث.
        </div>
      ) : null}
      {!loadingStatus && archive?.configured && !archive.periodCount ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/8 p-4 text-sm leading-7 text-amber-800">
          لا توجد فترة مؤرشفة بعد. انتقل إلى مزامنة CRO واختر فترة سابقة ثم اضغط «أرشفة فترة سابقة».
        </div>
      ) : null}
      {!loadingStatus && archive?.periodCount > 0 && archive.latestPeriodPhoneColumnCount === 0 ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm leading-7 text-red-700">
          آخر تقرير مؤرشف لا يحتوي عمود رقم الجوال. يلزم أن يتضمن تصدير CRO حقل الجوال حتى يعمل البحث.
        </div>
      ) : null}

      <form className="page-surface space-y-5" onSubmit={submitSearch}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="section-title">رقم جوال الضيف</h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" /> لا يعرض بيانات الدفع
          </span>
        </div>

        <label className="block max-w-xl space-y-2">
          <span className="text-sm font-bold">رقم الجوال</span>
          <div className="relative">
            <Phone className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
            <input
              dir="ltr"
              inputMode="tel"
              autoComplete="off"
              className="h-14 w-full rounded-2xl border bg-secondary/45 px-12 text-left text-lg font-bold tracking-wide outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
              value={mobile}
              onChange={(event) => setMobile(event.target.value)}
              placeholder="5xxxxxxxx أو 05xxxxxxxx"
              minLength={9}
              maxLength={20}
              required
            />
          </div>
        </label>

        {message ? <div aria-live="polite" className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{message}</div> : null}

        <button
          type="submit"
          disabled={searching || !searchReady}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl gold-gradient px-5 font-bold text-primary-foreground shadow-sm disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {searching ? "جاري البحث…" : "بحث في كامل الأرشيف"}
        </button>
      </form>

      {searched ? (
        <section className="page-surface space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="section-title">نتائج البحث</h2>
              <p className="mt-1 text-xs text-muted-foreground">عُثر على {results.length.toLocaleString("ar-SA")} حجز مطابق.</p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700">قراءة فقط</span>
          </div>

          {results.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {results.map((reservation, index) => (
                <article key={(reservation.confirmationNumber || reservation.reservationId || "reservation") + "-" + index} className="compact-card space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">رقم الحجز / التأكيد</p>
                      <p className="mt-1 text-lg font-black" dir="ltr">{reservation.confirmationNumber || reservation.reservationId || "—"}</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{reservation.status || "غير محدد"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="col-span-2"><p className="text-xs text-muted-foreground">الضيف</p><p className="mt-1 font-bold">{reservation.guestName || "غير متاح"}</p></div>
                    <div className="col-span-2"><p className="text-xs text-muted-foreground">الفندق</p><p className="mt-1 font-semibold">{reservation.hotelName || reservation.hotelId || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground">الوصول</p><p className="mt-1 font-semibold">{formatDate(reservation.arrivalDate)}</p></div>
                    <div><p className="text-xs text-muted-foreground">المغادرة</p><p className="mt-1 font-semibold">{formatDate(reservation.departureDate)}</p></div>
                    <div><p className="text-xs text-muted-foreground">نوع الغرفة</p><p className="mt-1 font-semibold">{reservation.roomType || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground">رقم الغرفة</p><p className="mt-1 font-semibold">{reservation.roomNumber || "غير معيّنة"}</p></div>
                  </div>
                  <div className="rounded-xl bg-secondary/45 px-3 py-2 text-xs text-muted-foreground">
                    مصدر النتيجة: أرشيف {formatDate(reservation.archivedFrom)} — {formatDate(reservation.archivedTo)}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid min-h-36 place-items-center rounded-2xl border border-dashed px-4 text-center text-sm leading-7 text-muted-foreground">
              لا توجد حجوزات مطابقة داخل الفترات المؤرشفة. يمكن أرشفة فترة أقدم ثم إعادة البحث.
            </div>
          )}
        </section>
      ) : null}

      <section className="page-surface space-y-3">
        <div>
          <h2 className="section-title">الدخول الرسمي إلى OPERA</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {OPERA_LINKS.map((item) => (
            <a key={item.label} href={item.url} target="_blank" rel="noreferrer noopener" className="compact-card flex items-center justify-between gap-3 text-sm font-bold interactive">
              <span>{item.label}</span><ExternalLink className="h-4 w-4 shrink-0 text-primary" />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminOperaSearch;
