import React from "react";
import {
  createRouter,
  createRootRoute,
  createRoute,
  Navigate,
} from "@tanstack/react-router";
import RootLayout from "../layouts/RootLayout";
import ProtectedLayout from "../layouts/ProtectedLayout";
import Login from "../pages/student/Login";
import ApplicationForm from "../pages/student/ApplicationForm";


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
  component: () => <Navigate to="/login" />,
});

// Create protected layout route
const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  component: ProtectedLayout,
});

// Protected routes configuration
const protectedRoutes = [
  { path: "/application", component: ApplicationForm },
];

// Generate protected route children
const protectedRouteChildren = protectedRoutes.map(({ path, component }) =>
  createRoute({
    getParentRoute: () => protectedRoute,
    path,
    component,
  })
);

// Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  protectedRoute.addChildren(protectedRouteChildren),
]);

// Create the router
export const router = createRouter({ routeTree });