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
    <header className="page-heading relative z-10">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {showBack ? (
            <button
              type="button"
              onClick={onBack}
              className="touch-target h-10 w-10 shrink-0 rounded-full bg-secondary text-foreground interactive"
              aria-label="رجوع"
            >
              <ArrowRight className="mx-auto h-5 w-5" strokeWidth={1.8} />
            </button>
          ) : null}
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-[1.55rem] font-bold tracking-tight md:text-[1.8rem]">
              {Icon ? (
                <Icon className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.8} />
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
