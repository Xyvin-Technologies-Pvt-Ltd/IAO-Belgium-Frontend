import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import { useGetResitPlannings, useAssignResitStudents } from "@/store/useResitStore";
import { formatInstant } from "@/utils/dateUtils";
import { toast } from "sonner";

const AssignResitDialog = ({ open, onOpenChange, parentExamId, applicationIds, onAssigned }) => {
  const { t } = useTranslation();
  const [planningId, setPlanningId] = useState("");
  const { data, isLoading } = useGetResitPlannings(
    { parent_exam: parentExamId, page: 1, limit: 50 },
    { enabled: open && !!parentExamId },
  );
  const assign = useAssignResitStudents();

  const items = (data?.data || []).map((row) => ({
    _id: row._id,
    name: `${row.exam?.name || "Resit"} — ${
      row.exam_date ? formatInstant(row.exam_date, "DD-MM-YYYY") : ""
    } ${row.location || ""}`.trim(),
  }));

  const handleAssign = () => {
    if (!planningId) {
      toast.error(t("resultsManagement.resit.selectPlanning", "Select a resit planning"));
      return;
    }
    assign.mutate(
      { resit_planning_id: planningId, application_ids: applicationIds },
      {
        onSuccess: () => {
          setPlanningId("");
          onOpenChange(false);
          onAssigned?.();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("resultsManagement.resit.assignTitle", "Assign resit exam")}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {t("resultsManagement.resit.assignHint", {
            count: applicationIds.length,
            defaultValue: "Assign {{count}} selected student(s) to a planned resit.",
          })}
        </p>
        <SearchableSelect
          label={t("resultsManagement.resit.planning", "Resit planning")}
          placeholder={t("resultsManagement.resit.planningPlaceholder", "Select planning")}
          items={items}
          value={planningId}
          onChange={(value) => setPlanningId(value || "")}
          isLoading={isLoading}
          required
        />
        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button type="button" onClick={handleAssign} disabled={assign.isPending}>
            {assign.isPending
              ? t("common.saving", "Saving...")
              : t("resultsManagement.resit.assignBtn", "Assign resit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignResitDialog;
