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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { useGetBatchesByProgram, useReEnrollStudent } from "@/store/useIntakeStore";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";
import { AlertCircle } from "lucide-react";

const ReEnrollStudentDialog = ({ 
  open, 
  onOpenChange, 
  student 
}) => {
  const { t } = useTranslation();
  const [selectedIntakeId, setSelectedIntakeId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [reason, setReason] = useState("");

  const { data, isLoading, error, refetch } = useGetBatchesByProgram(student?.program_id);
  const reEnrollMutation = useReEnrollStudent();

  const intakeGroups = data?.data || [];

  // Reset selection states when dialog opens/closes/student changes
  useEffect(() => {
    if (open) {
      setSelectedIntakeId("");
      setSelectedBatchId("");
      setReason("");
    }
  }, [open, student]);

  // Find the batches for the selected intake
  const selectedIntakeGroup = intakeGroups.find(
    (group) => group.intake._id === selectedIntakeId
  );
  const availableBatches = selectedIntakeGroup?.batches || [];

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-semibold text-dashboard-text dark:text-white">
            {t("batchManagement.modal.reEnrollStudent.title", "Re-enroll Student")}
          </DialogTitle>
          <DialogDescription>
            {t("batchManagement.modal.reEnrollStudent.description", "Move student to a new intake and reset their failed year")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Student details display */}
          <div className="grid grid-cols-2 gap-4 bg-muted/50 p-3 rounded-lg text-sm">
            <div>
              <span className="font-medium text-muted-foreground block">
                {t("batchManagement.modal.moveStudent.studentId", "Student ID")}
              </span>
              <span className="font-semibold text-dashboard-text dark:text-white">
                {student?.uid}
              </span>
            </div>
            <div>
              <span className="font-medium text-muted-foreground block">
                {t("batchManagement.modal.moveStudent.studentName", "Student Name")}
              </span>
              <span className="font-semibold text-dashboard-text dark:text-white capitalize">
                {student?.last_name} {student?.first_name}
              </span>
            </div>
            <div>
              <span className="font-medium text-muted-foreground block">
                {t("batchManagement.modal.moveStudent.currentBatch", "Current Batch")}
              </span>
              <span className="font-semibold text-dashboard-text dark:text-white">
                {student?.batch_name || t("common.dash", "-")}
              </span>
            </div>
            <div>
              <span className="font-medium text-muted-foreground block">
                {t("batchManagement.modal.reEnrollStudent.failedYear", "Failed Year")}
              </span>
              <span className="font-semibold text-destructive">
                {student?.current_year}
              </span>
            </div>
          </div>

          {/* Target Intake Selection */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground dark:text-white/70">
              {t("batchManagement.modal.reEnrollStudent.selectIntake", "Select Target Intake")}
            </label>
            {isLoading ? (
              <div className="flex items-center justify-center py-2">
                <LoadingSpinner size="sm" />
              </div>
            ) : error ? (
              <ErrorMessage
                message={error?.message || t("batchManagement.modal.moveStudent.loadBatchesFailed", "Failed to load intakes")}
                onRetry={refetch}
                variant="inline"
              />
            ) : (
              <Select value={selectedIntakeId} onValueChange={(val) => {
                setSelectedIntakeId(val);
                setSelectedBatchId("");
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={t("batchManagement.modal.reEnrollStudent.selectIntake", "Select Target Intake")} />
                </SelectTrigger>
                <SelectContent>
                  {intakeGroups.length > 0 ? (
                    intakeGroups.map((group) => (
                      <SelectItem key={group.intake._id} value={group.intake._id}>
                        <div className="flex flex-col text-left">
                          <span className="font-medium text-dashboard-text dark:text-white">
                            {group.intake.name}
                          </span>
                          {group.intake.academic?.name && (
                            <span className="text-xs text-muted-foreground">
                              {group.intake.academic.name}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-intakes" disabled>
                      {t("batchManagement.modal.reEnrollStudent.noIntakes", "No Intakes Available")}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Target Batch Selection */}
          {selectedIntakeId && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground dark:text-white/70">
                {t("batchManagement.modal.reEnrollStudent.selectBatch", "Select Target Batch")}
              </label>
              <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("batchManagement.modal.reEnrollStudent.selectBatch", "Select Target Batch")} />
                </SelectTrigger>
                <SelectContent>
                  {availableBatches.length > 0 ? (
                    availableBatches.map((batch) => {
                      const isFull = batch.is_full_filled;
                      const isSameBatch = batch._id === student?.batch_id;
                      return (
                        <SelectItem 
                          key={batch._id} 
                          value={batch._id}
                          disabled={isFull || isSameBatch}
                        >
                          <div className="flex flex-col text-left">
                            <span className="text-dashboard-text dark:text-white">
                              {batch.name} {isFull && `(${t("batchManagement.status.full", "Full")})`}
                              {isSameBatch && `(${t("batchManagement.status.current", "Current")})`}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {batch.student_count} {t("batchManagement.modal.moveStudent.studentsCount", "students")}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem value="no-batches" disabled>
                      {t("batchManagement.modal.reEnrollStudent.noBatches", "No Batches in this Intake")}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Reason Textarea */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground dark:text-white/70">
              {t("batchManagement.modal.reEnrollStudent.reason", "Reason (optional)")}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("batchManagement.modal.reEnrollStudent.reasonPlaceholder", "Enter reason for re-enrollment...")}
              className="w-full min-h-[70px] px-3 py-2 border rounded-md text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Warning Banner */}
          <div className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <strong>{t("batchManagement.modal.reEnrollStudent.warningTitle", "Payment Reset Warning")}:</strong>{" "}
              {t("batchManagement.modal.reEnrollStudent.warningMessage", "All module payments for the failed year will be canceled. The student must re-purchase all modules in order to attend and access them.")}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={reEnrollMutation.isPending}>
            {t("batchManagement.modal.reEnrollStudent.cancel", "Cancel")}
          </Button>
          <Button 
            onClick={handleReEnroll}
            disabled={!selectedBatchId || reEnrollMutation.isPending}
          >
            {reEnrollMutation.isPending 
              ? t("batchManagement.modal.reEnrollStudent.confirming", "Processing...") 
              : t("batchManagement.modal.reEnrollStudent.confirm", "Re-enroll Student")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReEnrollStudentDialog;
