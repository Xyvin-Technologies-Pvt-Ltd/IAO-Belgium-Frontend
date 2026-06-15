import { useEffect, useState } from "react";
import DashboardCard from "@/components/admin/dashboard/DashboardCard";
import DashboardGraph from "@/components/admin/dashboard/DashboardGraph";
import LoadingState from "@/components/common/LoadingState";
import { Activity, Users, FileText, GraduationCap } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";
import { getAdminDashboardStats } from "@/api/dashboardApi";

const AdminDashboard = () => {
  const { profile, isLoading: isAuthLoading } = useAuthStore();
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(true);

  const firstName = profile?.first_name || "";
  const lastName = profile?.last_name || "";
  const fullName = `${lastName} ${firstName}`.trim();
  const displayName = fullName || "Admin";

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getAdminDashboardStats();
        setStats(response.data.stats);
        setGraphData(response.data.graphData);
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading || isAuthLoading) {
    return <LoadingState text={t("common.loading")} fullHeight />;
  }

  const statsList = stats ? [
    {
      title: t("dashboard.ongoingCourses"),
      value: String(stats.programs.value),
      changeText: t("dashboard.comparedToLastMonth", { percent: stats.programs.change }),
      icon: Activity,
    },
    {
      title: t("dashboard.pendingApplications"),
      value: String(stats.pendingApplications.value),
      changeText: t("dashboard.comparedToLastMonth", { percent: stats.pendingApplications.change }),
      icon: FileText,
    },
    {
      title: t("dashboard.activeStudents"),
      value: String(stats.activeStudents.value),
      changeText: t("dashboard.comparedToLastMonth", { percent: stats.activeStudents.change }),
      icon: Users,
    },
    {
      title: t("dashboard.activeLecturers"),
      value: String(stats.activeLecturers.value),
      changeText: t("dashboard.comparedToLastMonth", { percent: stats.activeLecturers.change }),
      icon: GraduationCap,
    }
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold">
          {isAuthLoading 
            ? t("common.welcome.back") 
            : t("common.welcome.backWithName", { name: displayName })
          }
        </h1>
        <p className="text-muted-foreground text-lg">
          {t("common.welcome.subtitle")}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsList.map((item, index) => (
          <DashboardCard key={index} {...item} />
        ))}
      </div>
      <div>
        <DashboardGraph title={t("dashboard.courseEnrollmentTrend")} data={graphData} />
      </div>
    </div>
  );
};

export default AdminDashboard;
