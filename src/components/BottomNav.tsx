import { useLocation, useNavigate } from "react-router-dom";
import { Building2, LayoutDashboard, PhoneCall, Search, UsersRound } from "lucide-react";

const mainNavItems = [
  { path: "/", label: "الرئيسية", icon: LayoutDashboard },
  { path: "/operations", label: "البحث", icon: Search },
  { path: "/branches", label: "الفروع", icon: Building2 },
  { path: "/employees", label: "الموظفون", icon: UsersRound },
  { path: "/contact-requests", label: "التواصل", icon: PhoneCall },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="relative z-50 mx-3 mb-3 shrink-0 rounded-[1.35rem] border border-border/20 bg-background/92 backdrop-blur-2xl safe-area-bottom shadow-[0_-12px_32px_rgba(0,0,0,0.12)] md:hidden">
      <div className="mx-auto flex h-[64px] max-w-xl items-center justify-around gap-1 px-2 pb-1">
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative touch-target min-w-0 flex-1 flex flex-col items-center justify-center gap-1.5 rounded-2xl px-1 py-1.5 interactive ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-slate-200"
              }`}
            >
              <span className={`inline-flex h-8 w-8 items-center justify-center rounded-2xl border ${isActive ? "border-primary/34 bg-primary/12 shadow-[0_8px_20px_hsl(var(--primary)/0.10)]" : "border-border/20 bg-secondary/35"}`}>
                <item.icon className="w-[18px] h-[18px]" />
              </span>
              <span className="text-[11px] font-bold leading-none">{item.label}</span>
              {isActive && <span className="absolute bottom-0 h-0.5 w-8 rounded-full gold-gradient" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
