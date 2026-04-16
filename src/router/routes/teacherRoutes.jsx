import { Navigate } from "@tanstack/react-router";
import TeacherDashboard from "@/pages/teacher/TeacherDashboard";
import Plannings from "@/pages/teacher/planning";
import SessionAttendence from "@/pages/teacher/session/SessionAttendence";
import ModuleScheduleList from "@/pages/teacher/schedule/ModuleScheduleList";
import SessionScheduleList from "@/pages/teacher/schedule/SessionScheduleList";
import ModuleView from "@/pages/teacher/schedule/ModuleView";
import Evaluations from "@/pages/teacher/evaluvations";
import ViewSubmission from "@/pages/teacher/evaluvations/ViewSubmission";
import ExamList from "@/pages/teacher/exam";
import ExamDetail from "@/pages/teacher/exam/ExamDetail";
import TeacherNotifications from "@/pages/teacher/notification";

export const teacherRoutes = [
  {
    path: "/teacher",
    component: () => <Navigate to="/teacher/dashboard" replace />,
  },
  { path: "/teacher/dashboard", component: TeacherDashboard },
  { path: "/teacher/mark-attendance/$id", component: SessionAttendence },
  { path: "/teacher/planning", component: Plannings },
  { path: "/teacher/schedules/module/$id", component: SessionScheduleList },
  { path: "/teacher/schedules", component: ModuleScheduleList },
  { path: "/teacher/schedules/$id", component: ModuleView },
  { path: "/teacher/evaluations", component: Evaluations },
  { path: "/teacher/evaluations/$id", component: ViewSubmission },
  { path: "/teacher/exams", component: ExamList },
  { path: "/teacher/exams/$exam_id/$planning_id", component: ExamDetail },
  { path: "/teacher/notifications", component: TeacherNotifications },
];
