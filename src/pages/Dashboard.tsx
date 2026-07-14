import { ArrowLeft, BarChart3, BookOpenCheck, Building2, OctagonAlert, PhoneCall, Search, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";

type PublicEntry = { to: string; label: string; icon: LucideIcon; description: string };

const publicEntries: PublicEntry[] = [
  {
    to: "/operations",
    label: "البحث",
    icon: Search,
    description: "ابحث في معلومات الحجز والفروع.",
  },
  {
    to: "/branches",
    label: "الفروع",
    icon: Building2,
    description: "أرقام التواصل والخدمات المتاحة.",
  },
  {
    to: "/booking-reports",
    label: "تقارير الحجوزات",
    icon: BarChart3,
    description: "الملخص ونتائج الموظفين في تقرير واحد.",
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

    <section className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
      {publicEntries.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="service-card group"
        >
          <span className="service-icon"><item.icon className="h-5 w-5" strokeWidth={1.8} /></span>
          <div className="min-w-0 flex-1">
            <h2>{item.label}</h2>
            <p>{item.description}</p>
          </div>
          <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" strokeWidth={1.8} />
        </Link>
      ))}
    </section>
  </div>
);

export default Dashboard;
