import { ArrowLeft, BookOpenCheck, Building2, FileText, Headset, OctagonAlert, PhoneCall, Search, UsersRound, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";

type PublicEntry = { to: string; label: string; icon: LucideIcon; description: string; eyebrow: string };

const publicEntries: PublicEntry[] = [
  {
    to: "/operations",
    label: "البحث التشغيلي",
    icon: Search,
    description: "وصول فوري للسياسات والإجراءات ومعلومات الفروع أثناء المكالمة.",
    eyebrow: "الأسرع",
  },
  {
    to: "/branches",
    label: "دليل الفروع",
    icon: Building2,
    description: "بيانات الفروع والخدمات وأرقام التواصل وحالة توثيق المعلومات.",
    eyebrow: "الفروع",
  },
  {
    to: "/employees",
    label: "قائمة الموظفين",
    icon: UsersRound,
    description: "مؤشرات الحجوزات المؤكدة والملغاة وفق الحالات المعتمدة.",
    eyebrow: "الأداء",
  },
  {
    to: "/contact-requests",
    label: "طلبات التواصل",
    icon: PhoneCall,
    description: "إنشاء طلب تواصل موثق للضيف وتحويله للمتابعة.",
    eyebrow: "التواصل",
  },
  {
    to: "/knowledge-bank",
    label: "بنك المعلومات",
    icon: BookOpenCheck,
    description: "مرجع مصنف لمعلومات الغرف والمرافق والوجبات وجهات الاتصال.",
    eyebrow: "المعرفة",
  },
  {
    to: "/policies",
    label: "السياسات التشغيلية",
    icon: FileText,
    description: "مرجع مختصر للحالات، السداد، الإلغاء، الوصول ونطاق الاختصاص.",
    eyebrow: "معتمد",
  },
  {
    to: "/complaints",
    label: "تسجيل شكوى",
    icon: OctagonAlert,
    description: "توثيق شكوى الضيف وتصنيفها وتجهيزها للتصعيد والمتابعة.",
    eyebrow: "الجودة",
  },
];

const Dashboard = () => (
  <div className="page-wrap public-home">
    <PageHeader
      title="إدارة الحجز المركزي"
      subtitle="منصة تشغيل موحدة لفريق الحجز المركزي"
      showBack={false}
    />

    <section className="page-surface overflow-hidden border-primary/25 bg-gradient-to-l from-primary/10 via-secondary/25 to-transparent">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <span className="icon-chip h-12 w-12 shrink-0"><Headset className="h-5 w-5" /></span>
          <div>
            <p className="text-xs font-bold text-primary">مركز العمليات</p>
            <h1 className="mt-1 text-xl font-black md:text-2xl">كل ما يحتاجه موظف الحجز في مكان واحد</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">ابدأ بالبحث التشغيلي للوصول إلى المعلومة أثناء المكالمة، أو اختر القسم المطلوب أدناه.</p>
          </div>
        </div>
        <Link to="/operations" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl gold-gradient px-5 text-sm font-bold text-primary-foreground">
          بحث سريع <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
    </section>

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {publicEntries.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="group page-surface card-hover min-h-[156px] overflow-hidden text-right"
        >
          <div className="flex h-full flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-4">
              <span className="icon-chip h-12 w-12">
                <item.icon className="h-5 w-5" />
              </span>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary/90">
                {item.eyebrow}
              </span>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-foreground">{item.label}</h2>
              <p className="max-w-xl text-sm leading-7 text-muted-foreground">{item.description}</p>
            </div>
            <div className="inline-flex items-center gap-2 text-sm font-bold text-primary">
              فتح
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            </div>
          </div>
        </Link>
      ))}
    </section>
  </div>
);

export default Dashboard;
