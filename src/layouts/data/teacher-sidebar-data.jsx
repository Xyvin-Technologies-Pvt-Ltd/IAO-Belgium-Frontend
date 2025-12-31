import {
  LayoutDashboard,
  CalendarCheck,
  Calendars,
  FileMinus,
  BookOpenCheck,
} from "lucide-react";

export const teacherSidebarData = {
  navGroups: [
    {
      title: "Main",
      items: [
        {
          title: "Dashboard",
          url: "/teacher/dashboard",
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
          icon: CalendarCheck,
        },
        {
          title: "Planning",
          url: "/teacher/planning",
          icon: Calendars,
        },
        {
          title: "Documents",
          url: "/teacher/documents",
          icon: FileMinus,
        },
        {
          title: "Evaluations",
          url: "/teacher/evaluations",
          icon: BookOpenCheck,
        },
      ],
    },
  ],
};
