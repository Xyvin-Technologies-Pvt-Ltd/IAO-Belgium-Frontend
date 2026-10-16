import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { useAssignModuleReattempt } from "@/store/useYearCompletionStore";
import { useGetAdminStudentComponentSlots } from "@/store/useStudentStore";
import { getMoment } from "@/utils/dateUtils";
import { Loader2 } from "lucide-react";

const ModuleReattemptDialog = ({
  open,
  onOpenChange,
  studentId,
  applicationId,
  componentId,
  systemId,
  moduleName,
  onDone,
}) => {
  const { t } = useTranslation();
  const [newPlanningId, setNewPlanningId] = useState("");

  const slotLookupId = systemId || componentId;

  const { data: slotsResponse, isLoading: slotsLoading, error } =
    useGetAdminStudentComponentSlots(studentId, slotLookupId, {
      enabled: open && !!studentId && !!slotLookupId,
    });

  const assignMutation = useAssignModuleReattempt();

  const slots = slotsResponse?.data || [];
  const currentSlot = slots.find((slot) => slot.is_current_enrollment);
  const currentPlanningId = currentSlot?.planning_id?.toString() || "";

  const alternativeSlots = useMemo(
    () =>
      slots.filter((slot) => {
        if (slot.planning_id?.toString() === currentPlanningId) return false;
        if ((slot.available_seats || 0) <= 0) return false;

        if (slot.sessions && slot.sessions.length > 0) {
          return slot.sessions.some((s) => {
            if (!s?.session_date) return false;
            return getMoment(s.end_time || s.session_date).isSameOrAfter(
              getMoment(),
              "day",
            );
          });
        }

        // Keep slots with no sessions scheduled yet (TBA)
        return true;
      }),
    [slots, currentPlanningId],
  );

  const selectedTargetSlot = alternativeSlots.find(
    (slot) => slot.planning_id?.toString() === newPlanningId,
  );

  useEffect(() => {
    if (!open) setNewPlanningId("");
  }, [open]);

  const formatSlotLabel = (slot) => {
    const batch = slot.batch_name ? `${slot.batch_name} — ` : "";
    const venue = slot.venue || t("studentManagement.tba", "TBA");
    const seats = slot.available_seats ?? 0;

    let dateStr = "";
    if (slot.sessions && slot.sessions.length > 0) {
      const sortedDates = [...slot.sessions]
        .map((s) => s.session_date)
        .filter(Boolean)
        .sort((a, b) => getMoment(a).diff(getMoment(b)));

      if (sortedDates.length > 0) {
        const firstDate = getMoment(sortedDates[0]).format("DD MMM YYYY");
        const lastDate = getMoment(
          sortedDates[sortedDates.length - 1],
        ).format("DD MMM YYYY");
        dateStr =
          firstDate === lastDate
            ? ` (${firstDate})`
            : ` (${firstDate} – ${lastDate})`;
      }
    }

    return `${batch}${venue}${dateStr} (${seats} ${t("studentManagement.seats", "seats")})`;
  };

  const formatBookingLabel = (batchName, venue, sessions) => {
    const parts = [batchName, venue].filter(Boolean);
    let label =
      parts.length > 0
        ? parts.join(" — ")
        : t("studentManagement.tba", "TBA");

    if (sessions && sessions.length > 0) {
      const sortedDates = [...sessions]
        .map((s) => s.session_date)
        .filter(Boolean)
        .sort((a, b) => getMoment(a).diff(getMoment(b)));

      if (sortedDates.length > 0) {
        const firstDate = getMoment(sortedDates[0]).format("DD MMM YYYY");
        const lastDate = getMoment(
          sortedDates[sortedDates.length - 1],
        ).format("DD MMM YYYY");
        const dateRange =
          firstDate === lastDate ? firstDate : `${firstDate} – ${lastDate}`;
        label += ` · ${dateRange}`;
      }
    }

    return label;
  };

  const handleAssign = () => {
    if (!applicationId || !componentId || !newPlanningId) return;
    assignMutation.mutate(
      {
        application_id: applicationId,
        component_id: componentId,
        target_planning_id: newPlanningId,
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
      <DialogContent className="max-w-lg max-h-[90vh] min-w-0 overflow-x-hidden overflow-y-auto">
        <DialogHeader className="min-w-0">
          <DialogTitle>
            {t("yearCompletion.reattemptTitle", "Reattempt module")}
          </DialogTitle>
          <DialogDescription className="break-words">
            {moduleName
              ? t(
                  "yearCompletion.reattemptHint",
                  "The student must repurchase the full module price.",
                ) + ` (${moduleName})`
              : t(
                  "yearCompletion.reattemptHint",
                  "The student must repurchase the full module price.",
                )}
          </DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-4 py-2">
          {slotsLoading && (
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

          {!slotsLoading && !error && !slotLookupId && (
            <p className="text-sm text-amber-700 dark:text-amber-400 break-words">
              {t(
                "yearCompletion.reattemptNoSystemId",
                "This module has no system id, so available groups cannot be loaded.",
              )}
            </p>
          )}

          {!slotsLoading && !error && slotLookupId && (
            <>
              {(currentSlot || moduleName) && (
                <div className="min-w-0 rounded-md border border-border bg-muted/40 p-3 text-sm">
                  <p className="font-medium text-dashboard-text dark:text-white">
                    {t("studentManagement.currentBooking", "Current booking")}
                  </p>
                  <p className="text-muted-foreground mt-1 break-words">
                    {formatBookingLabel(
                      currentSlot?.batch_name,
                      currentSlot?.venue,
                      currentSlot?.sessions,
                    )}
                  </p>
                </div>
              )}

              <div className="min-w-0 space-y-2">
                <Label>
                  {t("studentManagement.newBooking", "New booking")}
                </Label>
                <Select
                  value={newPlanningId}
                  onValueChange={setNewPlanningId}
                  disabled={alternativeSlots.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        alternativeSlots.length === 0
                          ? t(
                              "studentManagement.noSlotsAvailable",
                              "No available slots",
                            )
                          : t(
                              "studentManagement.selectSlot",
                              "Select slot...",
                            )
                      }
                    />
                  </SelectTrigger>
                  <SelectContent
                    className="w-[var(--radix-select-trigger-width)] max-w-[var(--radix-select-trigger-width)]"
                    position="popper"
                  >
                    {alternativeSlots.map((slot) => (
                      <SelectItem
                        key={slot.planning_id}
                        value={slot.planning_id?.toString()}
                        className="whitespace-normal break-words py-2"
                      >
                        {formatSlotLabel(slot)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedTargetSlot && (
                  <div className="min-w-0 rounded-md border border-border bg-muted/40 p-3 text-sm">
                    <p className="font-medium text-dashboard-text dark:text-white">
                      {t(
                        "studentManagement.targetSchedule",
                        "Target schedule",
                      )}
                    </p>
                    <p className="text-muted-foreground mt-1 break-words">
                      {formatBookingLabel(
                        selectedTargetSlot.batch_name,
                        selectedTargetSlot.venue,
                        selectedTargetSlot.sessions,
                      )}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="min-w-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            onClick={handleAssign}
            disabled={
              !newPlanningId ||
              !applicationId ||
              !componentId ||
              assignMutation.isPending
            }
          >
            {assignMutation.isPending
              ? t("common.processing", "Processing...")
              : t("yearCompletion.reattemptAssign", "Assign group")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModuleReattemptDialog;
