import { useEffect, useState } from "react";
import { enterpriseApi } from "@/lib/enterpriseApi";

const AdminErrors = () => {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    enterpriseApi.getErrorLogs().then((d) => setLogs(d.logs || [])).catch(() => setLogs([]));
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-3">
      <h2 className="text-2xl font-bold">Error Dashboard</h2>
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
