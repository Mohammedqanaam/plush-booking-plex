import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { clearAdminSession, getAdminSession } from "@/lib/adminAuth";
import { api } from "@/lib/api";

type ProtectedRouteProps = {
  children: JSX.Element;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const [state, setState] = useState<"checking" | "allowed" | "denied">(
    getAdminSession() ? "checking" : "denied",
  );

  useEffect(() => {
    if (!getAdminSession()) return;
    api.validateSession().then((session) => {
      if (session) setState("allowed");
      else {
        clearAdminSession();
        setState("denied");
      }
    }).catch(() => {
      clearAdminSession();
      setState("denied");
    });
  }, []);

  if (state === "checking") {
    return <div className="grid min-h-[45vh] place-items-center text-sm text-muted-foreground">جاري التحقق من صلاحية المشرف…</div>;
  }
  if (state === "denied") {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }
  return children;
};

export default ProtectedRoute;
