import DashboardCard from "@/components/admin/dashboard/DashboardCard";
import DashboardGraph from "@/components/admin/dashboard/DashboardGraph";
import { Activity, Users, CreditCard, TrendingUp } from "lucide-react";

const TeacherDashboard= () => {
  const stats = [
    {
      title: "Ongoing Courses",
      value: "12",
      changeText: "+15% compared to last month",
      icon: Activity,
    },
    {
      title: "Finished Courses",
      value: "+1500",
      changeText: "+90% compared to last month",
      icon: Users,
    },
    {
      title: "Total Earnings",
      value: "+8,500",
      changeText: "+25% compared to last month",
      icon: CreditCard,
    },
    {
      title: "Total Disbursement",
      value: "+300",
      changeText: "+100 since last hour",
      icon: TrendingUp,
    },
  ];
  const data = [
    { month: "Jan", a: 1200, b: 600 },
    { month: "Feb", a: 900, b: 400 },
    { month: "Mar", a: 800, b: 300 },
    { month: "Apr", a: 500, b: 3500 },
    { month: "May", a: 700, b: 1300 },
    { month: "Jun", a: 450, b: 1500 },
    { month: "Jul", a: 600, b: 1200 },
    { month: "Aug", a: 800, b: 1400 },
    { month: "Sep", a: 450, b: 1500 },
    { month: "Oct", a: 600, b: 1200 },
    { month: "Nov", a: 800, b: 1300 },
    { month: "Dec", a: 1000, b: 1400 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold">Welcome back, Maria!</h1>
        <p className="text-muted-foreground text-lg">
          All your courses, progress, and updates in one place.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item, index) => (
          <DashboardCard key={index} {...item} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardGraph title="Course Enrollment Trend" data={data} />

        <DashboardGraph title="Earnings Distribution" data={data} />
      </div>
    </div>
  );
};

export default TeacherDashboard;
