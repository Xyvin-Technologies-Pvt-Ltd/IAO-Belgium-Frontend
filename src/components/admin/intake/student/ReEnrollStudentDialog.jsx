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
  useReEnrollStudent,
} from "@/store/useIntakeStore";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import { AlertCircle } from "lucide-react";

const ReEnrollStudentDialog = ({ open, onOpenChange, student }) => {
  const { t } = useTranslation();
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [batchSearch, setBatchSearch] = useState("");
  const [reason, setReason] = useState("");

  const { data, isLoading, error, refetch } = useGetBatchesByProgram(
    student?.program_id
      ? String(student.program_id?._id || student.program_id)
      : "",
    {
      enabled: Boolean(
        open &&
          (student?.program_id?._id || student?.program_id),
      ),
    },
  );
  const reEnrollMutation = useReEnrollStudent();

  const intakeGroups = data?.data || [];

  const allBatches = useMemo(() => {
    return intakeGroups.flatMap((group) => {
      const intakeName = group.intake?.name || "";
      const academicName = group.intake?.academic?.name || "";
      return (group.batches || []).map((batch) => ({
        ...batch,
        intake_id: group.intake?._id,
        intake_name: intakeName,
        academic_name: academicName,
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
        list = [
          {
            _id: fromAll._id,
            name: fromAll.label,
          },
          ...list,
        ];
      }
    }

    return list;
  }, [allBatches, batchSearch, selectedBatchId, student?.batch_id, t]);

  useEffect(() => {
    if (open) {
      setSelectedBatchId("");
      setBatchSearch("");
      setReason("");
    }
  }, [open, student]);

  const handleReEnroll = async () => {
    if (!selectedBatchId || !student) return;

    try {
      await reEnrollMutation.mutateAsync({
        applicationId: student.application_id,
        targetBatchId: selectedBatchId,
        failedYear: student.current_year,
        reason,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Failed to re-enroll student:", error);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md min-w-0 overflow-hidden sm:max-w-md">
        <DialogHeader className="min-w-0">
          <DialogTitle className="font-semibold text-dashboard-text dark:text-white pr-6">
            {t(
              "batchManagement.modal.reEnrollStudent.title",
              "Re-enroll Student",
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              "batchManagement.modal.reEnrollStudent.description",
              "Move student to a new batch and reset their failed year",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-4 my-2 overflow-hidden">
          <div className="grid grid-cols-2 gap-4 bg-muted/50 p-3 rounded-lg text-sm">
            <div className="min-w-0">
              <span className="font-medium text-muted-foreground block">
                {t("batchManagement.modal.moveStudent.studentId", "Student ID")}
              </span>
              <span className="font-semibold text-dashboard-text dark:text-white break-words">
                {student?.uid}
              </span>
            </div>
            <div className="min-w-0">
              <span className="font-medium text-muted-foreground block">
                {t(
                  "batchManagement.modal.moveStudent.studentName",
                  "Student Name",
                )}
              </span>
              <span className="font-semibold text-dashboard-text dark:text-white capitalize break-words">
                {student?.last_name} {student?.first_name}
              </span>
            </div>
            <div className="min-w-0 col-span-2">
              <span className="font-medium text-muted-foreground block">
                {t(
                  "batchManagement.modal.moveStudent.currentBatch",
                  "Current Batch",
                )}
              </span>
              <span
                className="font-semibold text-dashboard-text dark:text-white break-words"
                title={student?.batch_name || undefined}
              >
                {student?.batch_name || t("common.dash", "-")}
              </span>
            </div>
            <div className="min-w-0">
              <span className="font-medium text-muted-foreground block">
                {t(
                  "batchManagement.modal.reEnrollStudent.failedYear",
                  "Failed Year",
                )}
              </span>
              <span className="font-semibold text-destructive">
                {student?.current_year}
              </span>
            </div>
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
                  t(
                    "batchManagement.modal.moveStudent.loadBatchesFailed",
                    "Failed to load batches",
                  )
                }
                onRetry={refetch}
                variant="inline"
              />
            ) : (
              <SearchableSelect
                className="min-w-0"
                label={t(
                  "batchManagement.modal.reEnrollStudent.selectBatch",
                  "Select Target Batch",
                )}
                placeholder={t(
                  "batchManagement.modal.reEnrollStudent.selectBatch",
                  "Select Target Batch",
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

          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground dark:text-white/70">
              {t(
                "batchManagement.modal.reEnrollStudent.reason",
                "Reason (optional)",
              )}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t(
                "batchManagement.modal.reEnrollStudent.reasonPlaceholder",
                "Enter reason for re-enrollment...",
              )}
              className="w-full min-h-[70px] px-3 py-2 border rounded-md text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <strong>
                {t(
                  "batchManagement.modal.reEnrollStudent.warningTitle",
                  "Payment Reset Warning",
                )}
                :
              </strong>{" "}
              {t(
                "batchManagement.modal.reEnrollStudent.warningMessage",
                "All module payments for the failed year will be canceled. The student must re-purchase all modules in order to attend and access them.",
              )}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={reEnrollMutation.isPending}
          >
            {t("batchManagement.modal.reEnrollStudent.cancel", "Cancel")}
          </Button>
          <Button
            onClick={handleReEnroll}
            disabled={!selectedBatchId || reEnrollMutation.isPending}
          >
            {reEnrollMutation.isPending
              ? t(
                  "batchManagement.modal.reEnrollStudent.confirming",
                  "Processing...",
                )
              : t(
                  "batchManagement.modal.reEnrollStudent.confirm",
                  "Re-enroll Student",
                )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReEnrollStudentDialog;
