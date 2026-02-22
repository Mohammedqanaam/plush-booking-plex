import { Navigate } from "react-router-dom";
import { getAdminSession } from "@/lib/adminAuth";

type ProtectedRouteProps = {
  children: JSX.Element;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const session = getAdminSession();
  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
