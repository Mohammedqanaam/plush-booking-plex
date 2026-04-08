import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { BookOpenCheck, Building2, LayoutDashboard, Settings2, TriangleAlert, UsersRound } from "lucide-react";
import BottomNav from "./BottomNav";
import RiyadhClock from "./RiyadhClock";
import { api } from "@/lib/api";
import ViewerPreferences from "./ViewerPreferences";
import ScrollTopButton from "./ScrollTopButton";

const desktopNav = [
  { to: "/", label: "الرئيسية", icon: LayoutDashboard },
  { to: "/knowledge-bank", label: "بنك المعلومات", icon: BookOpenCheck },
  { to: "/employees", label: "الموظفون", icon: UsersRound },
  { to: "/complaints", label: "الشكاوى", icon: TriangleAlert },
  { to: "/branches", label: "الفروع", icon: Building2 },
  { to: "/settings", label: "الإعدادات", icon: Settings2 },
];

const Layout = () => {
  const [siteTitle, setSiteTitle] = useState("Res");
  const [bannerText, setBannerText] = useState("");
  const location = useLocation();

  useEffect(() => {
    api
      .getSettings()
      .then((data) => {
        if (data.siteTitle) setSiteTitle(data.siteTitle);
        if (data.bannerText !== undefined) setBannerText(data.bannerText);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="app-shell flex flex-col">
      {bannerText && (
        <div className="bg-primary/12 text-center py-2 px-4 text-xs text-primary border-b border-border/40">
          {bannerText}
        </div>
      )}

      <header className="safe-area-top sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="px-3 sm:px-4 py-2 max-w-7xl mx-auto space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg sm:text-xl font-bold leading-none tracking-tight">
              <span className="gold-gradient bg-clip-text text-transparent">{siteTitle}</span>
            </h1>
            <div className="flex items-center gap-2">
              <ViewerPreferences />
              <RiyadhClock />
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-2 overflow-auto pb-1">
            {desktopNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm border interactive whitespace-nowrap ${
                    isActive
                      ? "border-primary/50 bg-primary/12 text-primary"
                      : "border-border/60 bg-secondary/30 text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 min-h-0 pb-24 md:pb-8 overflow-y-auto custom-scrollbar" key={location.pathname}>
        <Outlet />
      </main>

      <ScrollTopButton />
      <BottomNav />
    </div>
  );
};

export default Layout;
