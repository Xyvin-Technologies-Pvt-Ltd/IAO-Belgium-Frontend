import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "react-country-state-city/dist/react-country-state-city.css";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router/Router.jsx";
import { Toaster } from "sonner";
import { useThemeStore } from "./store/useThemeStore";
import { useAuthStore } from "./store/useAuthStore";
import "./i18n/config";

// Initialize theme on app start
useThemeStore.getState().initializeTheme();

// Initialize auth state on app start (check for refresh token)
useAuthStore.getState().initializeAuth();

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  </StrictMode>
);
