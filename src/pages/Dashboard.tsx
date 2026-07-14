import { ArrowLeft, BarChart3, BookOpenCheck, Building2, FileText, OctagonAlert, PhoneCall, Search, UsersRound, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";

type PublicEntry = { to: string; label: string; icon: LucideIcon; description: string };

const publicEntries: PublicEntry[] = [
  {
    to: "/operations",
    label: "البحث",
    icon: Search,
    description: "ابحث في السياسات وبيانات الفروع.",
  },
  {
    to: "/branches",
    label: "الفروع",
    icon: Building2,
    description: "أرقام التواصل والخدمات المتاحة.",
  },
  {
    to: "/employees",
    label: "أداء الموظفين",
    icon: UsersRound,
    description: "نتائج كل موظف للعرض فقط.",
  },
  {
    to: "/booking-reports",
    label: "تقارير الحجوزات",
    icon: BarChart3,
    description: "ملخص المؤكد والملغي ونسب الحالات.",
  },
  {
    to: "/contact-requests",
    label: "طلب تواصل",
    icon: PhoneCall,
    description: "أنشئ طلب متابعة للضيف.",
  },
  {
    to: "/knowledge-bank",
    label: "المعلومات",
    icon: BookOpenCheck,
    description: "الغرف والمرافق والوجبات والقاعات.",
  },
  {
    to: "/policies",
    label: "السياسات",
    icon: FileText,
    description: "السداد والإلغاء والوصول والخصوصية.",
  },
  {
    to: "/complaints",
    label: "تسجيل شكوى",
    icon: OctagonAlert,
    description: "سجّل الشكوى وارفعها للمتابعة.",
  },
];

const Dashboard = () => (
  <div className="page-wrap public-home">
    <PageHeader
      title="إدارة الحجز المركزي"
      subtitle="اختر الخدمة المطلوبة."
      showBack={false}
    />

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {publicEntries.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="group page-surface card-hover min-h-[132px] overflow-hidden text-right"
        >
          <div className="flex h-full flex-col justify-between gap-3">
            <div className="flex items-start justify-between gap-4">
              <span className="icon-chip h-11 w-11">
                <item.icon className="h-5 w-5" />
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                فتح <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
              </span>
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black tracking-tight text-foreground">{item.label}</h2>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">{item.description}</p>
            </div>
          </div>
        </Link>
      ))}
    </section>
  </div>
);

export default Dashboard;
