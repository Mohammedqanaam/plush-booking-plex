import { useLocation, useNavigate } from "react-router-dom";
import { BookOpenCheck, Building2, LayoutDashboard, PhoneCall, UsersRound } from "lucide-react";

const mainNavItems = [
  { path: "/", label: "الرئيسية", icon: LayoutDashboard },
  { path: "/knowledge-bank", label: "المعرفة", icon: BookOpenCheck },
  { path: "/employees", label: "الموظفون", icon: UsersRound },
  { path: "/contacts", label: "التواصل", icon: PhoneCall },
  { path: "/branches", label: "الفروع", icon: Building2 },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/70 bg-card/92 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around h-[74px] max-w-xl mx-auto px-2">
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative touch-target min-w-[64px] flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl interactive ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl ${isActive ? "bg-primary/14 border border-primary/40" : "bg-secondary/40 border border-border/60"}`}>
                <item.icon className="w-[17px] h-[17px]" />
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && <span className="absolute -bottom-0.5 w-7 h-0.5 gold-gradient rounded-full" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
