import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  ExternalLink,
  KeyRound,
  Loader2,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Navigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { api, type OperaReservationSummary, type OperaSearchStatus } from "@/lib/api";
import { getAdminSession } from "@/lib/adminAuth";

type OperaEnvironmentId = "legacy" | "new";

const AdminOperaSearch = () => {
  const session = getAdminSession();
  const allowed = session?.role === "superadmin" || session?.role === "admin";
  const [status, setStatus] = useState<OperaSearchStatus | null>(null);
  const [environment, setEnvironment] = useState<OperaEnvironmentId>("legacy");
  const [hotelId, setHotelId] = useState("");
  const [query, setQuery] = useState("");
  const [arrivalStartDate, setArrivalStartDate] = useState("");
  const [arrivalEndDate, setArrivalEndDate] = useState("");
  const [departureStartDate, setDepartureStartDate] = useState("");
  const [departureEndDate, setDepartureEndDate] = useState("");
  const [results, setResults] = useState<OperaReservationSummary[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [searched, setSearched] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    api.getOperaSearchStatus()
      .then((data) => {
        setStatus(data);
        const preferred = data.environments.find((item) => item.configured) || data.environments[0];
        if (preferred) {
          setEnvironment(preferred.id);
          setHotelId(preferred.hotels[0]?.id || "");
        }
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "تعذر تحميل حالة ربط OPERA."))
      .finally(() => setLoadingStatus(false));
  }, [allowed]);

  const selectedEnvironment = useMemo(
    () => status?.environments.find((item) => item.id === environment) || null,
    [environment, status],
  );

  const changeEnvironment = (value: OperaEnvironmentId) => {
    setEnvironment(value);
    const next = status?.environments.find((item) => item.id === value);
    setHotelId(next?.hotels[0]?.id || "");
    setResults([]);
    setTotalResults(0);
    setSearched(false);
    setMessage(null);
  };

  const submitSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedEnvironment?.configured) {
      setMessage("هذه البيئة غير مهيأة بعد بمفاتيح OHIP وأكواد الفنادق.");
      return;
    }
    setSearching(true);
    setMessage(null);
    setSearched(false);
    try {
      const data = await api.searchOperaReservations({
        environment,
        hotelId,
        query,
        arrivalStartDate,
        arrivalEndDate,
        departureStartDate,
        departureEndDate,
      });
      setResults(data.reservations);
      setTotalResults(data.totalResults);
      setSearched(true);
    } catch (error) {
      setResults([]);
      setTotalResults(0);
      setMessage(error instanceof Error ? error.message : "تعذر إكمال البحث.");
    } finally {
      setSearching(false);
    }
  };

  if (!allowed) return <Navigate to="/admin" replace />;

  return (
    <div className="page-wrap">
      <PageHeader
        title="البحث في حجوزات OPERA"
        subtitle="بحث آمن للقراءة فقط من داخل لوحة الإدارة."
        icon={Search}
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="compact-card">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">الصلاحية</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 font-bold">مشرف فقط</p>
        </div>
        <div className="compact-card">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">طريقة الربط</span>
            <KeyRound className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 font-bold">OHIP خادمي</p>
        </div>
        <div className="compact-card">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">نطاق البيانات</span>
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 font-bold">الفروع المصرح بها</p>
        </div>
      </section>

      <section className="page-surface space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="section-title">بيئة OPERA</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              لا تُرسل بيانات OPERA إلى المتصفح، ولا يعرض البحث بيانات الدفع أو وسائل التواصل.
            </p>
          </div>
          {selectedEnvironment?.uiUrl ? (
            <a
              href={selectedEnvironment.uiUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-primary/20 px-3 text-xs font-bold interactive"
            >
              <ExternalLink className="h-4 w-4" /> فتح OPERA
            </a>
          ) : null}
        </div>

        {loadingStatus ? (
          <div className="flex min-h-24 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> جاري التحقق من الربط…
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {status?.environments.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => changeEnvironment(item.id)}
                className={"compact-card text-right interactive " + (environment === item.id ? "border-primary/50 bg-primary/10" : "")}
              >
                <div className="flex items-center justify-between gap-3">
                  <strong>{item.label}</strong>
                  <span className={"rounded-full px-2 py-1 text-[11px] font-bold " + (item.configured ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-700")}>
                    {item.configured ? "جاهز" : "يحتاج إعداد"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {item.configured ? item.hotels.length + " فرعًا مفعّلًا" : "يلزم إضافة مفاتيح OHIP وأكواد الفنادق في Netlify."}
                </p>
              </button>
            ))}
          </div>
        )}

        {selectedEnvironment && !selectedEnvironment.configured ? (
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/8 p-4 text-sm leading-7 text-amber-800">
            الواجهة جاهزة، لكن البحث الفعلي لن يعمل قبل إضافة إعدادات OHIP الرسمية لهذه البيئة. بيانات دخول واجهة OPERA العادية لا تكفي للربط البرمجي.
          </div>
        ) : null}
      </section>

      <form className="page-surface space-y-5" onSubmit={submitSearch}>
        <div>
          <h2 className="section-title">بيانات البحث</h2>
          <p className="mt-1 text-xs text-muted-foreground">ابحث برقم التأكيد أو اسم الضيف، ويمكن تضييق النتائج بالتواريخ.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-bold">الفندق</span>
            <select
              className="h-12 w-full rounded-xl border bg-secondary/50 px-3"
              value={hotelId}
              onChange={(event) => setHotelId(event.target.value)}
              disabled={!selectedEnvironment?.configured}
              required
            >
              <option value="">اختر الفندق</option>
              {selectedEnvironment?.hotels.map((hotel) => (
                <option key={hotel.id} value={hotel.id}>{hotel.name} · {hotel.id}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold">رقم التأكيد أو اسم الضيف</span>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-12 w-full rounded-xl border bg-secondary/50 px-10"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="مثال: 123456 أو اسم الضيف"
                minLength={2}
                maxLength={80}
                autoComplete="off"
                required
              />
            </div>
          </label>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <fieldset className="compact-card space-y-3">
            <legend className="px-2 text-sm font-bold">تاريخ الوصول — اختياري</legend>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-2 text-xs text-muted-foreground">
                <span>من</span>
                <input className="h-11 w-full rounded-xl border bg-background px-3" type="date" value={arrivalStartDate} onChange={(event) => setArrivalStartDate(event.target.value)} />
              </label>
              <label className="space-y-2 text-xs text-muted-foreground">
                <span>إلى</span>
                <input className="h-11 w-full rounded-xl border bg-background px-3" type="date" value={arrivalEndDate} onChange={(event) => setArrivalEndDate(event.target.value)} />
              </label>
            </div>
          </fieldset>

          <fieldset className="compact-card space-y-3">
            <legend className="px-2 text-sm font-bold">تاريخ المغادرة — اختياري</legend>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-2 text-xs text-muted-foreground">
                <span>من</span>
                <input className="h-11 w-full rounded-xl border bg-background px-3" type="date" value={departureStartDate} onChange={(event) => setDepartureStartDate(event.target.value)} />
              </label>
              <label className="space-y-2 text-xs text-muted-foreground">
                <span>إلى</span>
                <input className="h-11 w-full rounded-xl border bg-background px-3" type="date" value={departureEndDate} onChange={(event) => setDepartureEndDate(event.target.value)} />
              </label>
            </div>
          </fieldset>
        </div>

        {message ? <div aria-live="polite" className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{message}</div> : null}

        <button
          type="submit"
          disabled={searching || !selectedEnvironment?.configured}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl gold-gradient px-5 font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {searching ? "جاري البحث…" : "بحث في الحجوزات"}
        </button>
      </form>

      {searched ? (
        <section className="page-surface space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="section-title">نتائج البحث</h2>
              <p className="mt-1 text-xs text-muted-foreground">عُثر على {totalResults.toLocaleString("ar-SA")} نتيجة.</p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700">قراءة فقط</span>
          </div>

          {results.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {results.map((reservation, index) => (
                <article key={(reservation.confirmationNumber || reservation.reservationId || "reservation") + "-" + index} className="compact-card space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">رقم التأكيد</p>
                      <p className="mt-1 text-lg font-black" dir="ltr">{reservation.confirmationNumber || "—"}</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{reservation.status || "غير محدد"}</span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">الضيف</p>
                    <p className="mt-1 font-bold">{reservation.guestName || "غير متاح"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-muted-foreground">الوصول</p><p className="mt-1 font-semibold" dir="ltr">{reservation.arrivalDate || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground">المغادرة</p><p className="mt-1 font-semibold" dir="ltr">{reservation.departureDate || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground">نوع الغرفة</p><p className="mt-1 font-semibold">{reservation.roomType || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground">رقم الغرفة</p><p className="mt-1 font-semibold">{reservation.roomNumber || "غير معيّنة"}</p></div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid min-h-36 place-items-center rounded-2xl border border-dashed text-sm text-muted-foreground">
              لا توجد حجوزات مطابقة لهذه البيانات.
            </div>
          )}
        </section>
      ) : null}

      <div className="flex items-center gap-2 rounded-2xl border border-primary/12 bg-secondary/20 px-4 py-3 text-xs leading-5 text-muted-foreground">
        <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
        نطاقات التاريخ محدودة إلى 31 يومًا لتقليل الحمل وتكاليف استدعاءات OHIP.
      </div>
    </div>
  );
};

export default AdminOperaSearch;
