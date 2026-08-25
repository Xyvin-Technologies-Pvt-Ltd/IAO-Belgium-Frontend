import {
  LayoutDashboard,
  NotebookText,
  BookUser,
  Users,
  Shield,
  GraduationCap,
  UserCheck,
  FileText,
  MapPin,
  Languages,
  Calendars,
  Award,
  ClipboardCheck,
  ScrollText,
  Bell,
  Link2,
  Activity,
  Plug,
  Layers,
  WalletCards,
  CreditCard,
  Landmark,
  Archive,
} from "lucide-react";
import { filterSidebarByPermissions } from "@/utils/permissionUtils";

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
                title: t("sidebar.admin.applicationReview"),
                url: "/admin/admission-administration/application-review",
              },
              {
                title: t("sidebar.admin.academics"),
                url: "/admin/admission-administration/academics",
              },
            ],
          },
          {
            title: t("sidebar.admin.submissions", { defaultValue: "Submissions" }),
            url: "/admin/submissions",
            icon: FileText,
          },
          {
            title: t("sidebar.admin.planning"),
            url: "/admin/planning",
            icon: Calendars,
          },
          {
            title: t("sidebar.admin.examination"),
            icon: ClipboardCheck,
            items: [
              {
                title: t("sidebar.admin.questionBanks"),
                url: "/admin/examination/question-banks",
              },
              {
                title: t("sidebar.admin.exams"),
                url: "/admin/examination/exams",
              },
              {
                title: t("sidebar.admin.results"),
                url: "/admin/results",
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
            icon: Users,
            items: [
              {
                title: t("sidebar.admin.allStudents", "All Students"),
                url: "/admin/student-management",
              },
              {
                title: t("sidebar.admin.locationChanges", "Location Changes"),
                url: "/admin/location-changes",
              },
            ],
          },
          {
            title: "Notification Management",
            url: "/admin/notification-management",
            icon: Bell,
          },
        ],
      },
      {
        title: t("sidebar.admin.financeManagement"),
        items: [
          {
            title: t("sidebar.admin.financeReports"),
            url: "/admin/finance-reports",
            icon: FileText,
          },
          {
            title: "KMO-Portefeuille",
            url: "/admin/kmo-applications",
            icon: WalletCards,
          },
          {
            title: "Third-Party Payments",
            url: "/admin/third-party-payments",
            icon: CreditCard,
          },
          {
            title: t("sidebar.admin.fkf", "Fachkursförderung"),
            url: "/admin/fkf",
            icon: Landmark,
          },
          {
            title: t("sidebar.admin.customInvoices"),
            url: "/admin/custom-invoices",
            icon: NotebookText,
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
            title: t("sidebar.admin.specialExceptions", "Special Exceptions"),
            url: "/admin/special-exceptions",
            icon: Activity,
          },
          {
            title: t("sidebar.admin.teacherQualifications"),
            url: "/admin/lecturer-data",
            icon: Award,
          },
          {
            title: t("sidebar.admin.accountingMappings", "Accounting Mappings"),
            url: "/admin/accounting-mappings",
            icon: WalletCards,
          },
          {
            title: "Contracts",
            icon: ScrollText,
            items: [
              {
                title: "All Contracts",
                url: "/admin/contracts",
              },
              {
                title: "Student Contracts",
                url: "/admin/student-contracts",
              },
            ],
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
            title: "LTI Integrations",
            url: "/admin/lti-management",
            icon: Link2,
          },
          {
            title: t("sidebar.admin.integrations"),
            url: "/admin/integrations",
            icon: Plug,
          },
          {
            title: t("sidebar.admin.queueManagement"),
            url: "/admin/queue-management",
            icon: Layers,
          },
          {
            title: "Student Corner",
            url: "/admin/student-corner",
            icon: LayoutDashboard,
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
