import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { BarChart3, Building2, LayoutDashboard, PhoneCall, Search, UsersRound } from "lucide-react";
import BottomNav from "./BottomNav";
import RiyadhClock from "./RiyadhClock";
import { api } from "@/lib/api";
import ViewerPreferences from "./ViewerPreferences";
import AnalyticsTracker from "./AnalyticsTracker";

const desktopNav = [
  { to: "/", label: "الرئيسية", icon: LayoutDashboard },
  { to: "/operations", label: "البحث", icon: Search },
  { to: "/branches", label: "الفروع", icon: Building2 },
  { to: "/employees", label: "الموظفون", icon: UsersRound },
  { to: "/booking-reports", label: "التقارير", icon: BarChart3 },
  { to: "/contact-requests", label: "طلبات التواصل", icon: PhoneCall },
];

const Layout = () => {
  const [bannerText, setBannerText] = useState("");
  const [siteTitle, setSiteTitle] = useState("RES Dashboard");
  const location = useLocation();
  const lastUpdatedAt = new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });

  useEffect(() => {
    api
      .getSettings()
      .then((data) => {
        if (data.bannerText !== undefined) setBannerText(data.bannerText);
        if (data.siteTitle?.trim()) setSiteTitle(data.siteTitle.trim());
      })
      .catch(() => {});
  }, []);

  return (
    <div className="app-shell flex flex-col">
      <AnalyticsTracker />
      {bannerText && (
        <div className="bg-primary/10 text-center py-2 px-4 text-xs font-medium text-primary border-b border-primary/20">
          {bannerText}
        </div>
      )}

      <header className="safe-area-top sticky top-0 z-40 border-b border-border/15 bg-background/82 backdrop-blur-2xl">
        <div className="content-container h-[60px] flex items-center justify-between gap-3">
          <div className="hidden md:flex items-center gap-3 min-w-0">
            <span className="icon-chip h-9 w-9"><LayoutDashboard className="w-5 h-5" /></span>
            <div className="min-w-0">
              <p className="text-sm font-extrabold leading-5">{siteTitle}</p>
              <p className="text-xs text-muted-foreground truncate">إدارة الحجز المركزي</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center justify-center gap-2 overflow-auto custom-scrollbar rounded-2xl border border-border/15 bg-secondary/20 p-1">
            {desktopNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `inline-flex h-10 items-center gap-2 rounded-2xl px-4 text-sm font-semibold interactive whitespace-nowrap ${
                    isActive
                      ? "bg-primary/12 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.22)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/45"
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0 mr-auto md:mr-0">
            <div className="hidden lg:block">
              <RiyadhClock />
            </div>
            <ViewerPreferences />
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-3 md:pb-8" key={location.pathname}>
        <div className="content-container pt-3 md:pt-4">
          <Outlet />
        </div>
      </main>

      <footer className="hidden md:block border-t border-border/15 bg-secondary/12 backdrop-blur-xl">
        <div className="content-container h-[60px] flex items-center justify-between text-xs text-muted-foreground">
          <p>{siteTitle}</p>
          <p>الحجز المركزي</p>
          <p>آخر تحديث اليوم {lastUpdatedAt}</p>
        </div>
      </footer>

      <BottomNav />
    </div>
  );
};

export default Layout;
