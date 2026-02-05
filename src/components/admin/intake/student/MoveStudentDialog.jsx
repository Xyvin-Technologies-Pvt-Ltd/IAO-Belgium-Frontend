import { useState } from "react";
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
import { useGetBatchesByIntake, useMoveStudentToAnotherBatch } from "@/store/useIntakeStore";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";
import { AlertCircle } from "lucide-react";

const MoveStudentDialog = ({ 
  open, 
  onOpenChange, 
  student, 
  intakeId
}) => {
  const { t } = useTranslation();
  const [selectedBatchId, setSelectedBatchId] = useState("");

  const { data, isLoading, error, refetch } = useGetBatchesByIntake(intakeId);
  const moveStudentMutation = useMoveStudentToAnotherBatch();

  const batches = data?.data || [];
  
  // Filter out the current batch and unavailable batches
  const availableBatches = batches.filter(
    (batch) => 
      batch._id !== student?.batch_id
  );

  const handleMove = async () => {
    if (!selectedBatchId || !student) return;

    try {
      await moveStudentMutation.mutateAsync({
        applicationId: student.application_id,
        targetBatchId: selectedBatchId,
      });
      
      onOpenChange(false);
      setSelectedBatchId("");
    } catch (error) {
      console.error("Failed to move student:", error);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedBatchId("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className={"font-semibold"}>{t("batchManagement.modal.moveStudent.title")}</DialogTitle>
          <DialogDescription>
            {t("batchManagement.modal.moveStudent.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground dark:text-white/70">{t("batchManagement.modal.moveStudent.studentId")}</label>
              <p className="text-sm font-semibold text-dashboard-text dark:text-white">{student?.uid}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground dark:text-white/70">{t("batchManagement.modal.moveStudent.studentName")}</label>
              <p className="text-sm font-semibold text-dashboard-text dark:text-white">
                {student?.first_name} {student?.last_name}
              </p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground dark:text-white/70">{t("batchManagement.modal.moveStudent.currentBatch")}</label>
            <p className="text-sm font-semibold text-dashboard-text dark:text-white">{student?.batch_name}</p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block text-muted-foreground dark:text-white/70">
              {t("batchManagement.modal.moveStudent.assignToBatch")}
            </label>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : error ? (
              <ErrorMessage
                message={error?.message || t("batchManagement.modal.moveStudent.loadBatchesFailed")}
                onRetry={refetch}
                variant="inline"
              />
            ) : (
              <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("batchManagement.modal.moveStudent.selectBatch")} />
                </SelectTrigger>
                <SelectContent>
                  {availableBatches.length > 0 ? (
                    availableBatches.map((batch) => (
                      <SelectItem key={batch._id} value={batch._id}>
                        <div className="flex flex-col">
                          <span className="text-dashboard-text dark:text-white">{batch.name}</span>
                          <span className="text-xs text-muted-foreground dark:text-white/70">
                            {batch.student_count}/{batch.intake?.student_per_batch} {t("batchManagement.modal.moveStudent.studentsCount")}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-batches" disabled>
                      {t("batchManagement.modal.moveStudent.noAvailableBatches")}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex items-center gap-2 p-2 bg-[#FF8904]/10 rounded-md">
            <AlertCircle className="h-4 w-4 text-[#A75800]" />
            <p className="text-xs text-[#A75800]">
              {t("batchManagement.modal.moveStudent.warningMessage")}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t("batchManagement.modal.moveStudent.cancel")}
          </Button>
          <Button 
            onClick={handleMove}
            disabled={!selectedBatchId || moveStudentMutation.isPending || availableBatches.length === 0}
          >
            {moveStudentMutation.isPending ? t("batchManagement.modal.moveStudent.moving") : t("batchManagement.modal.moveStudent.move")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MoveStudentDialog;