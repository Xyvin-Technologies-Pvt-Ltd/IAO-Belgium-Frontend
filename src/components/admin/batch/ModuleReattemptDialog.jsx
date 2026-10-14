import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAssignModuleReattempt,
  useReattemptBatches,
} from "@/store/useYearCompletionStore";
import { formatTZ } from "@/utils/dateUtils";
import { Loader2 } from "lucide-react";

const ModuleReattemptDialog = ({
  open,
  onOpenChange,
  applicationId,
  componentId,
  moduleName,
  onDone,
}) => {
  const { t } = useTranslation();
  const [batchId, setBatchId] = useState("");
  const { data, isLoading, error } = useReattemptBatches(
    applicationId,
    componentId,
    { enabled: open && !!applicationId && !!componentId },
  );
  const assignMutation = useAssignModuleReattempt();

  const batches = data?.data?.batches || data?.batches || [];

  useEffect(() => {
    if (!open) setBatchId("");
  }, [open]);

  const handleAssign = () => {
    if (!batchId) return;
    assignMutation.mutate(
      {
        application_id: applicationId,
        component_id: componentId,
        target_batch_id: batchId,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onDone?.();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-md overflow-hidden">
        <DialogHeader className="min-w-0 pr-6">
          <DialogTitle>
            {t("yearCompletion.assignGroup", "Assign to another group")}
          </DialogTitle>
          <DialogDescription className="break-words">
            {moduleName
              ? t(
                  "yearCompletion.assignGroupHint",
                  "Choose a group with this module. Attendance and payment are kept.",
                ) + ` (${moduleName})`
              : t(
                  "yearCompletion.assignGroupHint",
                  "Choose a group with this module. Attendance and payment are kept.",
                )}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("common.loading", "Loading...")}
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">
            {error?.message || t("common.error", "Error")}
          </p>
        )}

        {!isLoading && !error && (
          <div className="space-y-3 min-w-0">
            <Select value={batchId} onValueChange={setBatchId}>
              <SelectTrigger className="w-full min-w-0">
                <SelectValue
                  placeholder={t(
                    "yearCompletion.selectBatch",
                    "Select group",
                  )}
                />
              </SelectTrigger>
              <SelectContent className="max-w-[min(100vw-2rem,28rem)]">
                {batches.map((b) => {
                  const label = [
                    b.batch_name,
                    b.next_session_date
                      ? formatTZ(b.next_session_date, "DD MMM YYYY")
                      : t("yearCompletion.noFutureSessions", "no future sessions"),
                    b.venue || null,
                  ]
                    .filter(Boolean)
                    .join(" — ");
                  return (
                    <SelectItem
                      key={String(b.batch_id)}
                      value={String(b.batch_id)}
                      title={label}
                      className="whitespace-normal"
                    >
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {batches.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {t(
                  "yearCompletion.noBatches",
                  "No other groups have this module planned.",
                )}
              </p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:items-center min-w-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!batchId || assignMutation.isPending}
          >
            {assignMutation.isPending
              ? t("common.processing", "Processing...")
              : t("yearCompletion.assign", "Assign")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModuleReattemptDialog;
