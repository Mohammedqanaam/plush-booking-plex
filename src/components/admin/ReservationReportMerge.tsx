import { useRef, useState } from "react";
import { CheckCircle2, Download, FileSpreadsheet, GitMerge, Loader2, Plus, Trash2, UploadCloud, X } from "lucide-react";
import { api } from "@/lib/api";
import {
  mergeReservationReports,
  parseReservationReportFile,
  type ReservationMergeResult,
} from "@/lib/reservationReportMerger";

type ReservationReportMergeProps = {
  onApplied: () => Promise<void> | void;
};

const fileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`;
const allowedFile = (file: File) => /\.(csv|xls|xlsx)$/i.test(file.name);

const ReservationReportMerge = ({ onApplied }: ReservationReportMergeProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<ReservationMergeResult | null>(null);
  const [working, setWorking] = useState(false);
  const [applying, setApplying] = useState(false);
  const [progress, setProgress] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming?.length) return;
    const nextFiles = Array.from(incoming).filter(allowedFile);
    setFiles((current) => {
      const map = new Map(current.map((file) => [fileKey(file), file]));
      nextFiles.forEach((file) => map.set(fileKey(file), file));
      return Array.from(map.values()).slice(0, 20);
    });
    setResult(null);
    setError(false);
    setMessage(nextFiles.length === incoming.length ? "" : "تم تجاهل الملفات غير المدعومة. استخدم CSV أو XLS أو XLSX.");
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (key: string) => {
    setFiles((current) => current.filter((file) => fileKey(file) !== key));
    setResult(null);
    setMessage("");
  };

  const mergeFiles = async () => {
    if (!files.length || working) return;
    setWorking(true);
    setError(false);
    setMessage("");
    try {
      const parsed = [];
      for (let index = 0; index < files.length; index += 1) {
        setProgress(`جاري قراءة ${index + 1} من ${files.length}…`);
        parsed.push(await parseReservationReportFile(files[index]));
      }
      const merged = mergeReservationReports(parsed);
      setResult(merged);
      setProgress("");
      setMessage(files.length > 1
        ? `تم دمج ${files.length} تقارير بنجاح وإزالة ${merged.stats.duplicatesRemoved.toLocaleString("ar-SA")} سجل مكرر.`
        : "تم تجهيز التقرير والتحقق من تنسيقه.");
    } catch (caught) {
      setResult(null);
      setProgress("");
      setError(true);
      setMessage(caught instanceof Error ? caught.message : "تعذر قراءة أحد التقارير.");
    } finally {
      setWorking(false);
    }
  };

  const applyMergedReport = async () => {
    if (!result || applying) return;
    setApplying(true);
    setError(false);
    try {
      const response = await api.uploadBookings(result.csv);
      await onApplied();
      setMessage(`تم اعتماد التقرير المدمج: ${Number(response.stats?.total || result.stats.uniqueRows).toLocaleString("ar-SA")} سجل.`);
    } catch (caught) {
      setError(true);
      setMessage(caught instanceof Error ? caught.message : "تعذر اعتماد التقرير المدمج.");
    } finally {
      setApplying(false);
    }
  };

  const downloadMergedReport = () => {
    if (!result) return;
    const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `merged-reservations-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-secondary/55 p-4 shadow-sm sm:p-5">
      <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-primary/20 bg-background/80 text-primary shadow-sm">
              <GitMerge className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="section-title">مركز دمج تقارير الحجوزات</h2>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-black text-primary">CRO + UNO</span>
              </div>
              <p className="mt-1 max-w-2xl text-xs leading-6 text-muted-foreground">يدعم CSV وXLS وXLSX، ويمكن دمج أكثر من تقرير مع توحيد الحالات وإزالة التكرار حسب رقم الحجز.</p>
            </div>
          </div>
          <input
            ref={inputRef}
            className="hidden"
            type="file"
            multiple
            accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(event) => addFiles(event.target.files)}
          />
          <button type="button" className="inline-flex h-10 items-center gap-2 rounded-xl border border-primary/25 bg-background/70 px-3 text-xs font-bold" onClick={() => inputRef.current?.click()}>
            <Plus className="h-4 w-4" /> إضافة تقارير
          </button>
        </div>

        {files.length ? (
          <div className="grid gap-2 md:grid-cols-2">
            {files.map((file, index) => (
              <div key={fileKey(file)} className="flex min-w-0 items-center gap-2 rounded-xl border border-border/35 bg-background/60 px-3 py-2.5">
                <FileSpreadsheet className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold" dir="ltr">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">تقرير {index + 1} · {(file.size / 1024).toLocaleString("ar-SA", { maximumFractionDigits: 0 })} KB</p>
                </div>
                <button type="button" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`إزالة ${file.name}`} onClick={() => removeFile(fileKey(file))}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <button type="button" className="flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/25 bg-background/45 text-center" onClick={() => inputRef.current?.click()}>
            <UploadCloud className="h-6 w-6 text-primary" />
            <strong className="text-sm">اختر تقرير UNO أو CRO</strong>
            <span className="text-[11px] text-muted-foreground">اختر تقريرًا واحدًا أو عدة تقارير دفعة واحدة</span>
          </button>
        )}

        {files.length ? (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="inline-flex h-11 items-center gap-2 rounded-xl gold-gradient px-4 text-sm font-black text-primary-foreground disabled:opacity-50" disabled={working} onClick={() => void mergeFiles()}>
              {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitMerge className="h-4 w-4" />}
              {working ? (progress || "جاري الدمج…") : files.length > 1 ? `دمج ${files.length} تقارير` : "تحليل التقرير"}
            </button>
            <button type="button" className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-xs font-bold text-muted-foreground hover:bg-secondary/50" onClick={() => { setFiles([]); setResult(null); setMessage(""); }}>
              <Trash2 className="h-4 w-4" /> مسح الاختيار
            </button>
          </div>
        ) : null}

        {message ? <p role="status" className={`rounded-xl border px-3 py-2.5 text-xs font-semibold ${error ? "border-destructive/25 bg-destructive/5 text-destructive" : "border-primary/15 bg-primary/5 text-primary"}`}>{message}</p> : null}

        {result ? (
          <div className="space-y-3 rounded-2xl border border-primary/15 bg-background/70 p-3 sm:p-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["السجلات الفريدة", result.stats.uniqueRows],
                ["المؤكدة", result.stats.confirmed],
                ["الملغاة", result.stats.cancelled],
                ["المكرر المحذوف", result.stats.duplicatesRemoved],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-xl bg-secondary/35 p-3">
                  <p className="text-[10px] text-muted-foreground">{label as string}</p>
                  <strong className="mt-1 block text-xl font-black">{Number(value).toLocaleString("ar-SA")}</strong>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 text-[11px] font-bold">
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-700">CRO: {result.stats.sourceRows.CRO.toLocaleString("ar-SA")}</span>
              <span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-sky-700">UNO: {result.stats.sourceRows.UNO.toLocaleString("ar-SA")}</span>
              {result.stats.sourceRows.UNKNOWN ? <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-700">غير معروف: {result.stats.sourceRows.UNKNOWN.toLocaleString("ar-SA")}</span> : null}
              {result.stats.statusConflicts ? <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-destructive">تعارض حالة: {result.stats.statusConflicts.toLocaleString("ar-SA")}</span> : null}
              {result.stats.withoutReservationNumber ? <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-700">بلا رقم حجز: {result.stats.withoutReservationNumber.toLocaleString("ar-SA")}</span> : null}
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border/25 pt-3">
              <button type="button" className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-primary-foreground disabled:opacity-50" disabled={applying} onClick={() => void applyMergedReport()}>
                {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {applying ? "جاري الاعتماد…" : "اعتماد التقرير المدمج"}
              </button>
              <button type="button" className="inline-flex h-11 items-center gap-2 rounded-xl border border-primary/20 px-4 text-sm font-bold" onClick={downloadMergedReport}>
                <Download className="h-4 w-4" /> تنزيل CSV المدمج
              </button>
            </div>
            <p className="text-[10px] leading-5 text-muted-foreground">التصنيف المعتمد: M / O / N / I مؤكد، و C / NS ملغي. عند تكرار رقم الحجز تُدمج مصادره بدل احتسابه مرتين.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default ReservationReportMerge;
