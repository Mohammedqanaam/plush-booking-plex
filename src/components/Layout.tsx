import { NavLink, Outlet, useLocation } from "react-router-dom";
import { BarChart3, Building2, LayoutDashboard, LockKeyhole, PhoneCall, Search } from "lucide-react";
import BottomNav from "./BottomNav";
import RiyadhClock from "./RiyadhClock";
import ViewerPreferences from "./ViewerPreferences";
import AnalyticsTracker from "./AnalyticsTracker";
import BrandFooter from "./BrandFooter";

const desktopNav = [
  { to: "/", label: "الرئيسية", icon: LayoutDashboard },
  { to: "/operations", label: "البحث", icon: Search },
  { to: "/branches", label: "الفروع", icon: Building2 },
  { to: "/booking-reports", label: "التقارير", icon: BarChart3 },
  { to: "/contact-requests", label: "طلبات التواصل", icon: PhoneCall },
];

const Layout = () => {
  const location = useLocation();
  const isAdminArea = location.pathname.startsWith("/admin");

  return (
    <div className="app-shell flex flex-col">
      <AnalyticsTracker />

      <header className="safe-area-top sticky top-0 z-40 border-b border-border/15 bg-background/82 backdrop-blur-2xl">
        <div className="content-container h-[60px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold leading-5">إدارة الحجز المركزي</p>
            </div>
          </div>

          {!isAdminArea ? <nav className="hidden md:flex items-center justify-center gap-2 overflow-auto custom-scrollbar rounded-2xl border border-border/15 bg-secondary/20 p-1">
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
          </nav> : null}

          <div className="flex items-center gap-2 shrink-0 mr-auto md:mr-0">
            <div className="hidden lg:block">
              <RiyadhClock />
            </div>
            <div className="hidden md:block"><ViewerPreferences /></div>
            {!isAdminArea ? (
              <NavLink to="/admin/login" className="admin-entry-link" aria-label="دخول الإدارة" title="دخول الإدارة">
                <LockKeyhole className="h-[18px] w-[18px]" strokeWidth={1.8} />
                <span className="hidden xl:inline">الإدارة</span>
              </NavLink>
            ) : null}
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-3 md:pb-8" key={location.pathname}>
        <div className="content-container pt-3 md:pt-4">
          <Outlet />
          {!isAdminArea ? <BrandFooter className="mt-5 md:hidden" /> : null}
        </div>
      </main>

      {!isAdminArea ? (
        <div className="hidden md:block">
          <BrandFooter />
        </div>
      ) : null}

      {!isAdminArea ? <BottomNav /> : null}
    </div>
  );
};

export default Layout;
