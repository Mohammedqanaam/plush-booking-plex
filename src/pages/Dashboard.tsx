import { ArrowLeft, BarChart3, BookOpenCheck, Building2, MapPin, OctagonAlert, PhoneCall, Search, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { branches } from "@/data/branches";

type ServiceTone = "blue" | "green" | "violet" | "orange" | "teal" | "red";
type PublicEntry = { to: string; label: string; icon: LucideIcon; description: string; tone: ServiceTone };

const publicEntries: PublicEntry[] = [
  {
    to: "/operations",
    label: "البحث",
    icon: Search,
    description: "ابحث في معلومات الحجز والفروع.",
    tone: "blue",
  },
  {
    to: "/branches",
    label: "الفروع",
    icon: Building2,
    description: "أرقام التواصل والخدمات المتاحة.",
    tone: "green",
  },
  {
    to: "/booking-reports",
    label: "تقارير الحجوزات",
    icon: BarChart3,
    description: "الملخص ونتائج الموظفين في تقرير واحد.",
    tone: "violet",
  },
  {
    to: "/contact-requests",
    label: "طلب تواصل",
    icon: PhoneCall,
    description: "أنشئ طلب متابعة للضيف.",
    tone: "orange",
  },
  {
    to: "/knowledge-bank",
    label: "المعلومات",
    icon: BookOpenCheck,
    description: "الغرف والمرافق والوجبات والقاعات.",
    tone: "teal",
  },
  {
    to: "/complaints",
    label: "تسجيل شكوى",
    icon: OctagonAlert,
    description: "سجّل الشكوى وارفعها للمتابعة.",
    tone: "red",
  },
];

const cityCount = new Set(branches.map((branch) => branch.city)).size;

const Dashboard = () => (
  <div className="page-wrap public-home">
    <PageHeader
      title="إدارة الحجز المركزي"
      subtitle="اختر الخدمة المطلوبة."
      showBack={false}
    />

    <section className="home-overview" aria-label="ملخص دليل الفروع">
      <span className="home-overview__icon"><Building2 className="h-6 w-6" strokeWidth={1.7} /></span>
      <div className="min-w-0 flex-1">
        <p>دليل الفروع</p>
        <strong>{branches.length} فرعًا محدثًا</strong>
      </div>
      <span className="home-overview__meta"><MapPin className="h-4 w-4" /> {cityCount} مدن</span>
    </section>

    <section className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
      {publicEntries.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="service-card group"
        >
          <span className={`service-icon service-icon--${item.tone}`}><item.icon className="h-5 w-5" strokeWidth={1.8} /></span>
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
