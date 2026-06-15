import { ArrowLeft, PhoneCall, UsersRound, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";

type PublicEntry = { to: string; label: string; icon: LucideIcon; description: string; eyebrow: string };

const publicEntries: PublicEntry[] = [
  {
    to: "/employees",
    label: "قائمة الموظفين",
    icon: UsersRound,
    description: "مؤشرات الأداء اليومية",
    eyebrow: "الأداء",
  },
  {
    to: "/contact-requests",
    label: "طلبات التواصل",
    icon: PhoneCall,
    description: "إنشاء ومتابعة الطلبات",
    eyebrow: "التواصل",
  },
];

const Dashboard = () => (
  <div className="page-wrap public-home">
    <PageHeader
      title="إدارة الحجز المركزي"
      subtitle="متابعة مؤشرات الأداء وطلبات التواصل."
      showBack={false}
    />

    <section className="grid gap-4 md:grid-cols-2">
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
