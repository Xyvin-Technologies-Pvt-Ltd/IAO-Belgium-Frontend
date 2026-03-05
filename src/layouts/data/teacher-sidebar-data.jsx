import {
  LayoutDashboard,
  CalendarCheck,
  Calendars,
  FileMinus,
  BookOpenCheck,
  ClipboardCheck,
} from "lucide-react";

export const getTeacherSidebarData = (t) => ({
  navGroups: [
    {
      title: t("sidebar.teacher.main"),
      items: [
        {
          title: t("sidebar.teacher.dashboard"),
          url: "/teacher/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: t("sidebar.teacher.operations"),
      items: [
        {
          title: t("sidebar.teacher.schedules"),
          url: "/teacher/schedules",
          icon: CalendarCheck,
        },
        {
          title: t("sidebar.teacher.planning"),
          url: "/teacher/planning",
          icon: Calendars,
        },
        {
          title: t("sidebar.teacher.documents"),
          url: "/teacher/documents",
          icon: FileMinus,
        },
        {
          title: t("sidebar.teacher.evaluations"),
          url: "/teacher/evaluations",
          icon: BookOpenCheck,
        },
        {
          title: t("sidebar.teacher.exams"),
          url: "/teacher/exams",
          icon: ClipboardCheck,
        },
      ],
    },
  ],
});
