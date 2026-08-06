import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import {
  useGetBatchesByProgram,
  useMoveStudentToAnotherBatch,
} from "@/store/useIntakeStore";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import { AlertCircle } from "lucide-react";

const MoveStudentDialog = ({ open, onOpenChange, student }) => {
  const { t } = useTranslation();
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [batchSearch, setBatchSearch] = useState("");

  const { data, isLoading, error, refetch } = useGetBatchesByProgram(
    student?.program_id,
    { enabled: Boolean(open && student?.program_id) },
  );
  const moveStudentMutation = useMoveStudentToAnotherBatch();

  const intakeGroups = data?.data || [];

  const allBatches = useMemo(() => {
    return intakeGroups.flatMap((group) => {
      const intakeName = group.intake?.name || "";
      const academicName = group.intake?.academic?.name || "";
      return (group.batches || []).map((batch) => ({
        ...batch,
        intake_id: group.intake?._id,
        label: [batch.name, academicName || intakeName]
          .filter(Boolean)
          .join(" · "),
      }));
    });
  }, [intakeGroups]);

  const batchSelectItems = useMemo(() => {
    const q = String(batchSearch || "").trim().toLowerCase();
    let list = allBatches
      .filter(
        (b) =>
          !b.is_full_filled &&
          String(b._id) !== String(student?.batch_id),
      )
      .map((b) => ({
        _id: b._id,
        name: `${b.label} (${b.student_count ?? 0} ${t(
          "batchManagement.modal.moveStudent.studentsCount",
          "students",
        )})`,
      }));

    if (q) {
      list = list.filter((item) => item.name.toLowerCase().includes(q));
    }

    if (selectedBatchId) {
      const selected = list.find(
        (item) => String(item._id) === String(selectedBatchId),
      );
      const fromAll = allBatches.find(
        (b) => String(b._id) === String(selectedBatchId),
      );
      if (!selected && fromAll) {
        list = [{ _id: fromAll._id, name: fromAll.label }, ...list];
      }
    }

    return list;
  }, [allBatches, batchSearch, selectedBatchId, student?.batch_id, t]);

  useEffect(() => {
    if (open) {
      setSelectedBatchId("");
      setBatchSearch("");
    }
  }, [open, student]);

  const handleMove = async () => {
    if (!selectedBatchId || !student) return;

    try {
      await moveStudentMutation.mutateAsync({
        applicationId: student.application_id,
        targetBatchId: selectedBatchId,
      });

      onOpenChange(false);
      setSelectedBatchId("");
    } catch (err) {
      console.error("Failed to move student:", err);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedBatchId("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md min-w-0 overflow-hidden sm:max-w-md">
        <DialogHeader className="min-w-0">
          <DialogTitle className="font-semibold pr-6">
            {t("batchManagement.modal.moveStudent.title")}
          </DialogTitle>
          <DialogDescription>
            {t("batchManagement.modal.moveStudent.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-6 overflow-hidden">
          <div className="grid grid-cols-2 gap-4">
            <div className="min-w-0">
              <label className="text-sm font-medium text-muted-foreground dark:text-white/70">
                {t("batchManagement.modal.moveStudent.studentId")}
              </label>
              <p className="text-sm font-semibold text-dashboard-text dark:text-white break-words">
                {student?.uid}
              </p>
            </div>
            <div className="min-w-0">
              <label className="text-sm font-medium text-muted-foreground dark:text-white/70">
                {t("batchManagement.modal.moveStudent.studentName")}
              </label>
              <p className="text-sm font-semibold text-dashboard-text dark:text-white capitalize break-words">
                {student?.last_name} {student?.first_name}
              </p>
            </div>
          </div>
          <div className="min-w-0">
            <label className="text-sm font-medium text-muted-foreground dark:text-white/70">
              {t("batchManagement.modal.moveStudent.currentBatch")}
            </label>
            <p
              className="text-sm font-semibold text-dashboard-text dark:text-white break-words"
              title={student?.batch_name || undefined}
            >
              {student?.batch_name}
            </p>
          </div>

          <div className="min-w-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : error ? (
              <ErrorMessage
                message={
                  error?.message ||
                  t("batchManagement.modal.moveStudent.loadBatchesFailed")
                }
                onRetry={refetch}
                variant="inline"
              />
            ) : (
              <SearchableSelect
                className="min-w-0"
                label={t("batchManagement.modal.moveStudent.assignToBatch")}
                placeholder={t(
                  "batchManagement.modal.moveStudent.selectBatch",
                )}
                searchPlaceholder={t(
                  "batchManagement.modal.moveStudent.searchBatches",
                  "Search batches…",
                )}
                items={batchSelectItems}
                value={selectedBatchId}
                onChange={setSelectedBatchId}
                onSearch={setBatchSearch}
                required
              />
            )}
          </div>
          <div className="flex items-start gap-2 p-2 bg-[#FF8904]/10 rounded-md">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#A75800] mt-0.5" />
            <p className="text-xs text-[#A75800] min-w-0">
              {t("batchManagement.modal.moveStudent.warningMessage")}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-3 sm:justify-end">
          <Button variant="outline" onClick={handleClose}>
            {t("batchManagement.modal.moveStudent.cancel")}
          </Button>
          <Button
            onClick={handleMove}
            disabled={
              !selectedBatchId ||
              moveStudentMutation.isPending ||
              batchSelectItems.length === 0
            }
          >
            {moveStudentMutation.isPending
              ? t("batchManagement.modal.moveStudent.moving")
              : t("batchManagement.modal.moveStudent.move")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MoveStudentDialog;
