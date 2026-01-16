import { Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import Header from "@/components/Header";

const ProtectedLayout = () => {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth initialization to complete
    if (!isInitialized) {
      return;
    }

    if (!isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, isInitialized, navigate]);

  // Show loading while initializing
  if (!isInitialized) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-linear-to-r from-[#E3E5E6] to-[#FFECD7]">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedLayout;
