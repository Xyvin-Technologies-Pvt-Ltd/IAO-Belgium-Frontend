import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./dashboard-sidebar";
import { AppBreadcrumbs } from "../components/ui/AppBreadcrumbs";
import { Outlet } from "@tanstack/react-router";
import { BreadcrumbProvider } from "@/context/BreadCrumbContext";

export default function DashboardLayoutComponent() {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <BreadcrumbProvider>
        <main className="flex min-h-svh flex-1 flex-col overflow-hidden bg-linear-to-r from-[#E3E5E6] to-[#FFECD7]">
          <div className="sticky top-0 z-10 flex h-14 items-center gap-2 bg-transparent px-4">
            <SidebarTrigger className="-ml-1" />
            <AppBreadcrumbs />
          </div>

          <div className="flex-1 p-4 overflow-auto ">
            <Outlet />
          </div>
        </main>
      </BreadcrumbProvider>
    </SidebarProvider>
  );
}
