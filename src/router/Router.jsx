import {
  createRouter,
  createRootRoute,
  createRoute,
  Navigate,
} from "@tanstack/react-router";
import RootLayout from "../layouts/RootLayout";
import ProtectedLayout from "../layouts/ProtectedLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import Login from "../pages/student/Login";
import ApplicationForm from "../pages/student/application/ApplicationForm";
import TeacherDashboard from "../pages/teacher/TeacherDashboard";
import AdminDashboard from "../pages/admin/AdminDashboard";
import StudentReview from "@/pages/student/review/StudentReview";
import Dashboard from "@/pages/student/Dashboard";
import Assessment from "@/pages/student/assessment";
import ModuleDetails from "@/pages/student/module/ModuleDetails";
import ChangeLocation from "@/pages/student/module/ChangeLocation";
import AppDetails from "@/pages/student/app/AppDetails";
import MyApp from "@/pages/student/app";
import MyCourses from "@/pages/student/module";
import NotFound from "../pages/NotFound";
import Schedules from "@/pages/teacher/schedule";
import Programs from "@/pages/admin/program";
import ProgramDetail from "@/pages/admin/program/ProgramDetail";
import Locations from "@/pages/admin/location";
import ApplicationReview from "@/pages/admin/application-review";
import AdminManagement from "@/pages/admin/admin-management";
import RoleManagement from "@/pages/admin/role-management";

const rootRoute = createRootRoute({
  component: RootLayout,
});

// Public routes
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: Login,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <Navigate to="/login" replace />,
});

// Protected layout for students
const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  component: ProtectedLayout,
});

// Dashboard layout for teachers and admins
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "dashboard",
  component: DashboardLayout,
});

// Student routes (use ProtectedLayout)
const studentRoutes = [
  {
    path: "/student",
    component: () => <Navigate to="/student/dashboard" replace />,
  },
  { path: "/student/dashboard", component: Dashboard },
  { path: "/student/application", component: ApplicationForm },
  { path: "/student/review", component: StudentReview },
  { path: "/student/assessment", component: Assessment },
  { path: "/student/app", component: MyApp },
  { path: "/student/app/$id", component: AppDetails },
  { path: "/student/courses", component: MyCourses },
  { path: "/student/module/$id", component: ModuleDetails },
  { path: "/student/change-location/$id", component: ChangeLocation },
];

// Teacher routes (use DashboardLayout)
const teacherRoutes = [
  {
    path: "/teacher",
    component: () => <Navigate to="/teacher/dashboard" replace />,
  },
  { path: "/teacher/dashboard", component: TeacherDashboard },
  { path: "/teacher/schedules", component: Schedules },
];

// Admin routes (use DashboardLayout)
const adminRoutes = [
  {
    path: "/admin",
    component: () => <Navigate to="/admin/dashboard" replace />,
  },
  { path: "/admin/dashboard", component: AdminDashboard },
  { path: "/admin/program", component: Programs },
  { path: "/admin/program/$id", component: ProgramDetail },
  { path: "/admin/locations", component: Locations },
  {
    path: "/admin/admission-administration/application-review",
    component: ApplicationReview,
  },
  { path: "/admin/admin-management", component: AdminManagement },
  { path: "/admin/role-management", component: RoleManagement },
];

// Generate route children
const studentRouteChildren = studentRoutes.map(({ path, component }) =>
  createRoute({
    getParentRoute: () => protectedRoute,
    path,
    component,
  })
);

const teacherRouteChildren = teacherRoutes.map(({ path, component }) =>
  createRoute({
    getParentRoute: () => dashboardRoute,
    path,
    component,
  })
);

const adminRouteChildren = adminRoutes.map(({ path, component }) =>
  createRoute({
    getParentRoute: () => dashboardRoute,
    path,
    component,
  })
);

// Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  protectedRoute.addChildren(studentRouteChildren),
  dashboardRoute.addChildren([...teacherRouteChildren, ...adminRouteChildren]),
]);

// Create the router
export const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFound,
});
