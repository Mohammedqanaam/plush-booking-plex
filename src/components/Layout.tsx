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
  const lastUpdatedAt = new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });

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

      <header className="safe-area-top sticky top-0 z-40 border-b border-border/60 bg-background/86 backdrop-blur-xl">
        <div className="content-container h-[76px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold leading-none tracking-tight whitespace-nowrap">
              <span className="gold-gradient bg-clip-text text-transparent">{siteTitle}</span>
            </h1>
            <span className="hidden lg:inline-flex text-xs text-muted-foreground px-3 py-2 rounded-2xl border border-border/60 bg-secondary/30">
              الرئيسية
            </span>
          </div>

          <nav className="hidden md:flex items-center justify-center gap-2 overflow-auto">
            {desktopNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm border interactive whitespace-nowrap ${
                    isActive
                      ? "border-primary/50 bg-primary/14 text-primary"
                      : "border-border/60 bg-secondary/30 text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden lg:block">
              <RiyadhClock />
            </div>
            <ViewerPreferences />
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 pb-28 md:pb-10 overflow-y-auto custom-scrollbar" key={location.pathname}>
        <div className="content-container pt-6 md:pt-7">
          <Outlet />
        </div>
      </main>

      <footer className="hidden md:block border-t border-border/55 bg-secondary/20">
        <div className="content-container h-[80px] flex items-center justify-between text-xs text-muted-foreground">
          <p>نظام الكول سنتر</p>
          <p>الإصدار 2.1.0</p>
          <p>آخر تحديث اليوم {lastUpdatedAt}</p>
        </div>
      </footer>

      <ScrollTopButton />
      <BottomNav />
    </div>
  );
};

export default Layout;
