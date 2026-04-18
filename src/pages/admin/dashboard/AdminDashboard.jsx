import DashboardCard from "@/components/admin/dashboard/DashboardCard";
import DashboardGraph from "@/components/admin/dashboard/DashboardGraph";
import { Activity, Users, CreditCard, TrendingUp } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";

const AdminDashboard = () => {
  const { profile, isLoading } = useAuthStore();
  const { t } = useTranslation();
  
  const firstName = profile?.first_name || "";
  const lastName = profile?.last_name || "";
  const fullName = `${lastName} ${firstName}`.trim();
  const displayName = fullName || "Admin";

  const stats = [
    {
      title: t("dashboard.ongoingCourses"),
      value: "12",
      changeText: t("dashboard.comparedToLastMonth", { percent: "+15%" }),
      icon: Activity,
    },
    {
      title: t("dashboard.finishedCourses"),
      value: "+1500",
      changeText: t("dashboard.comparedToLastMonth", { percent: "+90%" }),
      icon: Users,
    }
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
        <h1 className="text-4xl font-semibold">
          {isLoading 
            ? t("common.welcome.back") 
            : t("common.welcome.backWithName", { name: displayName })
          }
        </h1>
        <p className="text-muted-foreground text-lg">
          {t("common.welcome.subtitle")}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {stats.map((item, index) => (
          <DashboardCard key={index} {...item} />
        ))}
      </div>
      <div>
        <DashboardGraph title={t("dashboard.courseEnrollmentTrend")} data={data} />
      </div>
    </div>
  );
};

export default AdminDashboard;
