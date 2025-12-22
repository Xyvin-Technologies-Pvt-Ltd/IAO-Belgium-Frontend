import { useLocation } from "@tanstack/react-router";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import logo from "../assets/images/logo.png";

export function TeamSwitcher() {
  const location = useLocation();
  
  // Determine subtitle based on current path
  const getSubtitle = () => {
    if (location.pathname.startsWith('/teacher')) {
      return "Teacher Dashboard";
    } else if (location.pathname.startsWith('/admin')) {
      return "Admin Dashboard";
    }
    return "Dashboard";
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" className="cursor-default">
          <img src={logo} alt="logo" width="42" height="28" />
          <div className="grid flex-1 text-start text-sm leading-tight">
            <span className="truncate font-bold">IAO Back office</span>
            <span className="truncate text-xs">{getSubtitle()}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
