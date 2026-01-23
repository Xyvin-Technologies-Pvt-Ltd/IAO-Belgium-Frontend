import { useAuthStore } from "@/store/useAuthStore";
import { Navigate } from "@tanstack/react-router";

const ProtectedRoute = ({ children, requiredPermissions = [] }) => {
  const { profile, isAuthenticated } = useAuthStore();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Get user permissions
  const userPermissions = profile?.role_access?.permissions || [];

  // Check if user has required permissions
  const hasAccess =
    requiredPermissions.length === 0 ||
    requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );

  // If no access, show unauthorized page or redirect
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Contact your administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
