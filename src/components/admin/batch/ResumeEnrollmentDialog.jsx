import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import { useGetBatchesByProgram } from "@/store/useIntakeStore";
import { useResumeEnrollment } from "@/store/useBatchStore";

const ResumeEnrollmentDialog = ({ open, onOpenChange, student, batchId }) => {
  const { t } = useTranslation();
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [batchSearch, setBatchSearch] = useState("");
  const [reason, setReason] = useState("");

  const programId = student?.program_id
    ? String(student.program_id?._id || student.program_id)
    : "";
  const { data, isLoading, error, refetch } = useGetBatchesByProgram(programId, {
    enabled: Boolean(open && programId),
  });
  const resumeMutation = useResumeEnrollment();

  const intakeGroups = data?.data || [];
  const allBatches = useMemo(() => {
    return intakeGroups.flatMap((group) => {
      const intakeName = group.intake?.name || "";
      const academicName = group.intake?.academic?.name || "";
      return (group.batches || []).map((batch) => ({
        ...batch,
        label: [batch.name, academicName || intakeName].filter(Boolean).join(" · "),
      }));
    });
  }, [intakeGroups]);

  const batchSelectItems = useMemo(() => {
    const q = String(batchSearch || "").trim().toLowerCase();
    let list = allBatches
      .filter((b) => !b.is_full_filled)
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
    return list;
  }, [allBatches, batchSearch, t]);

  useEffect(() => {
    if (open) {
      setSelectedBatchId("");
      setBatchSearch("");
      setReason("");
    }
  }, [open, student]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleResume = async () => {
    if (!selectedBatchId || !student) return;
    try {
      await resumeMutation.mutateAsync({
        applicationId: student.application_id || student._id,
        targetBatchId: selectedBatchId,
        reason,
        batchId,
      });
      handleClose();
    } catch {
      // toast handled in mutation
    }
  };

  const studentName = [student?.last_name, student?.first_name]
    .filter(Boolean)
    .join(" ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md min-w-0 overflow-hidden sm:max-w-md">
        <DialogHeader className="min-w-0">
          <DialogTitle className="font-semibold text-dashboard-text dark:text-white pr-6">
            {t("enrollmentHold.resumeTitle", "Resume enrollment")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "enrollmentHold.resumeDescription",
              "Assign this student to a batch in the same program and reactivate their account.",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-4 my-2 overflow-hidden">
          {(student?.uid || studentName) && (
            <div className="grid grid-cols-2 gap-4 bg-muted/50 p-3 rounded-lg text-sm">
              {student?.uid && (
                <div className="min-w-0">
                  <span className="font-medium text-muted-foreground block">
                    {t("batchManagement.modal.moveStudent.studentId", "Student ID")}
                  </span>
                  <span className="font-semibold text-dashboard-text dark:text-white break-words">
                    {student.uid}
                  </span>
                </div>
              )}
              {studentName && (
                <div className="min-w-0">
                  <span className="font-medium text-muted-foreground block">
                    {t(
                      "batchManagement.modal.moveStudent.studentName",
                      "Student Name",
                    )}
                  </span>
                  <span className="font-semibold text-dashboard-text dark:text-white capitalize break-words">
                    {studentName}
                  </span>
                </div>
              )}
            </div>
          )}

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
                label={t("enrollmentHold.targetBatch", "Target batch")}
                placeholder={t(
                  "batchManagement.modal.moveStudent.selectBatch",
                  "Select a batch",
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

          <div className="min-w-0 space-y-1">
            <label
              className="text-sm font-medium text-muted-foreground dark:text-white/70"
              htmlFor="resume-reason"
            >
              {t("enrollmentHold.reasonOptional", "Reason (optional)")}
            </label>
            <textarea
              id="resume-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t(
                "enrollmentHold.reasonPlaceholder",
                "Enter reason...",
              )}
              className="w-full min-h-[70px] max-w-full px-3 py-2 border rounded-md text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={resumeMutation.isPending}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            onClick={handleResume}
            disabled={!selectedBatchId || resumeMutation.isPending || isLoading}
          >
            {resumeMutation.isPending
              ? t("common.saving", "Saving...")
              : t("enrollmentHold.confirmResume", "Resume")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResumeEnrollmentDialog;
