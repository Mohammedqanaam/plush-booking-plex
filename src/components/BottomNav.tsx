import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, PhoneCall, UsersRound } from "lucide-react";

const mainNavItems = [
  { path: "/", label: "الرئيسية", icon: LayoutDashboard },
  { path: "/employees", label: "الموظفون", icon: UsersRound },
  { path: "/contact-requests", label: "التواصل", icon: PhoneCall },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-primary/25 bg-background/82 backdrop-blur-2xl safe-area-bottom">
      <div className="mx-auto flex h-[68px] max-w-xl items-center justify-around gap-1 px-3 pb-1">
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative touch-target min-w-[68px] flex flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-2 interactive ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className={`inline-flex h-8 w-8 items-center justify-center rounded-2xl border ${isActive ? "border-primary/45 bg-primary/16 shadow-[0_8px_24px_hsl(var(--primary)/0.12)]" : "border-primary/18 bg-secondary/45"}`}>
                <item.icon className="w-[18px] h-[18px]" />
              </span>
              <span className="text-[10.5px] font-bold leading-none">{item.label}</span>
              {isActive && <span className="absolute bottom-0 h-0.5 w-8 rounded-full gold-gradient" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
