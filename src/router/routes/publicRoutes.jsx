import { Navigate } from "@tanstack/react-router";
import Login from "@/pages/Login";
import LoginSelection from "@/pages/LoginSelection";

export const publicRoutes = [
  { path: "/", component: () => <Navigate to="/login-selection" replace /> },
  { path: "/login-selection", component: LoginSelection },
  { path: "/login", component: Login },
];