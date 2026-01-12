import {
  LayoutDashboard,
  NotebookText,
  BookUser,
  BookMarked,
  Calendars,
  Users,
  Shield,
  GraduationCap,
  UserCheck,
  FileText,
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
          url: "/admin/program",
          icon: NotebookText,
        },
        {
          title: "Locations",
          url: "/admin/locations",
          icon: Calendars,
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
          title: "Planning",
          url: "/admin/planning",
          icon: Calendars,
        },
      ],
    },
      {
      title: "Academic Management",
      items: [
        {
          title: "Teacher Management",
          url: "/admin/teacher-management",
          icon: GraduationCap,
        },
        {
          title: "Student Management",
          url: "/admin/student-management",
          icon: Users,
        }
      ],
    },
    {
      title: "Settings",
      items: [
        {
          title: "Admin Management",
          url: "/admin/admin-management",
          icon: UserCheck,
        },
        {
          title: "Role Management",
          url: "/admin/role-management",
          icon: Shield,
        },
        {
          title: "Admin Logs",
          url: "/admin/admin-logs",
          icon: FileText,
        },
      ],
    },
  ],
};
