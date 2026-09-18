import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import { Button } from "@/components/ui/button";
import { X, Plus, Trash2, Users, Info } from "lucide-react";
import { useUpdatePlanning } from "@/store/usePlanningStore";
import {
  useGetBatches,
  useGetComponents,
  useGetAllPrograms,
} from "@/store/useDropdownStore";

const SharePlanningModal = ({ open, onClose, planningData }) => {
  const { t } = useTranslation();
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedComponent, setSelectedComponent] = useState("");

  const [programSearch, setProgramSearch] = useState("");
  const [batchSearch, setBatchSearch] = useState("");
  const [componentSearch, setComponentSearch] = useState("");

  const [sharedWithList, setSharedWithList] = useState([]);

  const updatePlanning = useUpdatePlanning();

  useEffect(() => {
    if (planningData && open) {
      const existingShared = (planningData.shared_with || []).map((sw) => ({
        batch: sw.batch?._id || sw.batch || "",
        batch_name: sw.batch?.name || t("common.notAvailable", "N/A"),
        component: sw.component?._id || sw.component || "",
        component_name: sw.component?.name || t("common.notAvailable", "N/A"),
        program_name: sw.component?.program?.name || "",
      }));
      setSharedWithList(existingShared);
    } else {
      setSharedWithList([]);
      setSelectedProgram("");
      setSelectedBatch("");
      setSelectedComponent("");
    }
  }, [planningData, open, t]);

  const { data: programsData, isLoading: programsLoading } = useGetAllPrograms(
    {
      is_online: false,
      ...(programSearch && { search: programSearch }),
    },
    { enabled: open },
  );

  const programsRaw = open ? programsData?.data || [] : [];
  const programs = programsRaw.map((p) => ({
    _id: p._id,
    name: `${p.name} - ${p.city?.name || "N/A"} (${p.language?.name || "N/A"})`,
  }));

  const { data: batchesData, isLoading: batchesLoading } = useGetBatches(
    selectedProgram,
    {
      ...(batchSearch && { search: batchSearch }),
      include_closed: true,
    },
    { enabled: open && !!selectedProgram },
  );

  const targetComponentType = planningData?.component?.type || "module";

  const { data: componentsData, isFetching: componentsFetching } =
    useGetComponents(
      {
        ...(componentSearch && { search: componentSearch }),
        program: selectedProgram,
        type: targetComponentType,
        status: true,
      },
      { enabled: open && !!selectedProgram },
    );

  const primarySystemId = planningData?.component?.system_id;
  const primaryComponentName = planningData?.component?.name;

  const batches = open && selectedProgram ? batchesData?.data || [] : [];
  const rawComponents = open && selectedProgram ? componentsData?.data || [] : [];

  const components = rawComponents
    .filter((c) => {
      if (primarySystemId && c.system_id) {
        return c.system_id === primarySystemId;
      }
      if (primaryComponentName && c.name) {
        return c.name.trim().toLowerCase() === primaryComponentName.trim().toLowerCase();
      }
      return true;
    })
    .map((comp) => {
      const linkedExams = (comp.linked_exams || []).filter((e) => e.name);
      if (linkedExams.length > 0) {
        const examNames = linkedExams.map((e) => e.name).join(", ");
        return {
          ...comp,
          name: `${comp.name} (Exam: ${examNames})`,
        };
      }
      return comp;
    });

  const handleAddLink = () => {
    if (!selectedBatch || !selectedComponent) return;

    const foundBatch = batches.find((b) => b._id === selectedBatch);
    const foundComp = components.find((c) => c._id === selectedComponent);
    const foundProg = programsRaw.find((p) => p._id === selectedProgram);

    // Prevent duplicates
    if (sharedWithList.some((sw) => sw.batch === selectedBatch)) {
      return;
    }

    setSharedWithList((prev) => [
      ...prev,
      {
        batch: selectedBatch,
        batch_name: foundBatch?.name || "Batch",
        component: selectedComponent,
        component_name: foundComp?.name || "Module",
        program_name: foundProg?.name || "",
      },
    ]);

    setSelectedProgram("");
    setSelectedBatch("");
    setSelectedComponent("");
  };

  const handleRemoveLink = (index) => {
    setSharedWithList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!planningData?._id) return;

    const payloadSharedWith = sharedWithList.map((sw) => ({
      batch: sw.batch,
      component: sw.component,
    }));

    updatePlanning.mutate(
      {
        id: planningData._id,
        data: {
          shared_with: payloadSharedWith,
        },
      },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-full max-w-lg flex flex-col">
        {/* Header */}
        <div className="p-5 border-b dark:border-white/20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {t("planningManagement.shareModal.title", "Share Planning with Cohort")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-gray-700 dark:hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
          <p className="text-xs text-gray-500 dark:text-white/70">
            {t(
              "planningManagement.shareModal.description",
              "Link this planning session with additional cohorts (e.g., Lateral Entry Year 1) so their students share the exact same dates, venue, and teachers.",
            )}
          </p>

          {/* Current Primary Planning Info */}
          <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg border dark:border-white/10 text-xs space-y-1">
            <div className="font-semibold text-gray-700 dark:text-gray-300">
              {t("planningManagement.shareModal.primaryPlanning", "Primary Planning:")}
            </div>
            <div className="text-gray-900 dark:text-white font-medium">
              {planningData?.component?.name || "N/A"} — {planningData?.batch?.name || "N/A"}
            </div>
          </div>

          {primarySystemId && (
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800/60 text-xs flex items-center gap-2">
              <Info className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <span>
                {t("planningManagement.shareModal.matchingSystemIdNotice", {
                  defaultValue: "Filtering target components matching System ID: {{systemId}}",
                  systemId: primarySystemId,
                })}
              </span>
            </div>
          )}

          {/* Form to Add New Cohort Link */}
          <div className="border p-4 rounded-lg dark:border-white/10 space-y-3 bg-gray-50/50 dark:bg-white/[0.02]">
            <h3 className="text-xs font-semibold text-gray-800 dark:text-gray-200">
              {t("planningManagement.shareModal.addCohortLink", "Add Additional Batch / Component")}
            </h3>

            <SearchableSelect
              label={t("planningManagement.modal.programLabel", "Target Program")}
              placeholder={t("planningManagement.modal.searchPrograms", "Select Program...")}
              items={programs}
              value={selectedProgram}
              onChange={(val) => {
                setSelectedProgram(val || "");
                setSelectedBatch("");
                setSelectedComponent("");
              }}
              onSearch={setProgramSearch}
              isLoading={programsLoading}
            />

            <SearchableSelect
              label={t("planningManagement.modal.batchLabel", "Target Batch")}
              placeholder={t("planningManagement.modal.batchPlaceholder", "Select Batch...")}
              items={batches}
              value={selectedBatch}
              onChange={(val) => setSelectedBatch(val || "")}
              onSearch={setBatchSearch}
              isLoading={batchesLoading}
              disabled={!selectedProgram}
            />

            <SearchableSelect
              label={t("planningManagement.modal.moduleLabel", "Target Component")}
              placeholder={t("planningManagement.modal.modulePlaceholder", "Select Component...")}
              items={components}
              value={selectedComponent}
              onChange={(val) => setSelectedComponent(val || "")}
              onSearch={setComponentSearch}
              isLoading={componentsFetching}
              disabled={!selectedProgram}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddLink}
              disabled={!selectedBatch || !selectedComponent}
              className="w-full flex items-center justify-center gap-2 mt-2"
            >
              <Plus className="h-4 w-4" />
              {t("planningManagement.shareModal.addLinkBtn", "Attach Cohort to Planning")}
            </Button>
          </div>

          {/* Attached Shared List */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {t("planningManagement.shareModal.currentlySharedWith", "Currently Shared Batches:")} ({sharedWithList.length})
            </h3>

            {sharedWithList.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                {t("planningManagement.shareModal.noSharedBatches", "No additional batches linked yet.")}
              </p>
            ) : (
              <div className="space-y-2">
                {sharedWithList.map((sw, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-white dark:bg-white/5 border dark:border-white/10 rounded-lg text-xs"
                  >
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {sw.batch_name}
                      </div>
                      <div className="text-gray-500 dark:text-white/60">
                        {sw.component_name} {sw.program_name ? `(${sw.program_name})` : ""}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(idx)}
                      className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t dark:border-white/20 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={updatePlanning.isPending}
            className="bg-primary text-white"
          >
            {updatePlanning.isPending
              ? t("common.saving", "Saving...")
              : t("common.saveChanges", "Save Shared Planning")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SharePlanningModal;
