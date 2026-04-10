import { FileBadge2, FileText, FolderKanban } from "lucide-react";
import { globalReferences } from "@/data/knowledge";
import PageHeader from "@/components/PageHeader";

const Policies = () => (
  <div className="p-3 md:p-4 max-w-6xl mx-auto space-y-4 pb-28 md:pb-8">
    <PageHeader title="التعاميم والسياسات" subtitle="مرجع موحّد للسياسات مع الرد الرسمي وآلية التنفيذ الداخلية." icon={FileText} />

    <section className="page-surface space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="icon-chip">
          <FolderKanban className="w-4 h-4" />
        </span>
        سياسات وتشريعات تشغيلية قابلة للرجوع الفوري.
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {globalReferences.map((item) => (
          <article key={item.id} className="rounded-2xl border border-border/70 bg-secondary/25 p-4 card-hover space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs px-2 py-1 rounded-full border border-primary/30 text-primary bg-primary/10">{item.category}</span>
              <FileBadge2 className="w-4 h-4 text-muted-foreground" />
            </div>
            <h3 className="font-semibold leading-7">{item.title}</h3>
            <p className="text-xs text-muted-foreground">{item.summary}</p>
            <p className="text-xs text-muted-foreground whitespace-pre-line">بروتوكول الرد: {item.responseProtocol}</p>
            {item.attachmentUrl ? (
              <a href={item.attachmentUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                فتح المرفق (PDF)
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  </div>
);

export default Policies;
