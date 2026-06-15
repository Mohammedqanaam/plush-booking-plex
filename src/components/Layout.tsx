import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, PhoneCall, UsersRound } from "lucide-react";
import BottomNav from "./BottomNav";
import RiyadhClock from "./RiyadhClock";
import { api } from "@/lib/api";
import ViewerPreferences from "./ViewerPreferences";
import ScrollTopButton from "./ScrollTopButton";

const desktopNav = [
  { to: "/", label: "الرئيسية", icon: LayoutDashboard },
  { to: "/employees", label: "الموظفون", icon: UsersRound },
  { to: "/contact-requests", label: "طلبات التواصل", icon: PhoneCall },
];

const Layout = () => {
  const [bannerText, setBannerText] = useState("");
  const location = useLocation();
  const lastUpdatedAt = new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });

  useEffect(() => {
    api
      .getSettings()
      .then((data) => {
        if (data.bannerText !== undefined) setBannerText(data.bannerText);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="app-shell flex flex-col">
      {bannerText && (
        <div className="bg-primary/10 text-center py-2 px-4 text-xs font-medium text-primary border-b border-primary/20">
          {bannerText}
        </div>
      )}

      <header className="safe-area-top sticky top-0 z-40 border-b border-primary/20 bg-background/78 backdrop-blur-2xl">
        <div className="content-container h-[68px] flex items-center justify-between gap-3">
          <div className="hidden md:flex items-center gap-3 min-w-0">
            <span className="icon-chip h-11 w-11"><LayoutDashboard className="w-5 h-5" /></span>
            <div className="min-w-0">
              <p className="text-sm font-extrabold leading-5">نظام الكول سنتر</p>
              <p className="text-xs text-muted-foreground truncate">تشغيل وحجوزات</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center justify-center gap-2 overflow-auto custom-scrollbar rounded-3xl border border-primary/15 bg-secondary/24 p-1">
            {desktopNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold interactive whitespace-nowrap ${
                    isActive
                      ? "bg-primary/14 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.35)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
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

      <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-10" key={location.pathname}>
        <div className="content-container pt-3 md:pt-5">
          <Outlet />
        </div>
      </main>

      <footer className="hidden md:block border-t border-primary/15 bg-secondary/14 backdrop-blur-xl">
        <div className="content-container h-[68px] flex items-center justify-between text-xs text-muted-foreground">
          <p>نظام الكول سنتر</p>
          <p>الإصدار 2.2.0</p>
          <p>آخر تحديث اليوم {lastUpdatedAt}</p>
        </div>
      </footer>

      <ScrollTopButton />
      <BottomNav />
    </div>
  );
};

export default Layout;
