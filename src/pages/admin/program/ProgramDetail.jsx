import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { LoadingState, ErrorMessage } from "@/components/common";
import { Layers, Clock, Tag } from "lucide-react";
import DashboardCard from "@/components/admin/dashboard/DashboardCard";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { useGetProgramById } from "@/store/useProgramStore";
import LearningModule from "@/components/admin/programs/LearningModule";
import AppModule from "@/components/admin/programs/AppModule";
import ExamModule from "@/components/admin/programs/ExamModule";
import { Button } from "@/components/ui/button";
import CreateComponent from "@/components/admin/programs/CreateComponent";
import ProgramConfigDrawer from "@/components/admin/programs/ProgramConfigDrawer";
import PreviousEducationOptionsDrawer from "@/components/admin/programs/PreviousEducationOptionsDrawer";
import image from "../../../assets/images/no-component.png";
import ResourceModule from "@/components/admin/programs/ResourceModule";
import ProgramAccountingCodes from "@/components/admin/programs/ProgramAccountingCodes";
import { PROGRAM_TYPE_I18N_KEYS } from "@/constants/programTypes";
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
  const [pendingTab, setPendingTab] = useState(null);

  const { data: program, isLoading, error, refetch } = useGetProgramById(id);

  const handleOpenCreate = (componentType = null) => {
    const type = typeof componentType === "string" ? componentType : null;
    setPreselectedType(type);
    setIsModalOpen(true);
  };

  const handleComponentCreated = (componentType) => {
    setIsModalOpen(false);

    if (!componentType) return;

    const storageKey = `programActiveTab_${id}`;
    if (program?.data?.types?.includes(componentType)) {
      setActiveTab(componentType);
      localStorage.setItem(storageKey, componentType);
    } else {
      setPendingTab(componentType);
    }
  };

  const tabLabels = {
    module: t("programDetail.tabs.learningModules"),
    app: t("programDetail.tabs.applications"),
    resource: t("programDetail.tabs.resources"),
    exam: t("programDetail.tabs.examComponents"),
  };

  const tabs =
    program?.data?.types?.length > 0
      ? program.data.types
          .map((type) => ({
            id: type,
            label: tabLabels[type],
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

  // Switch to newly created component tab once program types include it
  useEffect(() => {
    if (!pendingTab || !program?.data?.types?.includes(pendingTab)) return;

    setActiveTab(pendingTab);
    const storageKey = `programActiveTab_${id}`;
    localStorage.setItem(storageKey, pendingTab);
    setPendingTab(null);
  }, [pendingTab, program?.data?.types, id]);

  useEffect(() => {
    if (activeTab) {
      const storageKey = `programActiveTab_${id}`;
      localStorage.setItem(storageKey, activeTab);
    }
  }, [activeTab, id]);

  const renderActiveTab = () => {
    const moduleProps = {
      programId: id,
      onComponentCreated: handleComponentCreated,
      languageId: program?.data?.language?._id,
    };

    switch (activeTab) {
      case "module":
        return <LearningModule {...moduleProps} />;
      case "app":
        return <AppModule {...moduleProps} />;
      case "resource":
        return <ResourceModule {...moduleProps} />;
      case "exam":
        return <ExamModule {...moduleProps} />;
      default:
        return null;
    }
  };

  useEffect(() => {
    if (program?.data) {
      updateBreadcrumbs([
        {
          label: t("sidebar.admin.programAdministration"),
          path: "/admin/program",
          navigable: true,
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

  const programTypeLabel = programData.program_type
    ? t(
        PROGRAM_TYPE_I18N_KEYS[programData.program_type] || programData.program_type,
        programData.program_type,
      )
    : t("common.notAvailable");

  const locationLabel =
    [programData?.city?.name, programData?.city?.country?.name]
      .filter(Boolean)
      .join(", ") || t("common.notAvailable");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <PreviousEducationOptionsDrawer programId={id} />
          <ProgramConfigDrawer programId={id} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title={t("programDetail.cards.programName")}
          value={programData?.name}
          subtitle={`${programData?.language?.name || t("common.notAvailable")} • ${locationLabel}${programData?.is_online ? ` • ${t("common.online", "Online")}` : ""}`}
          icon={Layers}
        />

        <DashboardCard
          title={t("programDetail.cards.programType")}
          value={programTypeLabel}
          icon={Tag}
        />

        <DashboardCard
          title={t("programDetail.cards.duration")}
          value={`${programData.year} ${
            programData.year === 1
              ? t(`common.durationUnits.${(programData.duration_unit || "years").slice(0, -1)}`, (programData.duration_unit || "years").slice(0, -1))
              : t(`common.durationUnits.${programData.duration_unit || "years"}`, programData.duration_unit || "Years")
          }`}
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

      <ProgramAccountingCodes program={programData} />

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

          <div className="mt-6">{renderActiveTab()}</div>
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
          <Button className="mt-4" onClick={() => handleOpenCreate()}>
            {t("programDetail.emptyState.createButton")}
          </Button>
        </div>
      )}
      <CreateComponent
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onComponentCreated={handleComponentCreated}
        programId={id}
        programLanguageId={programData?.language?._id}
        preselectedType={preselectedType}
      />
    </div>
  );
};

export default ProgramDetail;
