import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { LoadingState, ErrorMessage } from "@/components/common";
import { DollarSign, Layers, Clock } from "lucide-react";
import DashboardCard from "@/components/admin/dashboard/DashboardCard";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { useGetProgramById } from "@/store/useProgramStore";
import LearningModule from "@/components/admin/programs/LearningModule";
import AppModule from "@/components/admin/programs/AppModule";
import { Button } from "@/components/ui/button";
import CreateComponent from "@/components/admin/programs/CreateComponent";
import image from "../../../assets/images/no-component.png";
import ResourceModule from "@/components/admin/programs/ResourceModule";
import { useTranslation } from "react-i18next";
const ProgramDetail = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preselectedType, setPreselectedType] = useState(null);
  const params = useParams({ strict: false });
  const id = params.id;
  const { updateBreadcrumbs } = useBreadcrumb();
  const [activeTab, setActiveTab] = useState(() => {
    const storageKey = `programActiveTab_${id}`;
    return localStorage.getItem(storageKey) || "";
  });

  const { data: program, isLoading, error, refetch } = useGetProgramById(id);

  const handleOpenCreate = (componentType = null) => {
    setPreselectedType(componentType);
    setIsModalOpen(true);
  };

  const handleComponentCreated = (componentType) => {
    // Switch to the tab corresponding to the created component type
    if (componentType && tabs.some((tab) => tab.id === componentType)) {
      setActiveTab(componentType);
      const storageKey = `programActiveTab_${id}`;
      localStorage.setItem(storageKey, componentType);
    }
    setIsModalOpen(false);
  };
  // Component mapping for different types
  const componentMap = {
    module: {
      label: t("programDetail.tabs.learningModules"),
      component: () => <LearningModule programId={id} onComponentCreated={handleComponentCreated} />,
    },
    app: {
      label: t("programDetail.tabs.applications"),
      component: () => <AppModule programId={id} onComponentCreated={handleComponentCreated} />,
    },
    resource: {
      label: t("programDetail.tabs.resources"),
      component: () => <ResourceModule programId={id} onComponentCreated={handleComponentCreated} />,
    },
  };

  const tabs =
    program?.data?.types?.length > 0
      ? program.data.types
          .map((type) => ({
            id: type,
            ...componentMap[type],
          }))
          .filter((tab) => tab.label) 
      : [];

  // Set default active tab when tabs are available
  useEffect(() => {
    if (tabs.length > 0 && !activeTab) {
      const defaultTab = tabs[0].id;
      setActiveTab(defaultTab);
      const storageKey = `programActiveTab_${id}`;
      localStorage.setItem(storageKey, defaultTab);
    }
  }, [tabs.length, activeTab, id]);

  useEffect(() => {
    if (activeTab) {
      const storageKey = `programActiveTab_${id}`;
      localStorage.setItem(storageKey, activeTab);
    }
  }, [activeTab, id]);

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  useEffect(() => {
    if (program?.data) {
      updateBreadcrumbs([
        {
          label: t("sidebar.admin.programAdministration"),
          path: "/admin/program",
          navigable: false,
        },
        {
          label: t("programDetail.title"),
          path: `/admin/program/${id}`,
          navigable: false,
        },
      ]);
    }
    return () => {
      updateBreadcrumbs([]);
    };
  }, [program?.data?.name, id, t]);

  if (isLoading) {
    return <LoadingState text={t("programDetail.loading")} fullHeight />;
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={error?.message || t("programDetail.loadFailed")}
          onRetry={refetch}
          variant="card"
        />
      </div>
    );
  }

  const programData = program?.data;
  if (!programData) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title={t("programDetail.cards.programName")}
          value={programData?.name}
          subtitle={`${programData?.language?.name || 'N/A'} • ${programData?.city?.name || 'N/A'}`}
          icon={Layers}
        />

        <DashboardCard
          title={t("programDetail.cards.duration")}
          value={`${programData.year} ${t("programDetail.cards.years")}`}
          icon={Clock}
        />

        <DashboardCard
          title={t("programDetail.cards.noOfModules")}
          value={programData?.components_count || 0}
          icon={Layers}
        />
        {/* 
        <DashboardCard
          title={t("programDetail.cards.registrationFee")}
          value={
            programData.isRegistrationFee
              ? `${programData.city?.country?.currency || "$"}${programData.registrationFee}`
              : t("programDetail.cards.free")
          }
          icon={DollarSign}
        /> */}
      </div>

      {tabs.length > 0 && (
        <>
          <div className="border-b border-gray-200 dark:border-white/20">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-[#ff8904] text-[#ff8904]"
                      : "border-transparent text-gray-500 dark:text-white/70 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/30"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-6">{ActiveComponent && <ActiveComponent />}</div>
        </>
      )}

      {tabs.length === 0 && (
        <div className="flex flex-col items-center justify-center h-[80vh] text-center bg-sidebar rounded-xl p-5 border border-sidebar-border">
          <img
            src={image}
            alt="No academics"
            className="w-64 mb-4 opacity-80"
          />
          <h3 className="text-lg font-semibold text-sidebar-foreground">
            {t("programDetail.emptyState.title")}
          </h3>
          <p className="text-sm text-sidebar-foreground/70 max-w-md mt-1">
            {t("programDetail.emptyState.subtitle")}
          </p>
          <Button className="mt-4" onClick={handleOpenCreate}>
            {t("programDetail.emptyState.createButton")}
          </Button>
        </div>
      )}
      <CreateComponent
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onComponentCreated={handleComponentCreated}
        programId={id}
        preselectedType={preselectedType}
      />
    </div>
  );
};

export default ProgramDetail;
