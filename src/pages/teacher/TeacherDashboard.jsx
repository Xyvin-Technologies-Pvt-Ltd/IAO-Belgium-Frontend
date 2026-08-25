import { useEffect, useState } from "react";
import DashboardCard from "@/components/admin/dashboard/DashboardCard";
import DashboardGraph from "@/components/admin/dashboard/DashboardGraph";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";
import { getTeacherDashboardStats } from "@/api/dashboardApi";
import { formatTZ } from "@/utils/dateUtils";
import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  BookOpenCheck,
  CalendarCheck,
  ClipboardCheck,
  Calendars,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

const TeacherDashboard = () => {
  const { profile, isLoading: isAuthLoading } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const firstName = profile?.first_name || "";
  const lastName = profile?.last_name || "";
  const fullName = `${lastName} ${firstName}`.trim();
  const displayName = fullName || "Teacher";

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getTeacherDashboardStats();
        setDashboardData(response.data);
      } catch (error) {
        console.error("Failed to load teacher dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading || isAuthLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 md:w-96" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="bg-sidebar rounded-xl p-5 border border-sidebar-border"
            >
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats;
  const statsList = stats
    ? [
        {
          title: t("dashboard.teacher.pendingInvites"),
          value: String(stats.pendingInvites.value),
          subtitle: t("dashboard.teacher.pendingInvitesHint"),
          icon: Calendars,
          onClick: () => navigate({ to: "/teacher/planning" }),
        },
        {
          title: t("dashboard.teacher.acceptedModules"),
          value: String(stats.acceptedModules.value),
          subtitle: t("dashboard.teacher.acceptedModulesHint"),
          icon: CalendarCheck,
          onClick: () => navigate({ to: "/teacher/schedules" }),
        },
        {
          title: t("dashboard.teacher.pendingEvaluations"),
          value: String(stats.pendingEvaluations.value),
          subtitle: t("dashboard.teacher.pendingEvaluationsHint", {
            completed: stats.completedEvaluations.value,
          }),
          icon: BookOpenCheck,
          onClick: () => navigate({ to: "/teacher/evaluations" }),
        },
        {
          title: t("dashboard.teacher.assignedExams"),
          value: String(stats.assignedExams.value),
          subtitle: t("dashboard.teacher.assignedExamsHint", {
            unread: stats.unreadNotifications.value,
          }),
          icon: ClipboardCheck,
          onClick: () => navigate({ to: "/teacher/exams" }),
        },
        {
          title: t("sidebar.teacher.practicalExams", { defaultValue: "Practical Exams" }),
          value: String(stats.otherExams.value),
          subtitle: t("dashboard.teacher.practicalExamsHint", {
            defaultValue: "Assigned practical exams",
          }),
          icon: ClipboardCheck,
          onClick: () => navigate({ to: "/teacher/practical-exams" }),
        },
      ]
    : [];

  const upcomingSessions = dashboardData?.upcomingSessions || [];
  const recentSubmissions = dashboardData?.recentSubmissions || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold">
          {t("common.welcome.backWithName", { name: displayName })}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t("dashboard.teacher.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statsList.map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={item.onClick}
            className="text-left"
          >
            <DashboardCard {...item} />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-sidebar-foreground">
              {t("dashboard.teacher.upcomingSessions")}
            </h3>
            <button
              type="button"
              onClick={() => navigate({ to: "/teacher/schedules" })}
              className="text-sm text-primary hover:underline"
            >
              {t("dashboard.teacher.viewAll")}
            </button>
          </div>

          {upcomingSessions.length === 0 ? (
            <p className="text-sm text-sidebar-foreground/70">
              {t("dashboard.teacher.noUpcomingSessions")}
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <div
                  key={session.session_id}
                  className="rounded-lg border border-sidebar-border p-3"
                >
                  <p className="font-medium text-sidebar-foreground">
                    {session.module_name || session.name}
                  </p>
                  <p className="text-sm text-sidebar-foreground/70">
                    {session.batch_name}
                    {session.program_name ? ` • ${session.program_name}` : ""}
                  </p>
                  <p className="text-sm text-sidebar-foreground/70 mt-1">
                    {formatTZ(session.session_date, "DD-MM-YYYY")}
                    {session.start_time && session.end_time
                      ? ` • ${formatTZ(session.start_time, "HH:mm")} - ${formatTZ(session.end_time, "HH:mm")}`
                      : session.start_time
                        ? ` • ${formatTZ(session.start_time, "HH:mm")}`
                        : ""}
                  </p>
                  {session.venue && (
                    <p className="text-xs text-sidebar-foreground/60 mt-1">
                      {session.venue}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-sidebar-foreground">
              {t("dashboard.teacher.recentSubmissions")}
            </h3>
            <button
              type="button"
              onClick={() => navigate({ to: "/teacher/evaluations" })}
              className="text-sm text-primary hover:underline"
            >
              {t("dashboard.teacher.viewAll")}
            </button>
          </div>

          {recentSubmissions.length === 0 ? (
            <p className="text-sm text-sidebar-foreground/70">
              {t("dashboard.teacher.noRecentSubmissions")}
            </p>
          ) : (
            <div className="space-y-3">
              {recentSubmissions.map((submission) => (
                <button
                  key={submission._id}
                  type="button"
                  onClick={() =>
                    navigate({
                      to: "/teacher/evaluations/$id",
                      params: { id: submission._id },
                    })
                  }
                  className="w-full rounded-lg border border-sidebar-border p-3 text-left hover:bg-sidebar-accent/40 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-sidebar-foreground">
                        {submission.student_name || t("dashboard.teacher.unknownStudent")}
                      </p>
                      <p className="text-sm text-sidebar-foreground/70">
                        {submission.component_name || submission.submission_type}
                      </p>
                      <p className="text-xs text-sidebar-foreground/60 mt-1">
                        {submission.program_name}
                        {submission.batch_name ? ` • ${submission.batch_name}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={submission.status || "submitted"} />
                  </div>
                </button>
              ))}
            </div>
          )}

          {stats?.unreadNotifications?.value > 0 && (
            <button
              type="button"
              onClick={() => navigate({ to: "/teacher/notifications" })}
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Bell className="h-4 w-4" />
              {t("dashboard.teacher.unreadNotifications", {
                count: stats.unreadNotifications.value,
              })}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardGraph
          title={t("dashboard.teacher.sessionsTrend")}
          data={dashboardData?.graphData?.sessions || []}
          showComparison={false}
          primaryLabel={t("dashboard.teacher.sessionsCount")}
        />
        <DashboardGraph
          title={t("dashboard.teacher.evaluationsTrend")}
          data={dashboardData?.graphData?.evaluations || []}
          showComparison={false}
          primaryLabel={t("dashboard.teacher.evaluationsCount")}
        />
      </div>
    </div>
  );
};

export default TeacherDashboard;
