import { Outlet } from "@tanstack/react-router";

const RootLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
};

export default RootLayout;