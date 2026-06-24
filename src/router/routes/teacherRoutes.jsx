import { Navigate } from "@tanstack/react-router";
import ProtectedRoute from "@/components/ProtectedRoute";
import TeacherDashboard from "@/pages/teacher/TeacherDashboard";
import Plannings from "@/pages/teacher/planning";
import SessionAttendence from "@/pages/teacher/session/SessionAttendence";
import ModuleScheduleList from "@/pages/teacher/schedule/ModuleScheduleList";
import SessionScheduleList from "@/pages/teacher/schedule/SessionScheduleList";
import ModuleView from "@/pages/teacher/schedule/ModuleView";
import Evaluations from "@/pages/teacher/evaluvations";
import ViewSubmission from "@/pages/teacher/evaluvations/ViewSubmission";
import ExamList from "@/pages/teacher/exam";
import OtherExamList from "@/pages/teacher/exam/OtherExamList";
import OtherExamDetail from "@/pages/teacher/exam/OtherExamDetail";
import ExamDetail from "@/pages/teacher/exam/ExamDetail";
import TeacherNotifications from "@/pages/teacher/notification";
import TeacherNotificationDetail from "@/pages/teacher/notification/NotificationDetail";

// Mirror the admin tree's guard pattern so both portals are uniform. Teachers
// have no fine-grained permission map yet, so this enforces authentication and
// leaves a hook for per-page permissions later. (Real enforcement is server-side.)
const withTeacherProtection = (Component) => {
  const Wrapped = () => (
    <ProtectedRoute>
      <Component />
    </ProtectedRoute>
  );
  Wrapped.displayName = `TeacherProtected(${Component?.name || "Component"})`;
  return Wrapped;
};

export const teacherRoutes = [
  {
    path: "/teacher",
    component: () => <Navigate to="/teacher/dashboard" replace />,
  },
  { path: "/teacher/dashboard", component: withTeacherProtection(TeacherDashboard) },
  { path: "/teacher/mark-attendance/$id", component: withTeacherProtection(SessionAttendence) },
  { path: "/teacher/planning", component: withTeacherProtection(Plannings) },
  { path: "/teacher/schedules/module/$id", component: withTeacherProtection(SessionScheduleList) },
  { path: "/teacher/schedules", component: withTeacherProtection(ModuleScheduleList) },
  { path: "/teacher/schedules/$id", component: withTeacherProtection(ModuleView) },
  { path: "/teacher/evaluations", component: withTeacherProtection(Evaluations) },
  { path: "/teacher/evaluations/$id", component: withTeacherProtection(ViewSubmission) },
  { path: "/teacher/exams", component: withTeacherProtection(ExamList) },
  { path: "/teacher/other-exams", component: withTeacherProtection(OtherExamList) },
  { path: "/teacher/other-exams/$exam_id", component: withTeacherProtection(OtherExamDetail) },
  { path: "/teacher/exams/$exam_id/$planning_id", component: withTeacherProtection(ExamDetail) },
  { path: "/teacher/notifications", component: withTeacherProtection(TeacherNotifications) },
  { path: "/teacher/notifications/$id", component: withTeacherProtection(TeacherNotificationDetail) },
];
