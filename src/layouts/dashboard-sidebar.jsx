import { useLocation } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { teacherSidebarData } from './data/teacher-sidebar-data'
import { adminSidebarData } from './data/admin-sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'

export function DashboardSidebar() {
  const location = useLocation();
  
  const getSidebarData = () => {
    if (location.pathname.startsWith('/teacher')) {
      return teacherSidebarData;
    } else if (location.pathname.startsWith('/admin')) {
      return adminSidebarData;
    } return teacherSidebarData;
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