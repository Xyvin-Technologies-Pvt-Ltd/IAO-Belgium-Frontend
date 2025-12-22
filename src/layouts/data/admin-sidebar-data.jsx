import { LayoutDashboard, Hash } from "lucide-react";

export const adminSidebarData = {
  navGroups: [
    {
      title: "Main",
      items: [
        {
          title: "Dashboard",
          url: "/admin",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Operations",
      items: [
        {
          title: "Course Administration",
          icon: Hash,
          items: [
            {
              title: "Courses",
              url: "/admin/course-administration/courses",
            },
            {
              title: "Locations",
              url: "/admin/course-administration/locations",
            },
          ],
        },
        {
          title: "Admission Administration",
          icon: Hash,
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
          icon: Hash,
        },
        {
          title: "Planning",
          url: "/admin/planning",
          icon: Hash,
        },
      ],
    },
  ],
};
