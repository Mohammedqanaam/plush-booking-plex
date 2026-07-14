import { BadgeCheck, Banknote, CalendarClock, FileText, LockKeyhole, Route, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const statusRows = [
  { code: "M", label: "مؤكد", category: "confirmed" },
  { code: "O", label: "مؤكد", category: "confirmed" },
  { code: "N", label: "مؤكد", category: "confirmed" },
  { code: "I", label: "مؤكد", category: "confirmed" },
  { code: "C", label: "ملغي", category: "cancelled" },
  { code: "NS", label: "عدم حضور — ملغي", category: "cancelled" },
] as const;

const policies = [
  {
    title: "السداد وتثبيت الحجز",
    icon: Banknote,
    summary: "يُرسل رابط الدفع آليًا برسالة نصية بعد تأكيد الحجز.",
    points: [
      "يُطلب من الضيف إتمام السداد خلال المهلة المحددة لضمان عدم إلغاء الحجز.",
      "لا يرسل الموظف رابطًا يدويًا ما دام النظام أرسله آليًا.",
      "يُستثنى الضيف الموجود في الاستقبال أثناء المكالمة وفق الإجراء التشغيلي.",
    ],
  },
  {
    title: "الإلغاء وعدم الحضور",
    icon: CalendarClock,
    summary: "تُطبّق المدة المعتمدة بحسب الموسم ونوع الحجز.",
    points: [
      "المواسم وفترات الذروة: الإلغاء المجاني حتى 48 ساعة قبل الوصول.",
      "خارج المواسم: الإلغاء المجاني حتى 24 ساعة قبل الوصول.",
      "حالة NS تعني عدم حضور وتُحتسب ضمن الحجوزات الملغاة في التقارير.",
    ],
  },
  {
    title: "الوصول والمغادرة",
    icon: Route,
    summary: "الوصول المبكر غير مضمون ويرتبط بتوفر الغرف يوم الوصول.",
    points: [
      "أبكر وقت مقترح للوصول المبكر هو 08:00 صباحًا بحسب التوفر.",
      "يتم التحقق والتأكيد في يوم الوصول بعد 06:00 صباحًا.",
      "لا يُعد توفر الغرفة وقت الاستفسار ضمانًا نهائيًا للوصول المبكر.",
    ],
  },
  {
    title: "نطاق اختصاص الحجز المركزي",
    icon: ShieldCheck,
    summary: "يعالج المركز الحجوزات المنشأة من قنوات الحجز المركزي التابعة له.",
    points: [
      "حجوزات التطبيق تُعالج عبر الدعم الفني داخل التطبيق عند الحاجة.",
      "حجوزات منصات OTA مثل Booking وAgoda تُعدّل أو تُلغى من منصة الحجز الأصلية.",
      "تُرفع شكوى عند تعذر المعالجة من الجهة المختصة بعد توثيق محاولة الضيف.",
    ],
  },
  {
    title: "خصوصية بيانات الضيف",
    icon: LockKeyhole,
    summary: "لا تُفصح بيانات الحجز قبل التحقق من هوية المتصل وارتباطه بالحجز.",
    points: [
      "يُتحقق من اسم الضيف ورقم الجوال وتاريخ الوصول ونوع الغرفة.",
      "لا تُشارك أرقام الجوال أو تفاصيل الإقامة مع طرف غير مخول.",
      "تُستخدم البيانات للأغراض التشغيلية فقط ووفق الصلاحيات الممنوحة.",
    ],
  },
];

const Policies = () => (
  <div className="page-wrap">
    <PageHeader title="السياسات التشغيلية" subtitle="مرجع سريع للسياسات الأكثر استخدامًا في الحجز المركزي." icon={FileText} />

    <section className="page-surface space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold">تصنيف حالات الحجوزات في التقارير</p>
          <p className="mt-1 text-xs text-muted-foreground">الحالات غير المدرجة لا تُحتسب تلقائيًا وتحتاج مراجعة قبل اعتماد التقرير.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-bold text-primary"><BadgeCheck className="h-4 w-4" /> التصنيف المعتمد</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {statusRows.map((status) => (
          <div key={status.code} className={`rounded-2xl border p-3 text-center ${status.category === "confirmed" ? "border-emerald-400/30 bg-emerald-400/10" : "border-rose-400/30 bg-rose-400/10"}`}>
            <p dir="ltr" className={`text-xl font-black ${status.category === "confirmed" ? "text-emerald-300" : "text-rose-300"}`}>{status.code}</p>
            <p className="mt-1 text-xs text-muted-foreground">{status.label}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {policies.map((policy) => (
        <article key={policy.title} className="page-surface card-hover">
          <div className="flex items-start gap-3">
            <span className="icon-chip h-11 w-11 shrink-0"><policy.icon className="h-5 w-5" /></span>
            <div>
              <h2 className="font-black">{policy.title}</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{policy.summary}</p>
            </div>
          </div>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-muted-foreground">
            {policy.points.map((point) => <li key={point} className="flex items-start gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{point}</li>)}
          </ul>
        </article>
      ))}
    </section>

    <p className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-xs leading-6 text-amber-100">عند تعارض هذا الملخص مع تعميم أحدث أو سياسة خاصة بفرع أو موسم، يُعمل بالتعميم الأحدث بعد التحقق من مصدره.</p>
  </div>
);

export default Policies;
