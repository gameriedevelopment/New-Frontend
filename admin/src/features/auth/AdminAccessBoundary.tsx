import { Navigate, Outlet, useLocation } from "react-router-dom";
import { PageLoader } from "../../components/Feedback";
import { useAdminAuth } from "./AuthProvider";

export function AdminAccessBoundary() {
  const { status } = useAdminAuth();
  const location = useLocation();

  if (status === "checking") return <PageLoader />;
  if (status !== "authenticated") {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
