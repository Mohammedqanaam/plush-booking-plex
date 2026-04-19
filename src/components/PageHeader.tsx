import type { ReactNode } from "react";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  showBack?: boolean;
};

const fallbackForPath = (pathname: string) => {
  if (pathname.startsWith("/admin") && pathname !== "/admin") return "/admin";
  if (pathname === "/" || pathname === "/dashboard") return "/";
  return "/";
};

const PageHeader = ({ title, subtitle, icon: Icon, actions, showBack = true }: PageHeaderProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const onBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(fallbackForPath(pathname));
  };

  return (
    <header className="page-surface sticky top-[88px] z-20 border-border/70 py-5 md:py-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {showBack ? (
            <button
              type="button"
              onClick={onBack}
              className="touch-target h-11 w-11 shrink-0 rounded-2xl border border-[#D4AF37]/30 bg-secondary/80 hover:bg-secondary/95 hover:border-[#D4AF37]/55 interactive"
              aria-label="رجوع"
            >
              <ArrowRight className="w-5 h-5 mx-auto" />
            </button>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-3xl md:text-[2.35rem] font-black flex items-center gap-2">
              {Icon ? (
                <span className="icon-chip h-8 w-8">
                  <Icon className="w-4 h-4 shrink-0" />
                </span>
              ) : null}
              <span className="truncate">{title}</span>
            </h2>
            {subtitle ? <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-3xl">{subtitle}</p> : null}
          </div>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
};

export default PageHeader;
