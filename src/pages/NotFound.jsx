import { Link, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, BookOpen } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

const NotFound = () => {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();

  const handleGoBack = () => {
    router.history.back();
  };

  const getHomeRoute = () => {
    if (!isAuthenticated) {
      return "/login";
    }
    
    if (role === "admin") {
      return "/admin/dashboard";
    } else if (role === "TEACHER") {
      return "/teacher/dashboard";
    } else {
      return "/login"; // Default fallback for unknown roles
    }
  };

  const getHomeButtonText = () => {
    if (!isAuthenticated) {
      return "Go to Login";
    }
    return "Go to Dashboard";
  };

  return (
    <div className="min-h-screen bg-linear-gradient from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="text-6xl font-bold text-indigo-600 mb-4">404</div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Page Not Found
          </h1>
          <p className="text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="mb-8">
          <BookOpen className="w-24 h-24 text-indigo-300 mx-auto" />
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link to={getHomeRoute()}>
              <Home className="w-4 h-4 mr-2" />
              {getHomeButtonText()}
            </Link>
          </Button>

          <Button variant="outline" onClick={handleGoBack} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
