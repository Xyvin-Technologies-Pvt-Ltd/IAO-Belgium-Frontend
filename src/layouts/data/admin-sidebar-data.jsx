import {
  LayoutDashboard,
  NotebookText,
  BookUser,
  Users,
  GraduationCap,
  Bell,
  Archive,
} from "lucide-react";
import { filterSidebarByPermissions } from "@/utils/permissionUtils";

//* migration branch: this build's purpose is CoachView migration/archive
//* review, not full LMS operation. Sidebar is trimmed to Dashboard, the
//* already-converted-to-Mongo areas (Program Administration, Academic Years,
//* Academic Management), and the new CoachView Archive. Everything else
//* (Submissions, Planning, Examination, Finance, Master Data, Settings) is
//* hidden here — routes and permissions are untouched, so nothing is deleted,
//* just not linked from the nav.
export const getAdminSidebarData = (t, userPermissions = []) => {
  const sidebarData = {
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
                title: t("sidebar.admin.academics"),
                url: "/admin/admission-administration/academics",
              },
            ],
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
          {
            title: "Notification Management",
            url: "/admin/notification-management",
            icon: Bell,
          },
        ],
      },
      {
        title: t("sidebar.admin.coachviewArchive", { defaultValue: "CoachView Archive" }),
        items: [
          {
            title: t("sidebar.admin.archiveStudents", { defaultValue: "Students" }),
            url: "/admin/archive/students",
            icon: Archive,
          },
          {
            title: t("sidebar.admin.archiveProgrammes", { defaultValue: "Programmes" }),
            url: "/admin/archive/programmes",
            icon: Archive,
          },
          {
            title: t("sidebar.admin.archiveCohorts", { defaultValue: "Cohorts" }),
            url: "/admin/archive/cohorts",
            icon: Archive,
          },
          {
            title: t("sidebar.admin.archiveInvoices", { defaultValue: "Invoices" }),
            url: "/admin/archive/invoices",
            icon: Archive,
          },
          {
            title: t("sidebar.admin.archiveEntities", { defaultValue: "All entities" }),
            url: "/admin/archive/entities",
            icon: Archive,
          },
        ],
      },
    ],
  };

  // Filter sidebar based on user permissions
  return filterSidebarByPermissions(sidebarData, userPermissions);
};
