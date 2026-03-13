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
  if (pathname.startsWith("/admin")) return "/admin";
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
    <header className="glass-card p-4 md:p-5 space-y-3 sticky top-[68px] z-20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {showBack ? (
            <button
              type="button"
              onClick={onBack}
              className="h-10 w-10 shrink-0 rounded-xl border border-border bg-secondary/70 hover:bg-secondary transition"
              aria-label="رجوع"
            >
              <ArrowRight className="w-5 h-5 mx-auto" />
            </button>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              {Icon ? <Icon className="w-5 h-5 text-primary" /> : null}
              <span className="truncate">{title}</span>
            </h2>
            {subtitle ? <p className="text-xs md:text-sm text-muted-foreground mt-1">{subtitle}</p> : null}
          </div>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
};

export default PageHeader;
