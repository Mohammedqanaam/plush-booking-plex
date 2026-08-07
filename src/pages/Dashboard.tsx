import { ArrowLeft, BarChart3, BookOpenCheck, Building2, OctagonAlert, PhoneCall, Search, Sparkles, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

type ServiceTone = "blue" | "green" | "violet" | "orange" | "teal" | "red";
type PublicEntry = { to: string; label: string; icon: LucideIcon; tone: ServiceTone };

const publicEntries: PublicEntry[] = [
  {
    to: "/operations",
    label: "البحث الموحّد",
    icon: Search,
    tone: "blue",
  },
  {
    to: "/branches",
    label: "دليل الفروع",
    icon: Building2,
    tone: "green",
  },
  {
    to: "/booking-reports",
    label: "أداء الحجوزات",
    icon: BarChart3,
    tone: "violet",
  },
  {
    to: "/contact-requests",
    label: "طلبات التواصل",
    icon: PhoneCall,
    tone: "orange",
  },
  {
    to: "/knowledge-bank",
    label: "بنك المعلومات",
    icon: BookOpenCheck,
    tone: "teal",
  },
  {
    to: "/complaints",
    label: "تسجيل شكوى",
    icon: OctagonAlert,
    tone: "red",
  },
];

const Dashboard = () => (
  <div className="page-wrap public-home">
    <section className="command-hero" aria-labelledby="command-hero-title">
      <div className="command-hero__content">
        <span className="command-hero__eyebrow"><Sparkles className="h-3.5 w-3.5" /> مجموعة بودل للضيافة</span>
        <h1 id="command-hero-title">مركز عمل الحجز</h1>
        <p>وصول أسرع للفروع، الحجوزات والمعلومات اليومية.</p>
        <Link to="/operations" className="command-hero__action">
          <Search className="h-4 w-4" /> بحث سريع
          <ArrowLeft className="mr-auto h-4 w-4" />
        </Link>
      </div>
      <span className="command-hero__mark" aria-hidden="true">BHG</span>
    </section>

    <section className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3" aria-label="الخدمات الرئيسية">
      {publicEntries.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="service-card group"
        >
          <span className={`service-icon service-icon--${item.tone}`}><item.icon className="h-5 w-5" strokeWidth={1.8} /></span>
          <div className="min-w-0 flex-1">
            <h2>{item.label}</h2>
          </div>
          <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" strokeWidth={1.8} />
        </Link>
      ))}
    </section>
  </div>
);

export default Dashboard;
