import { Outlet, useNavigate, useLocation } from "@tanstack/react-router"
import { useEffect } from "react"
import { useAuthStore } from "@/store/useAuthStore"
import AdminTeacherLayoutComponent from "./admin-teacher-layout"
import LoadingSpinner from "@/components/common/LoadingSpinner"

export default function AdminTeacherLayout() {
  const { isAuthenticated, role, isInitialized } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Wait for auth initialization to complete
    if (!isInitialized) {
      return
    }

    if (!isAuthenticated) {
      navigate({ to: "/login" })
      return
    }

    // Role-based route protection
    const currentPath = location.pathname
    
    // Check if user is trying to access admin routes
    if (currentPath.startsWith("/admin")) {
      // Only ADMIN can access admin routes
      if (role !== "admin") {
        navigate({ to: "/login" })
        return
      }
    }

    // Check if user is trying to access teacher routes
    if (currentPath.startsWith("/teacher")) {
      // Only TEACHER can access teacher routes
      if (role !== "teacher") {
        navigate({ to: "/login" })
        return
      }
    }
  }, [isAuthenticated, role, isInitialized, navigate, location.pathname])

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-black">
        <div className="text-center">
          <LoadingSpinner 
            size="xl" 
            text="Initializing..." 
            className="mb-4"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">Please wait while we set up your workspace</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-black">
        <div className="text-center">
          <LoadingSpinner 
            size="lg" 
            text="Redirecting..." 
            className="mb-4"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">Taking you to the login page</p>
        </div>
      </div>
    )
  }

  return <AdminTeacherLayoutComponent />
}
