import { useEffect, useState } from "react";
import { enterpriseApi } from "@/lib/enterpriseApi";
import { ShieldAlert } from "lucide-react";
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
    enterpriseApi.getErrorLogs().then((data) => setErrors(data.logs || [])).catch(() => setErrors([]));
  }, []);

  return (
    <div className="page-wrap-narrow">
      <PageHeader title="مراقبة أخطاء النظام" icon={ShieldAlert} />
      {!errors.length ? <div className="page-surface text-sm text-muted-foreground">لا توجد أخطاء مسجلة حاليًا.</div> : null}
      {errors.map((err) => (
        <div key={err.id} className="glass-card p-3">
          <p className="text-sm font-semibold">{err.source}</p>
          <p className="text-xs text-muted-foreground">{err.message}</p>
          <p className="text-xs text-muted-foreground">{err.createdAt}</p>
        </div>
      ))}
    </div>
  );
};

export default ErrorDashboard;
