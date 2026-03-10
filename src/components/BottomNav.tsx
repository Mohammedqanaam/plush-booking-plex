import { useLocation, useNavigate } from "react-router-dom";
import { Home, Library, Shield, TriangleAlert } from "lucide-react";
import { Home, Library, Shield, TriangleAlert, Upload } from "lucide-react";

const mainNavItems = [
  { path: "/", label: "الرئيسية", icon: Home },
  { path: "/knowledge-bank", label: "بنك المعلومات", icon: Library },
  { path: "/upload-center", label: "الرفع", icon: Upload },
  { path: "/complaints", label: "الشكاوى", icon: TriangleAlert },
  { path: "/admin", label: "الإدارة", icon: Shield },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/85 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-all duration-200 ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "drop-shadow-[0_0_6px_hsl(42,90%,55%)]" : ""}`} />
              <span className="text-[10px] sm:text-[11px] font-medium">{item.label}</span>
              {isActive && <span className="absolute bottom-0 w-8 h-0.5 gold-gradient rounded-full" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
