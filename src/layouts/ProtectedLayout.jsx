import { Outlet } from "@tanstack/react-router";
import Header from "@/components/Header";

const ProtectedLayout = () => {
  // For now, we're not implementing auth checks
  // In a real app, you would check authentication here

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedLayout;
