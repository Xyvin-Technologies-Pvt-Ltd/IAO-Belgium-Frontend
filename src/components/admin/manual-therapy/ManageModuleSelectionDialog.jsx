import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";
import { useGetModuleSelection, useUpdateModuleSelection } from "@/store/useApplication";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";
import { Check, HelpCircle } from "lucide-react";

const ManageModuleSelectionDialog = ({ open, onOpenChange, applicationId }) => {
  const { t } = useTranslation();
  const { data: selectionRes, isLoading, error, refetch } = useGetModuleSelection(applicationId, { enabled: open });
  const updateSelectionMutation = useUpdateModuleSelection();

  const [enrollmentMode, setEnrollmentMode] = useState("full");
  const [selectedModuleIds, setSelectedModuleIds] = useState([]);
  const [originalModules, setOriginalModules] = useState([]);

  useEffect(() => {
    if (selectionRes?.data) {
      setEnrollmentMode(selectionRes.data.enrollment_mode);
      setSelectedModuleIds(selectionRes.data.selected_modules || []);
      setOriginalModules(selectionRes.data.modules || []);
    }
  }, [selectionRes]);

  const handleEnrollmentModeChange = (mode) => {
    if (mode === "full") {
      setEnrollmentMode("full");
      setSelectedModuleIds(originalModules.map(m => m.id));
    } else {
      const lockedIds = originalModules.filter(m => m.is_locked).map(m => m.id);
      setEnrollmentMode("partial");
      setSelectedModuleIds(lockedIds);
    }
  };

  const handleModuleToggle = (moduleId, isLocked) => {
    if (isLocked || enrollmentMode === "full") return;

    setSelectedModuleIds(prev => {
      if (prev.includes(moduleId)) {
        return prev.filter(id => id !== moduleId);
      } else {
        return [...prev, moduleId];
      }
    });
  };

  const handleSave = async () => {
    if (enrollmentMode === "partial" && selectedModuleIds.length === 0) {
      return;
    }

    try {
      await updateSelectionMutation.mutateAsync({
        id: applicationId,
        selectedModules: enrollmentMode === "full" ? originalModules.map(m => m.id) : selectedModuleIds
      });
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("admin.manualTherapy.manageSelection.title", "Module Selectie Beheren")}</DialogTitle>
          <DialogDescription>
            {t("admin.manualTherapy.manageSelection.desc", "Pas de module-inschrijvingen van de student aan. Reeds gestarte of voltooide modules kunnen niet worden gedeselecteerd.")}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <ErrorMessage message={error.message} onRetry={refetch} />
        ) : (
          <div className="space-y-6 py-4">
            {/* Mode Selectors */}
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => handleEnrollmentModeChange("full")}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                  enrollmentMode === "full"
                    ? "border-blue-600 bg-blue-50/20 dark:bg-blue-950/25"
                    : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-gray-300 dark:hover:border-white/20"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm text-gray-800 dark:text-white">
                    {t("admin.manualTherapy.mode.full", "Volledig Programma")}
                  </span>
                  <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                    enrollmentMode === "full" ? "bg-blue-600 border-blue-600" : "border-gray-300 dark:border-white/20"
                  }`}>
                    {enrollmentMode === "full" && <Check className="h-2.5 w-2.5 text-white" />}
                  </div>
                </div>
              </div>

              <div
                onClick={() => handleEnrollmentModeChange("partial")}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                  enrollmentMode === "partial"
                    ? "border-blue-600 bg-blue-50/20 dark:bg-blue-950/25"
                    : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-gray-300 dark:hover:border-white/20"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm text-gray-800 dark:text-white">
                    {t("admin.manualTherapy.mode.partial", "Afzonderlijke Modules")}
                  </span>
                  <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                    enrollmentMode === "partial" ? "bg-blue-600 border-blue-600" : "border-gray-300 dark:border-white/20"
                  }`}>
                    {enrollmentMode === "partial" && <Check className="h-2.5 w-2.5 text-white" />}
                  </div>
                </div>
              </div>
            </div>

            {/* Checkbox list */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-700 dark:text-white/90">
                {t("admin.manualTherapy.modulesList.label", "Opleidingsmodules:")}
              </h4>
              <div className="space-y-2">
                {originalModules.map((module) => {
                  const isSelected = selectedModuleIds.includes(module.id);
                  const isDisabled = enrollmentMode === "full" || module.is_locked;

                  return (
                    <div
                      key={module.id}
                      onClick={() => !isDisabled && handleModuleToggle(module.id, module.is_locked)}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        isDisabled
                          ? "bg-gray-50 dark:bg-white/5 cursor-not-allowed border-gray-200 dark:border-white/5"
                          : "cursor-pointer bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border-gray-200 dark:border-white/10"
                      } ${isSelected && !isDisabled ? "border-blue-300 dark:border-blue-700 bg-blue-50/10 dark:bg-blue-950/10" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isSelected}
                          disabled={isDisabled}
                          onCheckedChange={() => {}} // parent onClick handles
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-amber-800 bg-amber-100 dark:bg-amber-950/30 dark:text-amber-300 px-2.5 py-0.5 rounded-full">
                            Module {module.module_number}
                          </span>
                          <span className="text-sm font-medium text-gray-700 dark:text-white/80">
                            {module.name}
                          </span>
                        </div>
                      </div>

                      {module.availability_status && (
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full capitalize font-semibold ${
                            module.availability_status === "completed"
                              ? "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-300"
                              : module.availability_status === "in-progress"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300"
                              : "bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-white/80"
                          }`}>
                            {module.availability_status}
                          </span>
                          {module.is_locked && (
                            <HelpCircle className="h-4 w-4 text-gray-400" title={t("admin.manualTherapy.lockedHelp", "Deze module is al gestart of voltooid.")} />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel", "Annuleren")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateSelectionMutation.isPending || isLoading || (enrollmentMode === "partial" && selectedModuleIds.length === 0)}
          >
            {updateSelectionMutation.isPending ? t("common.saving", "Opslaan...") : t("common.save", "Opslaan")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageModuleSelectionDialog;
