import { Navigate } from "@tanstack/react-router";
import TeacherDashboard from "@/pages/teacher/TeacherDashboard";
import Plannings from "@/pages/teacher/planning";
import SessionAttendence from "@/pages/teacher/session/SessionAttendence";
import ModuleScheduleList from "@/pages/teacher/schedule/ModuleScheduleList";
import SessionScheduleList from "@/pages/teacher/schedule/SessionScheduleList";
import ModuleView from "@/pages/teacher/schedule/ModuleView";

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
];
