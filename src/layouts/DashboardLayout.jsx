import { Outlet, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import DashboardLayoutComponent from "./dashboard-layout"

function useAuth() {
  const token = "4ZbFyedjehdkjkhj"
  return { isAuthenticated: !!token }
}

export default function DashboardLayout() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      console.log("[DashboardLayout] redirecting to login")
      navigate({ to: "/login" })
    }
  }, [isAuthenticated, navigate])

  if (!isAuthenticated) {
    return <div>Redirecting...</div>
  }

  return <DashboardLayoutComponent />
}
