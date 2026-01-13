import { Outlet, useNavigate, useLocation } from "@tanstack/react-router"
import { useEffect } from "react"
import { useAuthStore } from "@/store/useAuthStore"
import DashboardLayoutComponent from "./dashboard-layout"

export default function DashboardLayout() {
  const { isAuthenticated, role } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isAuthenticated) {
      console.log("[DashboardLayout] redirecting to login")
      navigate({ to: "/login" })
      return
    }

    // Role-based route protection
    const currentPath = location.pathname
    
    // Check if user is trying to access admin routes
    if (currentPath.startsWith("/admin")) {
      // Only ADMIN can access admin routes
      if (role !== "ADMIN") {
        console.log("[DashboardLayout] Unauthorized access to admin routes")
        navigate({ to: "/login" })
        return
      }
    }
  }, [isAuthenticated, role, navigate, location.pathname])

  if (!isAuthenticated) {
    return <div>Redirecting...</div>
  }

  return <DashboardLayoutComponent />
}
