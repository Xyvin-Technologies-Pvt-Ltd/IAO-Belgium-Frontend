import { Navigate } from "@tanstack/react-router";
import Login from "@/pages/Login";

export const publicRoutes = [
  { path: "/", component: () => <Navigate to="/login" replace /> },
  { path: "/login", component: Login },
];