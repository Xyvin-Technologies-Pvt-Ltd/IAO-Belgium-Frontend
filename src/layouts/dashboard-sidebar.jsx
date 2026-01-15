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

export function DashboardSidebar() {
  const location = useLocation();
  const { t } = useTranslation();
  
  const getSidebarData = () => {
    if (location.pathname.startsWith('/teacher')) {
      return getTeacherSidebarData(t);
    } else if (location.pathname.startsWith('/admin')) {
      return getAdminSidebarData(t);
    } return getTeacherSidebarData(t);
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