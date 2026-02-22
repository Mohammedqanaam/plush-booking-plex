import { Navigate } from "react-router-dom";
import { getAdminSession } from "@/lib/adminAuth";

type ProtectedRouteProps = {
  children: JSX.Element;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const session = getAdminSession();
  const isAdmin = session?.role === "admin";
  if (!isAdmin) {
    console.error("Admin permission required.", {
      reason: session ? "invalid_role" : "missing_session",
      username: session?.username,
      role: session?.role,
    });
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
