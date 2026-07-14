import { Home, SearchX } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="grid min-h-[65vh] place-items-center px-4">
      <div className="page-surface max-w-lg text-center">
        <span className="icon-chip mx-auto h-16 w-16"><SearchX className="h-7 w-7" /></span>
        <p className="mt-5 text-xs font-bold text-primary">خطأ 404</p>
        <h1 className="mt-2 text-3xl font-black">الصفحة غير موجودة</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">تعذر العثور على المسار <span dir="ltr" className="font-mono">{location.pathname}</span>. قد يكون الرابط قديمًا أو غير صحيح.</p>
        <Link to="/" className="mx-auto mt-6 inline-flex h-11 items-center gap-2 rounded-xl gold-gradient px-5 text-sm font-bold text-primary-foreground">
          <Home className="h-4 w-4" /> العودة للرئيسية
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
