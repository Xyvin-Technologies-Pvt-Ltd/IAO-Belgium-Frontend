import { Outlet, useNavigate, useLocation } from "@tanstack/react-router"
import { useEffect } from "react"
import { useAuthStore } from "@/store/useAuthStore"
import AdminTeacherLayoutComponent from "./admin-teacher-layout"

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
      console.log("[AdminTeacherLayout] redirecting to login")
      navigate({ to: "/login" })
      return
    }

    // Role-based route protection
    const currentPath = location.pathname
    
    // Check if user is trying to access admin routes
    if (currentPath.startsWith("/admin")) {
      // Only ADMIN can access admin routes
      if (role !== "admin") {
        console.log("[AdminTeacherLayout] Unauthorized access to admin routes")
        navigate({ to: "/login" })
        return
      }
    }
  }, [isAuthenticated, role, isInitialized, navigate, location.pathname])

  // Show loading while initializing
  if (!isInitialized) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!isAuthenticated) {
    return <div>Redirecting...</div>
  }

  return <AdminTeacherLayoutComponent />
}
