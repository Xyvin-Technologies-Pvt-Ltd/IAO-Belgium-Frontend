import {
  LayoutDashboard,
  NotebookText,
  BookUser,
  BookMarked,
  Calendars,
  Users,
  Shield,
} from "lucide-react";

export const adminSidebarData = {
  navGroups: [
    {
      title: "Main",
      items: [
        {
          title: "Dashboard",
          url: "/admin/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Operations",
      items: [
        {
          title: "Program Administration",
          icon: NotebookText,
          items: [
            {
              title: "Program",
              url: "/admin/program-administration/program",
            },
            {
              title: "Locations",
              url: "/admin/program-administration/locations",
            },
          ],
        },
        {
          title: "Admission Administration",
          icon: BookUser,
          items: [
            {
              title: "Application Review",
              url: "/admin/admission-administration/application-review",
            },
            {
              title: "Intakes",
              url: "/admin/admission-administration/intakes",
            },
          ],
        },
        {
          title: "Class Administration",
          url: "/admin/class-administration",
          icon: BookMarked,
        },
        {
          title: "Planning",
          url: "/admin/planning",
          icon: Calendars,
        },
        {
          title: "Admin Management",
          url: "/admin/admin-management",
          icon: Users,
        },
         {
          title: "Role Management",
          url: "/admin/role-management",
          icon: Shield,
        },
      ],
    },
  ],
};
