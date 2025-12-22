import { LayoutDashboard, Hash } from "lucide-react";

export const teacherSidebarData = {
  navGroups: [
    {
      title: "Main",
      items: [
        {
          title: "Dashboard",
          url: "/teacher",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Operations",
      items: [
        {
          title: "Schedules",
          url: "/teacher/schedules",
          icon: Hash,
        },
        {
          title: "Planning",
          url: "/teacher/planning",
          icon: Hash,
        },
        {
          title: "Documents",
          url: "/teacher/documents",
          icon: Hash,
        },
        {
          title: "Evaluations",
          url: "/teacher/evaluations",
          icon: Hash,
        },
      ],
    },
  ],
};
