import { useState, useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import { LoadingState, ErrorMessage } from "@/components/common";
import { Users, DollarSign, Layers, Clock } from "lucide-react";
import DashboardCard from "@/components/admin/dashboard/DashboardCard";
import LearningModule from "@/components/admin/programs/LearningModule";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { useGetPrograms } from "@/store/useProgramStore";

const ProgramDetail = () => {
  const params = useParams({ strict: false });
  const id = params.id;
  const { updateBreadcrumbs } = useBreadcrumb();

  const { data: program, isLoading, error, refetch } = useGetPrograms(id);
  const [activeTab, setActiveTab] = useState("Learning Modules");
  useEffect(() => {
    if (program?.data) {
      updateBreadcrumbs([
        { label: "Program Administration", path: "/admin/program-administration", navigable: false },
        { label: "Program", path: "/admin/program", navigable: true },
        { label: program.data.name, path: `/admin/program/${id}`, navigable: false }
      ]);
    }
    return () => {
      updateBreadcrumbs([]);
    };
  }, [program?.data?.name, id]);

  if (isLoading) {
    return <LoadingState text="Loading program details..." fullHeight />;
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={error?.message || "Failed to load program details"}
          onRetry={refetch}
          variant="card"
        />
      </div>
    );
  }

  const programData = program?.data;
  if (!programData) return null;

  const { inclusions = [], modules = [] } = programData;

  return (
    <div className="space-y-6">
      {/* ===== Dashboard Cards ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Program Type"
          value={programData.type}
          icon={Layers}
        />

        <DashboardCard
          title="Duration"
          value={programData.duration}
          icon={Clock}
        />

        <DashboardCard
          title="No of Modules"
          value={programData.moduleCount || modules.length}
          icon={Layers}
        />

        <DashboardCard
          title="Registration Fee"
          value={
            programData.isRegistrationFee
              ? `$${programData.registrationFee}`
              : "Free"
          }
          icon={DollarSign}
        />
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 flex gap-6">
        {inclusions.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium transition ${
              activeTab === tab
                ? "border-b-2 border-gray-900 text-gray-900 dark:border-white dark:text-white"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="pt-4">
        {activeTab === "Learning Modules" && (
          <LearningModule 
            modules={modules}
            isLoading={false}
            error={null}
            onRefetch={refetch}
          />
        )}

        {activeTab === "Exams" && (
          <p className="text-sm text-gray-500">
            Exams configuration will appear here.
          </p>
        )}

        {activeTab === "APP" && (
          <p className="text-sm text-gray-500">
            App-related content will appear here.
          </p>
        )}

        {activeTab === "Research" && (
          <p className="text-sm text-gray-500">
            Research modules and details will appear here.
          </p>
        )}
      </div>
    </div>
  );
};

export default ProgramDetail;
