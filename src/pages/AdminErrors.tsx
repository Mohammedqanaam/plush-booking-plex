import { useEffect, useState } from "react";
import { enterpriseApi } from "@/lib/enterpriseApi";
import { ShieldAlert } from "lucide-react";
import PageHeader from "@/components/PageHeader";

type ErrorLog = {
  id: string;
  source: string;
  message: string;
  context?: string;
  createdAt: string;
};

const AdminErrors = () => {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  useEffect(() => {
    enterpriseApi.getErrorLogs().then((d) => setLogs(d.logs || [])).catch(() => setLogs([]));
  }, []);

  return (
    <div className="page-wrap-narrow">
      <PageHeader title="لوحة الأخطاء" subtitle="متابعة أخطاء النظام وسجلاتها لحظيًا." icon={ShieldAlert} />
      {logs.map((log) => (
        <div key={log.id} className="glass-card p-3 text-xs">
          <p><b>{log.source}</b> - {log.message}</p>
          <p className="text-muted-foreground">{log.context || ""} · {new Date(log.createdAt).toLocaleString("ar-SA")}</p>
        </div>
      ))}
    </div>
  );
};

export default AdminErrors;
