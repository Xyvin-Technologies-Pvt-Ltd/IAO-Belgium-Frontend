import { Outlet } from "@tanstack/react-router";
import Header from "@/components/Header";

const ProtectedLayout = () => {
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
