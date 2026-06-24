import {
  createRouter,
  createRootRoute,
  createRoute,
  ErrorComponent,
} from "@tanstack/react-router";
import RootLayout from "../layouts/RootLayout";
import AdminTeacherLayout from "../layouts/AdminTeacherLayout";
import NotFound from "../pages/NotFound";
import ErrorBoundary from "@/components/ErrorBoundary";
import { publicRoutes } from "./routes/publicRoutes.jsx";
import { teacherRoutes } from "./routes/teacherRoutes.jsx";
import { adminRoutes } from "./routes/adminRoutes.jsx";
import { PORTAL } from "../config/portal";

// Root route
const rootRoute = createRootRoute({
  component: RootLayout,
  errorComponent: ErrorComponent,
});

// Protected layout route
const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  component: AdminTeacherLayout,
});

// Helper function to create routes
const createProtectedRoute = (path, component) =>
  createRoute({
    getParentRoute: () => protectedRoute,
    path,
    component,
  });

const createPublicRoute = (path, component) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path,
    component,
  });

// Create route objects
const publicRouteObjects = publicRoutes.map(({ path, component }) => 
  createPublicRoute(path, component)
);

// Only mount the route tree(s) for the portal this domain serves, so
// admin.* never ships teacher routes and vice-versa. "both" (local/legacy
// single domain) keeps the original behaviour of mounting both trees.
const activeTeacherRoutes = PORTAL === "admin" ? [] : teacherRoutes;
const activeAdminRoutes = PORTAL === "teacher" ? [] : adminRoutes;

const protectedRouteObjects = [
  ...activeTeacherRoutes.map(({ path, component }) => createProtectedRoute(path, component)),
  ...activeAdminRoutes.map(({ path, component }) => createProtectedRoute(path, component)),
];

// Create the route tree
const routeTree = rootRoute.addChildren([
  ...publicRouteObjects,
  protectedRoute.addChildren(protectedRouteObjects),
]);

// Create and export the router
export const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFound,
  defaultErrorComponent: ({ error }) => (
    <ErrorBoundary>
      <ErrorComponent error={error} />
    </ErrorBoundary>
  ),
  context: {
    errorBoundary: ErrorBoundary,
  },
});