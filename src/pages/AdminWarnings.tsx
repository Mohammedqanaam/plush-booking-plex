import { FormEvent, useEffect, useMemo, useState } from "react";
import { Archive, FileDown, FileWarning, Plus, Printer, RotateCcw, Trash2 } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { api } from "@/lib/api";
import { getAdminSession, hasPermission } from "@/lib/adminAuth";

type WarningLevel = "لفت نظر" | "إنذار أول" | "إنذار ثانٍ" | "إنذار نهائي";

type WarningRecord = {
  id: string;
  employeeName: string;
  employeeNumber: string;
  department: string;
  violationType: string;
  violationDate: string;
  signatureDate: string;
  warningLevel: WarningLevel;
  details: string;
  requiredAction: string;
  supervisorName: string;
  createdAt: string;
};

const STORAGE_KEY = "res_admin_employee_warnings_v1";
const today = () => new Date().toISOString().slice(0, 10);

const EMPTY_WARNING: Omit<WarningRecord, "id" | "createdAt"> = {
  employeeName: "",
  employeeNumber: "",
  department: "إدارة الحجز المركزي",
  violationType: "",
  violationDate: today(),
  signatureDate: today(),
  warningLevel: "إنذار أول",
  details: "",
  requiredAction: "الالتزام بالأنظمة والتعليمات المعتمدة وعدم تكرار المخالفة.",
  supervisorName: "",
};

const VIOLATION_TYPES = [
  "التأخر أو عدم الالتزام بوقت العمل",
  "الغياب دون إذن أو عذر معتمد",
  "عدم الالتزام بإجراءات الحجز",
  "مخالفة ضوابط الاستراحة أو وضع عدم الجاهزية",
  "التقصير في متابعة المكالمات أو المحادثات",
  "عدم الالتزام بجودة الخدمة أو أسلوب التواصل",
  "إفشاء أو سوء التعامل مع بيانات الضيوف",
  "عدم تنفيذ توجيهات المشرف المعتمدة",
  "أخرى",
];

const formatArabicDate = (value: string) => {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("ar-SA", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
};

const readArchive = (): WarningRecord[] => {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const AdminWarnings = () => {
  const navigate = useNavigate();
  const session = getAdminSession();
  const [form, setForm] = useState(EMPTY_WARNING);
  const [archive, setArchive] = useState<WarningRecord[]>(readArchive);
  const [employeeNames, setEmployeeNames] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.getPublicBookingReport().then((report) => {
      setEmployeeNames(report.employees.map((employee) => employee.name).filter(Boolean).sort((a, b) => a.localeCompare(b, "ar")));
    }).catch(() => setEmployeeNames([]));
  }, []);

  const currentRecord = useMemo<WarningRecord>(() => ({
    ...form,
    id: "preview",
    createdAt: new Date().toISOString(),
  }), [form]);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((current) => ({ ...current, [key]: value }));

  const resetForm = () => {
    setForm({ ...EMPTY_WARNING, violationDate: today(), signatureDate: today(), supervisorName: session?.username || "" });
    setMessage("");
  };

  const saveToArchive = (event?: FormEvent) => {
    event?.preventDefault();
    if (!form.employeeName.trim() || !form.violationType.trim() || !form.violationDate || !form.signatureDate) {
      setMessage("أكمل اسم الموظف ونوع المخالفة وتاريخي المخالفة والتوقيع.");
      return false;
    }
    const record: WarningRecord = { ...form, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const next = [record, ...archive].slice(0, 100);
    setArchive(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setMessage("تم حفظ الإنذار في الأرشيف، ويمكن الآن طباعته أو حفظه PDF.");
    return true;
  };

  const printWarning = () => {
    if (!form.employeeName.trim() || !form.violationType.trim()) {
      setMessage("أدخل اسم الموظف ونوع المخالفة قبل التصدير.");
      return;
    }
    window.print();
  };

  const loadRecord = (record: WarningRecord) => {
    const { id: _id, createdAt: _createdAt, ...data } = record;
    setForm(data);
    setMessage("تم تحميل الإنذار للمعاينة وإعادة الطباعة.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteRecord = (id: string) => {
    if (!window.confirm("حذف هذا الإنذار من الأرشيف؟")) return;
    const next = archive.filter((record) => record.id !== id);
    setArchive(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  if (!session || !hasPermission(session.role, "manage_employees")) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="page-wrap warning-generator-page">
      <div className="warning-screen-only">
        <PageHeader title="إنذارات الموظفين" icon={FileWarning} onBack={() => navigate("/admin?tab=employees")} />

        {message ? <div className="rounded-xl border border-primary/20 bg-primary/8 p-3 text-sm" role="status">{message}</div> : null}

        <div className="grid items-start gap-4 xl:grid-cols-[0.82fr_1.18fr]">
          <form className="page-surface space-y-4" onSubmit={saveToArchive}>
            <div>
              <h2 className="section-title">بيانات الإنذار</h2>
              <p className="mt-1 text-xs text-muted-foreground">الحقول المعلّمة مطلوبة، والتفاصيل تظهر مباشرة في المعاينة.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs sm:col-span-2"><span className="mb-1 block font-bold">اسم الموظف *</span><input required list="warning-employees" className="h-11 w-full rounded-xl border px-3" value={form.employeeName} onChange={(event) => update("employeeName", event.target.value)} placeholder="اكتب الاسم أو اختره" /><datalist id="warning-employees">{employeeNames.map((name) => <option value={name} key={name} />)}</datalist></label>
              <label className="text-xs"><span className="mb-1 block font-bold">الرقم الوظيفي</span><input className="h-11 w-full rounded-xl border px-3" value={form.employeeNumber} onChange={(event) => update("employeeNumber", event.target.value)} inputMode="numeric" /></label>
              <label className="text-xs"><span className="mb-1 block font-bold">الإدارة</span><input className="h-11 w-full rounded-xl border px-3" value={form.department} onChange={(event) => update("department", event.target.value)} /></label>
              <label className="text-xs sm:col-span-2"><span className="mb-1 block font-bold">نوع المخالفة *</span><select required className="h-11 w-full rounded-xl border px-3" value={form.violationType} onChange={(event) => update("violationType", event.target.value)}><option value="">اختر نوع المخالفة</option>{VIOLATION_TYPES.map((type) => <option value={type} key={type}>{type}</option>)}</select></label>
              <label className="text-xs"><span className="mb-1 block font-bold">تاريخ المخالفة *</span><input required type="date" className="h-11 w-full rounded-xl border px-3" value={form.violationDate} onChange={(event) => update("violationDate", event.target.value)} /></label>
              <label className="text-xs"><span className="mb-1 block font-bold">تاريخ توقيع الموظف *</span><input required type="date" className="h-11 w-full rounded-xl border px-3" value={form.signatureDate} onChange={(event) => update("signatureDate", event.target.value)} /></label>
              <label className="text-xs sm:col-span-2"><span className="mb-1 block font-bold">درجة الإنذار</span><select className="h-11 w-full rounded-xl border px-3" value={form.warningLevel} onChange={(event) => update("warningLevel", event.target.value as WarningLevel)}>{(["لفت نظر", "إنذار أول", "إنذار ثانٍ", "إنذار نهائي"] as WarningLevel[]).map((level) => <option value={level} key={level}>{level}</option>)}</select></label>
              <label className="text-xs sm:col-span-2"><span className="mb-1 block font-bold">تفاصيل المخالفة</span><textarea rows={4} className="w-full rounded-xl border px-3 py-2" value={form.details} onChange={(event) => update("details", event.target.value)} placeholder="اكتب وصفًا موضوعيًا ومختصرًا لما حدث…" /></label>
              <label className="text-xs sm:col-span-2"><span className="mb-1 block font-bold">الإجراء المطلوب</span><textarea rows={3} className="w-full rounded-xl border px-3 py-2" value={form.requiredAction} onChange={(event) => update("requiredAction", event.target.value)} /></label>
              <label className="text-xs sm:col-span-2"><span className="mb-1 block font-bold">اسم المشرف</span><input className="h-11 w-full rounded-xl border px-3" value={form.supervisorName} onChange={(event) => update("supervisorName", event.target.value)} /></label>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="submit" className="inline-flex h-11 items-center gap-2 rounded-xl gold-gradient px-4 font-bold text-primary-foreground"><Archive className="h-4 w-4" /> حفظ في الأرشيف</button>
              <button type="button" onClick={printWarning} className="inline-flex h-11 items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 font-bold text-primary"><FileDown className="h-4 w-4" /> تصدير PDF</button>
              <button type="button" onClick={resetForm} className="inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm"><RotateCcw className="h-4 w-4" /> نموذج جديد</button>
            </div>
          </form>

          <section className="space-y-2 xl:sticky xl:top-20">
            <div className="flex items-center justify-between gap-2 px-1"><div><h2 className="section-title">المعاينة</h2><p className="text-xs text-muted-foreground">A4 · جاهزة للطباعة</p></div><button type="button" onClick={printWarning} className="inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold"><Printer className="h-4 w-4" /> طباعة</button></div>
            <WarningDocument record={currentRecord} />
          </section>
        </div>

        <section className="page-surface space-y-3">
          <div className="flex items-center justify-between"><div><h2 className="section-title">أرشيف الإنذارات</h2><p className="mt-1 text-xs text-muted-foreground">محفوظ على هذا الجهاز فقط · آخر {archive.length.toLocaleString("ar-SA")} سجل</p></div><Plus className="h-5 w-5 text-primary" /></div>
          <div className="grid gap-2 md:grid-cols-2">
            {archive.map((record) => <article className="compact-card flex items-center justify-between gap-3" key={record.id}><button type="button" className="min-w-0 flex-1 text-right" onClick={() => loadRecord(record)}><strong className="block truncate">{record.employeeName}</strong><span className="mt-1 block truncate text-xs text-muted-foreground">{record.warningLevel} · {record.violationType} · {formatArabicDate(record.violationDate)}</span></button><button type="button" aria-label={`حذف إنذار ${record.employeeName}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-destructive hover:bg-destructive/10" onClick={() => deleteRecord(record.id)}><Trash2 className="h-4 w-4" /></button></article>)}
            {!archive.length ? <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground md:col-span-2">لا توجد إنذارات محفوظة بعد.</div> : null}
          </div>
        </section>
      </div>

      <div className="warning-print-only"><WarningDocument record={currentRecord} /></div>
    </div>
  );
};

const WarningDocument = ({ record }: { record: WarningRecord }) => (
  <article className="warning-document" dir="rtl">
    <header className="warning-document__header">
      <div className="warning-document__brand"><img src="/bhg-hospitality-group.jpg" alt="مجموعة بودل للضيافة" /></div>
      <div className="warning-document__meta"><span>إدارة الحجز المركزي</span><small>نموذج إجراء إداري</small></div>
    </header>
    <div className="warning-document__rule" />
    <div className="warning-document__title"><span>{record.warningLevel}</span><h1>إنذار موظف</h1><p>حرصًا على الالتزام بالأنظمة والتعليمات المعتمدة</p></div>

    <dl className="warning-document__fields">
      <div><dt>اسم الموظف</dt><dd>{record.employeeName || "................................................"}</dd></div>
      <div><dt>الرقم الوظيفي</dt><dd>{record.employeeNumber || "........................"}</dd></div>
      <div><dt>الإدارة</dt><dd>{record.department || "إدارة الحجز المركزي"}</dd></div>
      <div><dt>تاريخ المخالفة</dt><dd>{formatArabicDate(record.violationDate)}</dd></div>
      <div className="warning-document__field-wide"><dt>نوع المخالفة</dt><dd>{record.violationType || "................................................"}</dd></div>
    </dl>

    <section className="warning-document__section"><h2>تفاصيل المخالفة</h2><p>{record.details.trim() || "وفقًا لما تم رصده والتحقق منه، صدرت من الموظف المخالفة الموضحة أعلاه، وتمت إفادته بها وبيان ما يلزم لتصحيحها."}</p></section>
    <section className="warning-document__section warning-document__action"><h2>الإجراء المطلوب</h2><p>{record.requiredAction}</p></section>
    <section className="warning-document__ack"><h2>إقرار الموظف</h2><p>أقرّ أنا الموظف الموضح اسمي أعلاه بالاطلاع على مضمون هذا الإنذار، وقد تم إفهامي بالمخالفة والإجراء المطلوب. ويعد توقيعي إثباتًا بالاستلام والعلم دون أن يخل بحقي في تقديم إفادة مكتوبة.</p></section>

    <div className="warning-document__signatures">
      <div><strong>الموظف</strong><span>الاسم: {record.employeeName || "........................"}</span><span>التوقيع: ............................</span><span>التاريخ: {formatArabicDate(record.signatureDate)}</span></div>
      <div><strong>المشرف المباشر</strong><span>الاسم: {record.supervisorName || "........................"}</span><span>التوقيع: ............................</span><span>التاريخ: ............................</span></div>
      <div><strong>مدير إدارة الحجز</strong><span>الاسم: ............................</span><span>التوقيع: ............................</span><span>التاريخ: ............................</span></div>
    </div>

    <footer className="warning-document__footer"><div className="warning-document__footer-logo"><img src="/bhg-hospitality-group.jpg" alt="" /></div><p>مجموعة بودل للضيافة · نموذج داخلي سري</p></footer>
  </article>
);

export default AdminWarnings;
