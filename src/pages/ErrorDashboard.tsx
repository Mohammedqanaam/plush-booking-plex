import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
import PageHeader from "@/components/PageHeader";

type AppError = {
  id: string;
  source: string;
  message: string;
  createdAt: string;
};

const ErrorDashboard = () => {
  const [errors, setErrors] = useState<AppError[]>([]);

  useEffect(() => {
    api.getErrors().then((data) => setErrors(data.errors || [])).catch(() => setErrors([]));
  }, []);

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <PageHeader title="لوحة مراقبة الأخطاء" subtitle="عرض أخطاء النظام المسجلة لمتابعة الاستقرار." icon={ShieldAlert} />
      {errors.length ? errors.map((err) => (
        <div key={err.id} className="page-surface">
          <p className="text-sm font-semibold">{err.source}</p>
          <p className="text-xs text-muted-foreground">{err.message}</p>
          <p className="text-xs text-muted-foreground">{err.createdAt}</p>
        </div>
      )) : <div className="page-surface text-sm text-muted-foreground">لا توجد أخطاء مسجلة حاليًا.</div>}
    </div>
  );
};

export default ErrorDashboard;
