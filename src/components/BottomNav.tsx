import { useLocation, useNavigate } from "react-router-dom";
import { Home, MessageSquare, Search, Shield, Upload, Users, Settings } from "lucide-react";

const mainNavItems = [
  { path: "/", label: "الرئيسية", icon: Home },
  { path: "/contacts", label: "طلبات التواصل", icon: MessageSquare },
  { path: "/search", label: "البحث", icon: Search },
  { path: "/admin", label: "Admin", icon: Shield },
];

const adminNavItems = [
  { key: "upload", path: "/admin?tab=upload", label: "الرفع", icon: Upload },
  { key: "users", path: "/admin?tab=users", label: "المستخدمين", icon: Users },
  { key: "requests", path: "/admin?tab=requests", label: "الطلبات", icon: MessageSquare },
  { key: "settings", path: "/admin?tab=settings", label: "الإعدادات", icon: Settings },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isAdminArea = location.pathname === "/admin";
  const activeAdminTab = new URLSearchParams(location.search).get("tab") || "upload";
  const items = isAdminArea ? adminNavItems : mainNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/85 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {items.map((item) => {
          const isActive = isAdminArea
            ? item.key === activeAdminTab
            : location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "drop-shadow-[0_0_6px_hsl(42,90%,55%)]" : ""}`} />
              <span className="text-[11px] font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 gold-gradient rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
