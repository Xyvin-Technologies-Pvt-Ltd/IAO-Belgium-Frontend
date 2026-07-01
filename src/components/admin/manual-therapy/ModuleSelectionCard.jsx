import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetModuleSelection } from "@/store/useApplication";
import ManageModuleSelectionDialog from "./ManageModuleSelectionDialog";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { Edit, BookOpen } from "lucide-react";

const ModuleSelectionCard = ({ applicationId }) => {
  const { t } = useTranslation();
  const { data: selectionRes, isLoading } = useGetModuleSelection(applicationId);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex justify-center py-6">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  const selection = selectionRes?.data;
  if (!selection) return null;

  const selectedModules = selection.modules.filter(m => m.selected);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg font-semibold text-dashboard-text dark:text-white">
            {t("admin.manualTherapy.card.title", "Module Selectie")}
          </CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-1"
        >
          <Edit className="h-4 w-4" />
          {t("admin.manualTherapy.card.editBtn", "Modules Bewerken")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-white/60 font-medium">
            {t("admin.manualTherapy.card.modeLabel", "Inschrijvingsvorm:")}
          </span>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
            selection.enrollment_mode === "full"
              ? "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-300"
              : "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300"
          }`}>
            {selection.enrollment_mode === "full"
              ? t("admin.manualTherapy.mode.full", "Volledig Programma")
              : t("admin.manualTherapy.mode.partial", "Afzonderlijke Modules")}
          </span>
        </div>

        <div className="space-y-2">
          <span className="text-sm text-gray-500 dark:text-white/60 font-medium block">
            {t("admin.manualTherapy.card.modulesLabel", "Geselecteerde Modules:")}
          </span>
          {selectedModules.length === 0 ? (
            <p className="text-sm text-muted-foreground dark:text-white/40 italic">
              {t("admin.manualTherapy.card.noModules", "Geen modules geselecteerd")}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {selectedModules.map((module) => (
                <div
                  key={module.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 dark:bg-amber-950/30 dark:text-amber-300 px-2 py-0.5 rounded">
                      M{module.module_number}
                    </span>
                    <span className="text-sm font-medium text-gray-700 dark:text-white/80 truncate max-w-[200px]" title={module.name}>
                      {module.name}
                    </span>
                  </div>
                  {module.availability_status && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold ${
                      module.availability_status === "completed"
                        ? "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-300"
                        : module.availability_status === "in-progress"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300"
                        : "bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-white/80"
                    }`}>
                      {module.availability_status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <ManageModuleSelectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        applicationId={applicationId}
      />
    </Card>
  );
};

export default ModuleSelectionCard;
