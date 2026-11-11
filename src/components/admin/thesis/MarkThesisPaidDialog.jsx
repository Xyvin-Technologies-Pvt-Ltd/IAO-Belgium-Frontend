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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetThesisTrajectories,
  useMarkThesisStudentAsPaid,
} from "@/store/useThesisStore";

const personLabel = (person, fallback = "") => {
  if (!person) return fallback;
  return (
    `${person.first_name || ""} ${person.last_name || ""}`.trim() ||
    person.email ||
    person.uid ||
    fallback
  );
};

export default function MarkThesisPaidDialog({
  open,
  onOpenChange,
  thesisId,
  thesisName,
  student,
  studentName,
  userId,
  onDone,
}) {
  const { t } = useTranslation();
  const [trajectoryId, setTrajectoryId] = useState("");
  const [reason, setReason] = useState("");
  const markPaidMutation = useMarkThesisStudentAsPaid();

  const { data: trajectoriesResponse, isLoading: trajectoriesLoading } =
    useGetThesisTrajectories(thesisId, {
      enabled: Boolean(open && thesisId),
    });

  const trajectories = useMemo(() => {
    const raw = trajectoriesResponse?.data;
    return Array.isArray(raw) ? raw.filter((row) => !row.removed) : [];
  }, [trajectoriesResponse]);

  useEffect(() => {
    if (!open) {
      setTrajectoryId("");
      setReason("");
      return;
    }
    if (trajectories.length === 1) {
      setTrajectoryId(String(trajectories[0]._id));
    }
  }, [open, trajectories]);

  const handleClose = () => {
    setTrajectoryId("");
    setReason("");
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (!thesisId || !userId || !trajectoryId) return;
    try {
      await markPaidMutation.mutateAsync({
        thesisId,
        userId,
        trajectoryId,
        reason: reason.trim() || undefined,
      });
      onDone?.();
      handleClose();
    } catch {
      // toast in mutation
    }
  };

  const displayStudent = studentName || personLabel(student);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => (!v ? handleClose() : onOpenChange(v))}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("thesisManagement.markPaid.title", "Mark as paid")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "thesisManagement.markPaid.description",
              "Enrol the student on a trajectory for an offline / bank payment. No Mollie checkout is created."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {(displayStudent || thesisName) && (
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm space-y-0.5">
              {displayStudent ? (
                <p className="font-medium text-foreground">{displayStudent}</p>
              ) : null}
              {thesisName ? (
                <p className="text-muted-foreground">{thesisName}</p>
              ) : null}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="thesis-mark-paid-trajectory">
              {t("thesisManagement.markPaid.trajectory", "Trajectory")}
            </Label>
            <Select
              value={trajectoryId || undefined}
              onValueChange={setTrajectoryId}
              disabled={trajectoriesLoading || markPaidMutation.isPending}
            >
              <SelectTrigger id="thesis-mark-paid-trajectory" className="w-full">
                <SelectValue
                  placeholder={
                    trajectoriesLoading
                      ? t("common.loading", "Loading...")
                      : t(
                          "thesisManagement.markPaid.selectTrajectory",
                          "Select trajectory"
                        )
                  }
                />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                {trajectories.length === 0 && !trajectoriesLoading ? (
                  <SelectItem value="__none" disabled>
                    {t(
                      "thesisManagement.markPaid.noTrajectories",
                      "No trajectories available"
                    )}
                  </SelectItem>
                ) : (
                  trajectories.map((traj) => (
                    <SelectItem key={String(traj._id)} value={String(traj._id)}>
                      {traj.name || String(traj._id)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="thesis-mark-paid-reason">
              {t("thesisManagement.markPaid.reason", "Reason (optional)")}
            </Label>
            <Textarea
              id="thesis-mark-paid-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={markPaidMutation.isPending}
              placeholder={t(
                "thesisManagement.markPaid.reasonPlaceholder",
                "e.g. Bank transfer received"
              )}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            type="button"
            disabled={
              !trajectoryId ||
              trajectoryId === "__none" ||
              markPaidMutation.isPending ||
              trajectoriesLoading
            }
            onClick={handleConfirm}
          >
            {markPaidMutation.isPending
              ? t("common.processing", "Processing...")
              : t("thesisManagement.markPaid.confirm", "Mark as paid")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
