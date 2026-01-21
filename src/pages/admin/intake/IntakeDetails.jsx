import BatchList from "@/components/admin/intake/batch/BatchList";
import DashboardCard from "@/components/admin/dashboard/DashboardCard";
import { ErrorMessage, LoadingState } from "@/components/common";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { useGetIntakeById } from "@/store/useIntakeStore";
import { useParams } from "@tanstack/react-router";
import { Calendar, CalendarCheck, Layers, MapPin, Users } from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import StudentList from "@/components/admin/intake/student/StudentList";

const IntakeDetails = () => {
  const { t } = useTranslation();
  const params = useParams({ strict: false });
  const id = params.id;
  const { updateBreadcrumbs } = useBreadcrumb();

  const { data: intake, isLoading, error, refetch } = useGetIntakeById(id);
  const getInitialTab = () => {
    const savedTab = localStorage.getItem(`intakeDetailsTab_${id}`);
    return savedTab || "Batches";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem(`intakeDetailsTab_${id}`, tab);
  };
  useEffect(() => {
    if (intake?.data) {
      updateBreadcrumbs([
        {
          label: "Admission administration",
          path: "/admin/admission-administration",
          navigable: false,
        },
        {
          label: "Intakes",
          path: "/admin/admission-administration/intakes",
          navigable: true,
        },
        {
          label: intake.data.name,
          path: `/admin/admission-administration/intakes/${id}`,
          navigable: false,
        },
      ]);
    }
    return () => {
      updateBreadcrumbs([]);
    };
  }, [intake?.data?.name, id]);

  if (isLoading) {
    return (
      <LoadingState text={t("intakeManagement.details.loading")} fullHeight />
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={error?.message || t("intakeManagement.details.loadFailed")}
          onRetry={refetch}
          variant="card"
        />
      </div>
    );
  }

  const intakeData = intake?.data;
  if (!intakeData) return null;

  return (
    <div className="space-y-6 mt-4">
      <div className="bg-transparent">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-dashboard-text dark:text-white">
                {intakeData.name}
              </h1>

              <span className="text-xs px-3 py-1 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                {t("intakeManagement.details.badges.intakeId")}:{" "}
                {intakeData.uid || intakeData._id}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 text-sm">
              {intakeData.city && intakeData.country && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-4 h-4" /> {intakeData.city},{" "}
                  {intakeData.country}
                </span>
              )}

              <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs">
                {t("intakeManagement.details.badges.registrationFee")}:{" "}
                {intakeData.currency} {intakeData.admission_fee || 0}
              </span>

              {intakeData.registration_deadline && (
                <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs">
                  {t("intakeManagement.details.badges.registrationDeadline")}:{" "}
                  {moment(intakeData.registration_deadline).format(
                    "DD/MM/YYYY",
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard
            title={t("intakeManagement.details.cards.totalEnrollments")}
            value={`${intakeData.total_student_count}/${intakeData.max_student_enrollment}`}
            subtitle="+180.1% from last month"
            icon={Users}
          />

          <DashboardCard
            title={t("intakeManagement.details.cards.totalBatches")}
            value={intakeData.total_batch_count}
            icon={Layers}
          />

          <DashboardCard
            title={t("intakeManagement.details.cards.startDate")}
            value={moment(intakeData.start_date).format("DD/MM/YYYY")}
            icon={Calendar}
          />

          <DashboardCard
            title={t("intakeManagement.details.cards.endDate")}
            value={moment(intakeData.end_date).format("DD/MM/YYYY")}
            icon={CalendarCheck}
          />
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 flex gap-6">
        {[
          { key: "Batches", label: t("intakeManagement.details.tabs.batches") },
          {
            key: "Enrollments",
            label: t("intakeManagement.details.tabs.enrollments"),
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === tab.key
                ? "border-[#ff8904] text-[#ff8904]"
                : "border-transparent text-gray-500 dark:text-white/70 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/30"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === "Batches" && (
        <div>
          <BatchList />
        </div>
      )}
      {activeTab === "Enrollments" && (
        <div>
          <StudentList />
        </div>
      )}
    </div>
  );
};

export default IntakeDetails;
