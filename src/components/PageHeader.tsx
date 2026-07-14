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
    <header className="page-surface relative z-10 border-primary/20 py-3 md:py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {showBack ? (
            <button
              type="button"
              onClick={onBack}
              className="touch-target h-11 w-11 shrink-0 rounded-2xl border border-primary/25 bg-secondary/70 hover:bg-secondary/95 hover:border-primary/50 interactive"
              aria-label="رجوع"
            >
              <ArrowRight className="w-5 h-5 mx-auto" />
            </button>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-xl md:text-[1.85rem] font-black flex items-center gap-2">
              {Icon ? (
                <span className="icon-chip h-7 w-7">
                  <Icon className="w-4 h-4 shrink-0" />
                </span>
              ) : null}
              <span className="truncate">{title}</span>
            </h2>
            {subtitle ? <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-2xl leading-6">{subtitle}</p> : null}
          </div>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
};

export default PageHeader;
