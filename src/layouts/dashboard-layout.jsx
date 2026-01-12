import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./dashboard-sidebar";
import { AppBreadcrumbs } from "../components/ui/AppBreadcrumbs";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Outlet } from "@tanstack/react-router";
import { BreadcrumbProvider } from "@/context/BreadCrumbContext";
import { useThemeStore } from "@/store/useThemeStore";
import { useEffect } from "react";

export default function DashboardLayoutComponent() {
  const { initializeTheme } = useThemeStore();

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <BreadcrumbProvider>
        <main className="flex min-h-svh flex-1 flex-col overflow-hidden bg-sidebar">
          <div className="sticky top-0 z-10 flex h-14 items-center gap-2 bg-sidebar/80 backdrop-blur-sm border-b border-sidebar-border px-4">
            <SidebarTrigger className="-ml-1" />
            <AppBreadcrumbs />
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>

          <div className="flex-1 p-4 overflow-auto bg-gradient-to-r from-dashboard-gradient-from to-dashboard-gradient-to">
            <Outlet />
          </div>
        </main>
      </BreadcrumbProvider>
    </SidebarProvider>
  );
}
