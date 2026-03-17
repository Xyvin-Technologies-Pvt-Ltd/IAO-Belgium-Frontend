import { Navigate } from "@tanstack/react-router";
import Programs from "@/pages/admin/program";
import Submissions from "@/pages/admin/submission";
import ProgramDetail from "@/pages/admin/program/ProgramDetail";
import Locations from "@/pages/admin/location";
import ApplicationReview from "@/pages/admin/application-review";
import AdminManagement from "@/pages/admin/admin-management";
import RoleManagement from "@/pages/admin/role-management";
import Language from "@/pages/admin/language";
import Intakes from "@/pages/admin/intake";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getRequiredPermissions } from "@/utils/permissionUtils";
import AdminDashboard from "@/pages/admin/dashboard/AdminDashboard";
import IntakeDetails from "@/pages/admin/intake/IntakeDetails";
import BatchDetails from "@/pages/admin/batch/BatchDetails";
import StudentDetails from "@/pages/admin/intake/StudentDetails";
import EnrolledStudentDetails from "@/pages/admin/intake/EnrolledStudentDetails";
import Academics from "@/pages/admin/academics";
import TeacherQualification from "@/pages/admin/teacher-qualification";
import Teachers from "@/pages/admin/teacher";
import TeacherDetails from "@/pages/admin/teacher/TeacherDetails";
import Planning from "@/pages/admin/planning";
import AllStudents from "@/pages/admin/student";
import StudentView from "@/pages/admin/student/StudentView";
import AllReports from "@/pages/admin/finance-management/AllReports";
import CityReports from "@/pages/admin/finance-management/CityReports";
import ProgramReports from "@/pages/admin/finance-management/ProgramReports";
import BatchReports from "@/pages/admin/finance-management/BatchReports";
import FinanceManagement from "@/pages/admin/finance-management";
import StudentwiseReport from "@/pages/admin/finance-management/StudentwiseReport";
import QuestionBanks from "@/pages/admin/question-bank";
import QuestionBankDetail from "@/pages/admin/question-bank/QuestionBankDetail";
import Exams from "@/pages/admin/exam";
import ExamDetail from "@/pages/admin/exam/ExamDetail";
import AttendenceView from "@/pages/admin/student/AttendenceView";

const withPermissionProtection = (Component, path) => {
  const requiredPermissions = getRequiredPermissions(path);
  return () => (
    <ProtectedRoute requiredPermissions={requiredPermissions}>
      <Component />
    </ProtectedRoute>
  );
};

export const adminRoutes = [
  {
    path: "/admin",
    component: () => <Navigate to="/admin/dashboard" replace />,
  },
  {
    path: "/admin/dashboard",
    component: withPermissionProtection(AdminDashboard, "/admin/dashboard"),
  },
  {
    path: "/admin/program",
    component: withPermissionProtection(Programs, "/admin/program"),
  },
  {
    path: "/admin/program/$id",
    component: withPermissionProtection(ProgramDetail, "/admin/program"),
  },
  {
    path: "/admin/planning",
    component: withPermissionProtection(Planning, "/admin/planning"),
  },
  {
    path: "/admin/locations",
    component: withPermissionProtection(Locations, "/admin/locations"),
  },
  {
    path: "/admin/languages",
    component: withPermissionProtection(Language, "/admin/languages"),
  },
  {
    path: "/admin/teacher-qualifications",
    component: withPermissionProtection(
      TeacherQualification,
      "/admin/teacher-qualification",
    ),
  },
  {
    path: "/admin/teacher-management",
    component: withPermissionProtection(Teachers, "/admin/teacher-management"),
  },
  {
    path: "/admin/teacher-management/$id",
    component: withPermissionProtection(
      TeacherDetails,
      "/admin/teacher-management",
    ),
  },
   {
    path: "/admin/student-management",
    component: withPermissionProtection(AllStudents, "/admin/student-management"),
  },
    {
    path: "/admin/student-management/$id",
    component: withPermissionProtection(
      StudentView,
      "/admin/student-management",
    ),
  },
  {path:"/admin/student-management/$id/attendence",
  component:withPermissionProtection(
    AttendenceView,
    "/admin/student-management",
  )},
  {
    path: "/admin/submission",
    component: withPermissionProtection(Submissions, "/admin/submission"),
  },
  {
    path: "/admin/submission/$id",
    component: withPermissionProtection(Submissions, "/admin/submission"),
  },
  {
    path: "/admin/finance-reports",
    component: withPermissionProtection(
      FinanceManagement,
      "/admin/finance-reports",
    ),
  },
  {
    path: "/admin/finance-reports/all",
    component: withPermissionProtection(
      AllReports,
      "/admin/finance-reports",
    ),
  },
  {
    path: "/admin/finance-reports/city",
    component: withPermissionProtection(
      CityReports,
      "/admin/finance-reports",
    ),
  },
  {
    path: "/admin/finance-reports/student",
    component: withPermissionProtection(
      StudentwiseReport,
      "/admin/student-reports",
    ),
  },
  {
    path: "/admin/finance-reports/program",
    component: withPermissionProtection(
      ProgramReports,
      "/admin/finance-reports",
    ),
  },
  {
    path: "/admin/finance-reports/batch",
    component: withPermissionProtection(
      BatchReports,
      "/admin/finance-reports",
    ),
  },
  {
    path: "/admin/admission-administration/application-review",
    component: withPermissionProtection(
      ApplicationReview,
      "/admin/admission-administration/application-review",
    ),
  },
  {
    path: "/admin/submissions",
    component: withPermissionProtection(
      Submissions,
      "/admin/submissions",
    ),
  },
  {
    path: "/admin/admission-administration/academics",
    component: withPermissionProtection(
      Academics,
      "/admin/admission-administration/academics",
    ),
  },
  {
    path: "/admin/admission-administration/academics/$id",
    component: withPermissionProtection(
      Intakes,
      "/admin/admission-administration/academics",
    ),
  },
  {
    path: "/admin/admission-administration/academics/intakes/$id",
    component: withPermissionProtection(
      IntakeDetails,
      "/admin/admission-administration/academics",
    ),
  },
  {
    path: "/admin/admission-administration/academics/intakes/student/$id",
    component: withPermissionProtection(
      EnrolledStudentDetails,
      "/admin/admission-administration/academics",
    ),
  },
  {
    path: "/admin/admission-administration/academics/intakes/batch/$id",
    component: withPermissionProtection(
      BatchDetails,
      "/admin/admission-administration/academics",
    ),
  },
  {
    path: "/admin/admission-administration/academics/intakes/batch/student/$id",
    component: withPermissionProtection(
      StudentDetails,
      "/admin/admission-administration/academics",
    ),
  },
  {
    path: "/admin/admin-management",
    component: withPermissionProtection(
      AdminManagement,
      "/admin/admin-management",
    ),
  },
  {
    path: "/admin/role-management",
    component: withPermissionProtection(
      RoleManagement,
      "/admin/role-management",
    ),
  },
  {
    path: "/admin/examination/question-banks",
    component: withPermissionProtection(
      QuestionBanks,
      "/admin/examination/question-banks",
    ),
  },
  {
    path: "/admin/examination/question-banks/$id",
    component: withPermissionProtection(
      QuestionBankDetail,
      "/admin/examination/question-banks",
    ),
  },
  {
    path: "/admin/examination/exams",
    component: withPermissionProtection(Exams, "/admin/examination/exams"),
  },
  {
    path: "/admin/examination/exams/$id",
    component: withPermissionProtection(
      ExamDetail,
      "/admin/examination/exams",
    ),
  },
];
