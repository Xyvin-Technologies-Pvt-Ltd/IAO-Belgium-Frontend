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
import Courses from "@/pages/admin/course";
import StudentReview from "@/pages/student/review/StudentReview";
import Dashboard from "@/pages/student/Dashboard";
import Assessment from "@/pages/student/assessment";
import ModuleDetails from "@/pages/student/module/ModuleDetails";
import ChangeLocation from "@/pages/student/module/ChangeLocation";
import AppDetails from "@/pages/student/app/AppDetails";
import MyApp from "@/pages/student/app";
import MyCourses from "@/pages/student/module";
import NotFound from "../pages/NotFound";

const rootRoute = createRootRoute({
  component: RootLayout,
});

// Create the login route (public)
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: Login,
});

// Create the index route (redirect to login)
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <Navigate to="/login" replace />,
});

// Create protected layout route
const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  component: ProtectedLayout,
});

// Create dashboard layout route for teacher and admin
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "dashboard",
  component: DashboardLayout,
});

// Protected routes configuration (for students)
const protectedRoutes = [
  { path: "/application", component: ApplicationForm },
  { path: "/review", component: StudentReview },
  { path: "/student/dashboard", component: Dashboard },
  { path: "/student/assessment", component: Assessment },
  { path: "/student/app", component: MyApp },
  { path: "/student/courses", component: MyCourses },
  { path: "/student/module/$id", component: ModuleDetails },
  { path: "/student/change-location/$id", component: ChangeLocation },
  { path: "/student/app/$id", component: AppDetails },
];
// Dashboard routes configuration (for teacher and admin)
const dashboardRoutes = [
  { path: "/teacher", component: TeacherDashboard },
  { path: "/admin", component: AdminDashboard },
  { path: "/admin/course-administration/courses", component: Courses },
];

// Generate protected route children
const protectedRouteChildren = protectedRoutes.map(({ path, component }) =>
  createRoute({
    getParentRoute: () => protectedRoute,
    path,
    component,
  })
);

// Generate dashboard route children
const dashboardRouteChildren = dashboardRoutes.map(({ path, component }) =>
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
  protectedRoute.addChildren(protectedRouteChildren),
  dashboardRoute.addChildren(dashboardRouteChildren),
]);

// Create the router
export const router = createRouter({ 
  routeTree,
  defaultNotFoundComponent: NotFound,
});
