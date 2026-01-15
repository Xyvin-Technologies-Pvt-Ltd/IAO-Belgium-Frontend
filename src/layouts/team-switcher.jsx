import { useLocation } from "@tanstack/react-router";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import logo from "../assets/images/logo.png";
import { useTranslation } from "react-i18next";

export function TeamSwitcher() {
  const location = useLocation();
  const { t } = useTranslation();
  
  // Determine subtitle based on current path
  const getSubtitle = () => {
    if (location.pathname.startsWith('/teacher')) {
      return t("sidebar.teacher.title");
    } else if (location.pathname.startsWith('/admin')) {
      return t("sidebar.admin.title");
    }
    return t("sidebar.admin.dashboard");
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" className="cursor-default">
          <img src={logo} alt="logo" width="42" height="28" />
          <div className="grid flex-1 text-start text-sm leading-tight">
            <span className="truncate font-bold">{t("sidebar.logo")}</span>
            <span className="truncate text-xs">{getSubtitle()}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
