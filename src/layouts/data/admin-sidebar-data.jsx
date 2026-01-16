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
  MapPin,
  Languages,
  UserCog,
} from "lucide-react";

export const getAdminSidebarData = (t) => ({
  navGroups: [
    {
      title: t("sidebar.admin.main"),
      items: [
        {
          title: t("sidebar.admin.dashboard"),
          url: "/admin/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },

    {
      title: t("sidebar.admin.operations"),
      items: [
        {
          title: t("sidebar.admin.programAdministration"),
          url: "/admin/program",
          icon: NotebookText,
        },

        {
          title: t("sidebar.admin.admissionAdministration"),
          icon: BookUser,
          items: [
            {
              title: t("sidebar.admin.applicationReview"),
              url: "/admin/admission-administration/application-review",
            },
            {
              title: t("sidebar.admin.intakes"),
              url: "/admin/admission-administration/intakes",
            },
          ],
        },

        {
          title: t("sidebar.admin.planning"),
          url: "/admin/planning",
          icon: Calendars,
        },
      ],
    },
    {
      title: t("sidebar.admin.academicManagement"),
      items: [
        {
          title: t("sidebar.admin.teacherManagement"),
          url: "/admin/teacher-management",
          icon: GraduationCap,
        },
        {
          title: t("sidebar.admin.studentManagement"),
          url: "/admin/student-management",
          icon: Users,
        },
      ],
    },
    {
      title: t("sidebar.admin.masterData"),
      items: [
        {
          title: t("sidebar.admin.locations"),
          url: "/admin/locations",
          icon: MapPin,
        },
        {
          title: t("sidebar.admin.languages"),
          url: "/admin/languages",
          icon: Languages,
        },

        {
          title: t("sidebar.admin.teacherData"),
          url: "/admin/teacher-data",
          icon: UserCog,
        },
      ],
    },
    {
      title: t("sidebar.admin.settings"),
      items: [
        {
          title: t("sidebar.admin.adminManagement"),
          url: "/admin/admin-management",
          icon: UserCheck,
        },
        {
          title: t("sidebar.admin.roleManagement"),
          url: "/admin/role-management",
          icon: Shield,
        },
        {
          title: t("sidebar.admin.adminLogs"),
          url: "/admin/admin-logs",
          icon: FileText,
        },
      ],
    },
  ],
});
