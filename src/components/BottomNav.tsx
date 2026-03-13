import { useLocation, useNavigate } from "react-router-dom";
import { BookOpenText, LayoutDashboard, ShieldCheck, Siren, UploadCloud } from "lucide-react";

const mainNavItems = [
  { path: "/", label: "الرئيسية", icon: LayoutDashboard },
  { path: "/knowledge-bank", label: "بنك المعلومات", icon: BookOpenText },
  { path: "/upload-center", label: "الرفع", icon: UploadCloud },
  { path: "/complaints", label: "الشكاوى", icon: Siren },
  { path: "/admin", label: "الإدارة", icon: ShieldCheck },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/90 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around h-[70px] max-w-xl mx-auto px-2">
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative min-w-[64px] flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all duration-200 ${
                isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className={`w-[18px] h-[18px] ${isActive ? "drop-shadow-[0_0_8px_hsl(var(--primary))]" : ""}`} />
              <span className="text-[10px] sm:text-[11px] font-medium">{item.label}</span>
              {isActive && <span className="absolute -bottom-0.5 w-8 h-0.5 gold-gradient rounded-full" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
