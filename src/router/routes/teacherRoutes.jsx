import { Navigate } from "@tanstack/react-router";
import TeacherDashboard from "@/pages/teacher/TeacherDashboard";
import Schedules from "@/pages/teacher/schedule";

export const teacherRoutes = [
  { path: "/teacher", component: () => <Navigate to="/teacher/dashboard" replace /> },
  { path: "/teacher/dashboard", component: TeacherDashboard },
  { path: "/teacher/schedules", component: Schedules },
];