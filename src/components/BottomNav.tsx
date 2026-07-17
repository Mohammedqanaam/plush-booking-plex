import { useLocation, useNavigate } from "react-router-dom";
import { BarChart3, Building2, LayoutDashboard, PhoneCall, Search } from "lucide-react";

const mainNavItems = [
  { path: "/", label: "الرئيسية", icon: LayoutDashboard },
  { path: "/operations", label: "البحث", icon: Search },
  { path: "/branches", label: "الفروع", icon: Building2 },
  { path: "/booking-reports", label: "التقارير", icon: BarChart3 },
  { path: "/contact-requests", label: "التواصل", icon: PhoneCall },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="mobile-tab-bar relative z-50 shrink-0 safe-area-bottom md:hidden">
      <div className="mx-auto flex h-[58px] max-w-xl items-center justify-around gap-1 px-2">
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative touch-target min-w-0 flex-1 flex flex-col items-center justify-center gap-1 px-1 py-1 interactive ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-[21px] w-[21px]" strokeWidth={isActive ? 2.1 : 1.7} />
              <span className="text-[10px] font-semibold leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
