import { Outlet } from "@tanstack/react-router";

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
};

export default AuthLayout;