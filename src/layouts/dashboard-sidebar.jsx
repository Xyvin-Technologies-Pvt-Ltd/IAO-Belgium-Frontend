import { useLocation } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { getTeacherSidebarData } from './data/teacher-sidebar-data'
import { getAdminSidebarData } from './data/admin-sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/useAuthStore'

export function DashboardSidebar() {
  const location = useLocation();
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  
  // Get user permissions from profile
  const userPermissions = profile?.role_access?.permissions || [];
  
  const getSidebarData = () => {
    if (location.pathname.startsWith('/teacher')) {
      return getTeacherSidebarData(t);
    } else if (location.pathname.startsWith('/admin')) {
      return getAdminSidebarData(t, userPermissions);
    } 
    return getTeacherSidebarData(t);
  };

  const currentSidebarData = getSidebarData();

  return (
    <Sidebar>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>

      <SidebarContent>
        {currentSidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}