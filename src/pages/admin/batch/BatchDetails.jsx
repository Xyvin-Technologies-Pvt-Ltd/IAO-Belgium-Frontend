import BatchAttendence from "@/components/admin/batch/BatchAttendence";
import BatchDetailCard from "@/components/admin/batch/BatchDetailCard";
import BatchResult from "@/components/admin/batch/BatchResult";
import BatchStudentList from "@/components/admin/batch/BatchStudentList";
import DashboardCard from "@/components/admin/dashboard/DashboardCard";
import { ErrorMessage, LoadingState } from "@/components/common";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { useGetBatchesById } from "@/store/useBatchStore";
import { useParams } from "@tanstack/react-router";
import { CalendarCheck, BookOpen, Users, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const BatchDetails = () => {
  const { t } = useTranslation();
  const params = useParams({ strict: false });
  const id = params.id;
  const { updateBreadcrumbs } = useBreadcrumb();

  const { data: batch, isLoading, error, refetch } = useGetBatchesById(id);
  const getInitialTab = () => {
    const savedTab = localStorage.getItem(`batchDetailsTab_${id}`);
    return savedTab || "Overview";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem(`batchDetailsTab_${id}`, tab);
  };
  useEffect(() => {
    if (batch?.data) {
      updateBreadcrumbs([
        {
          label: "Admission administration",
          path: "/admin/admission-administration",
          navigable: false,
        },
        {
          label: "Academics",
          path: "/admin/admission-administration/academics",
          navigable: true,
        },
        {
          label: "Intakes",
          path: `/admin/admission-administration/academics/${batch.data.academic}`,
          navigable: true,
        },
        {
          label: "Intakes Details",
          path: `/admin/admission-administration/academics/intakes/${batch.data.intake_id}`,
          navigable: true,
        },
        {
          label: "Batch Details",
          path: `/admin/admission-administration/academics/intakes/batch/${batch.data._id}`,
          navigable: false,
        },
      ]);
    }
    return () => {
      updateBreadcrumbs([]);
    };
  }, [batch?.data?._id]);

  if (isLoading) {
    return (
      <LoadingState text={t("batchManagement.details.loading")} fullHeight />
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={error?.message || t("batchManagement.details.loadFailed")}
          onRetry={refetch}
          variant="card"
        />
      </div>
    );
  }

  const batchData = batch?.data;
  if (!batchData) return null;

  return (
    <div className="space-y-6 mt-4">
      <div className="bg-transparent">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-dashboard-text dark:text-white">
                {batchData.name}
              </h1>

              <span className="text-xs px-3 py-1 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                {t("batchManagement.details.badges.batchId")}:{" "}
                {batchData.uid || batchData._id}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 text-sm">
              <span className="text-xs px-3 py-1 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                {t("batchManagement.details.badges.program")}:{" "}
                {batchData.program_name}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard
            title={t("batchManagement.details.cards.enrolledStudents")}
            value={`${batchData.student_count}/${batchData.student_per_batch}`}
            icon={Users}
          />

          <DashboardCard
            title={t("batchManagement.details.cards.totalSessions")}
            value={batchData?.total_batch_count || 0}
            icon={BookOpen}
          />

          <DashboardCard
            title={t("batchManagement.details.cards.completed")}
            value={batchData?.completed || 0}
            icon={CalendarCheck}
          />

          <DashboardCard
            title={t("batchManagement.details.cards.avgAttendance")}
            value={`${batchData?.average_attendance || 0}%`}
            icon={BarChart3}
          />
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 flex gap-6">
        {[
          {
            key: "Overview",
            label: t("batchManagement.details.tabs.overview"),
          },
          {
            key: "Students",
            label: t("batchManagement.details.tabs.students"),
          },
          {
            key: "Attendence",
            label: t("batchManagement.details.tabs.attendence"),
          },
          {
            key:"Results",
            label: t("batchManagement.details.tabs.results"),
          }
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
      <div>
        {activeTab === "Overview" && <BatchDetailCard batch={batchData} />}
        {activeTab === "Students" && <BatchStudentList />}
        {activeTab==="Attendence" && <BatchAttendence />}
        {activeTab==="Results" && <BatchResult />}
      </div>
    </div>
  );
};

export default BatchDetails;
