import { FileText } from "lucide-react";
import PageHeader from "@/components/PageHeader";
const items = [
  { title: "سياسة الإلغاء", type: "نص", category: "إلغاء" },
  { title: "سياسة الدفع", type: "PDF", category: "دفع" },
  { title: "سياسة الدخول والخروج", type: "صورة", category: "تشغيل" },
  { title: "تعميم العروض الموسمية", type: "PDF", category: "عروض" },
];

const Policies = () => (
  <div className="p-4 max-w-5xl mx-auto space-y-4">
    <PageHeader title="التعاميم والسياسات" subtitle="مرجع موحد لسياسات التشغيل والتعاميم المرفقة." icon={FileText} />
    <div className="grid sm:grid-cols-2 gap-3">
      {items.map((item) => <div key={item.title} className="glass-card p-4 hover:border-primary/40 transition"><p className="text-xs text-primary">{item.category}</p><h3 className="font-semibold">{item.title}</h3><p className="text-xs text-muted-foreground">النوع: {item.type}</p></div>)}
    </div>
  </div>
);

export default Policies;
