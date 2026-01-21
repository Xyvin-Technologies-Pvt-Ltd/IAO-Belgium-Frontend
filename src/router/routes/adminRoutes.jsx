import { Navigate } from "@tanstack/react-router";
import Programs from "@/pages/admin/program";
import ProgramDetail from "@/pages/admin/program/ProgramDetail";
import Locations from "@/pages/admin/location";
import ApplicationReview from "@/pages/admin/application-review";
import AdminManagement from "@/pages/admin/admin-management";
import RoleManagement from "@/pages/admin/role-management";
import Language from "@/pages/admin/language";
import Intakes from "@/pages/admin/intake";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getRequiredPermissions } from "@/utils/permissionUtils";
import AdminDashboard from "@/pages/admin/dashboard/AdminDashboard";
import IntakeDetails from "@/pages/admin/intake/IntakeDetails";
import BatchDetails from "@/pages/admin/batch/BatchDetails";
const withPermissionProtection = (Component, path) => {
  const requiredPermissions = getRequiredPermissions(path);
  return () => (
    <ProtectedRoute requiredPermissions={requiredPermissions}>
      <Component />
    </ProtectedRoute>
  );
};

export const adminRoutes = [
  {
    path: "/admin",
    component: () => <Navigate to="/admin/dashboard" replace />,
  },
  {
    path: "/admin/dashboard",
    component: withPermissionProtection(AdminDashboard, "/admin/dashboard"),
  },
  {
    path: "/admin/program",
    component: withPermissionProtection(Programs, "/admin/program"),
  },
  {
    path: "/admin/program/$id",
    component: withPermissionProtection(ProgramDetail, "/admin/program"),
  },
  {
    path: "/admin/locations",
    component: withPermissionProtection(Locations, "/admin/locations"),
  },
  {
    path: "/admin/languages",
    component: withPermissionProtection(Language, "/admin/languages"),
  },
  {
    path: "/admin/admission-administration/application-review",
    component: withPermissionProtection(
      ApplicationReview,
      "/admin/admission-administration/application-review",
    ),
  },
  {
    path: "/admin/admission-administration/intakes",
    component: withPermissionProtection(
      Intakes,
      "/admin/admission-administration/intakes",
    ),
  },
  {
    path: "/admin/admission-administration/intakes/$id",
    component: withPermissionProtection(
      IntakeDetails,
      "/admin/admission-administration/intakes",
    ),
  },
  {
    path: "/admin/admission-administration/intakes/batch/$id",
    component: withPermissionProtection(
      BatchDetails,
      "/admin/admission-administration/intakes",
    ),
  },
  {
    path: "/admin/admin-management",
    component: withPermissionProtection(
      AdminManagement,
      "/admin/admin-management",
    ),
  },
  {
    path: "/admin/role-management",
    component: withPermissionProtection(
      RoleManagement,
      "/admin/role-management",
    ),
  },
];
