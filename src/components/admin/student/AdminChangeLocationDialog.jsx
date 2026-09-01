import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
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
import { useGetUsers } from "@/store/useDropdownStore";
import {
  useGetModulesForLocationSwitch,
  useGetAdminStudentComponentSlots,
  useGetAdminChangeLocationQuote,
  useAdminSwapStudentLocation,
} from "@/store/useStudentStore";

const AdminChangeLocationDialog = ({ open, onOpenChange, onSuccess }) => {
  const { t } = useTranslation();
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [studentId, setStudentId] = useState("");
  const [selectedModuleKey, setSelectedModuleKey] = useState("");
  const [newPlanningId, setNewPlanningId] = useState("");

  const { data: usersData, isLoading: usersLoading } = useGetUsers(
    {
      ...(userSearchTerm && { search: userSearchTerm }),
      role: "student",
    },
    { enabled: open },
  );

  const students = (usersData?.data || []).map((user) => ({
    _id: user._id,
    name: user.name,
  }));

  const { data: modulesResponse, isLoading: modulesLoading } =
    useGetModulesForLocationSwitch(studentId, { enabled: open && !!studentId });

  const modules = modulesResponse?.data?.modules || [];

  const selectedModule = useMemo(
    () => modules.find((m) => m.system_id === selectedModuleKey),
    [modules, selectedModuleKey],
  );

  const { data: slotsResponse, isLoading: slotsLoading } =
    useGetAdminStudentComponentSlots(studentId, selectedModuleKey, {
      enabled: open && !!studentId && !!selectedModuleKey,
    });

  const slots = slotsResponse?.data || [];
  const currentSlot = slots.find((slot) => slot.is_current_enrollment);
  // Fallback: modules-for-switch already resolved current planning when Availability is missing
  const currentPlanningId =
    currentSlot?.planning_id?.toString() ||
    selectedModule?.planning_id?.toString() ||
    "";

  const alternativeSlots = slots.filter(
    (slot) =>
      slot.planning_id?.toString() !== currentPlanningId &&
      (slot.available_seats || 0) > 0,
  );

  const { data: quoteResponse, isLoading: quoteLoading } =
    useGetAdminChangeLocationQuote(
      studentId,
      currentPlanningId,
      newPlanningId,
      {
        enabled:
          open &&
          !!studentId &&
          !!currentPlanningId &&
          !!newPlanningId,
      },
    );

  const quote = quoteResponse?.data;
  const canSwitch = quote?.can_admin_execute === true;

  const swapMutation = useAdminSwapStudentLocation();

  useEffect(() => {
    if (!open) {
      setUserSearchTerm("");
      setStudentId("");
      setSelectedModuleKey("");
      setNewPlanningId("");
    }
  }, [open]);

  useEffect(() => {
    setSelectedModuleKey("");
    setNewPlanningId("");
  }, [studentId]);

  useEffect(() => {
    setNewPlanningId("");
  }, [selectedModuleKey]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSwitch = async () => {
    if (!studentId || !currentPlanningId || !newPlanningId) return;

    try {
      await swapMutation.mutateAsync({
        studentId,
        currentPlanningId,
        newPlanningId,
      });
      toast.success(
        t(
          "studentManagement.locationSwitchSuccess",
          "Location switched successfully",
        ),
      );
      onSuccess?.();
      handleClose();
    } catch (error) {
      toast.error(
        error?.message ||
          t("studentManagement.locationSwitchFailed", "Failed to switch location"),
      );
    }
  };

  const formatSlotLabel = (slot) => {
    const batch = slot.batch_name ? `${slot.batch_name} — ` : "";
    const venue = slot.venue || t("studentManagement.tba", "TBA");
    const seats = slot.available_seats ?? 0;
    return `${batch}${venue} (${seats} ${t("studentManagement.seats", "seats")})`;
  };

  const formatBookingLabel = (batchName, venue) => {
    const parts = [batchName, venue].filter(Boolean);
    return parts.length > 0 ? parts.join(" — ") : t("studentManagement.tba", "TBA");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] min-w-0 overflow-x-hidden overflow-y-auto">
        <DialogHeader className="min-w-0">
          <DialogTitle>
            {t("studentManagement.changeLocation", "Change Location")}
          </DialogTitle>
          <DialogDescription className="break-words">
            {t(
              "studentManagement.changeLocationDescription",
              "Select a student and target module slot. Admin can switch unpaid modules for free. Paid modules requiring payment must go through the student portal.",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-4 py-2">
          <SearchableSelect
            label={t("studentManagement.student", "Student")}
            placeholder={t("studentManagement.selectStudent", "Select student...")}
            searchPlaceholder={t("studentManagement.searchStudent", "Search student...")}
            items={students}
            value={studentId}
            onChange={setStudentId}
            onSearch={setUserSearchTerm}
            isLoading={usersLoading}
            required
          />

          {studentId && (
            <div className="min-w-0 space-y-2">
              <Label>
                {t("studentManagement.module", "Module")}
              </Label>
              <Select
                value={selectedModuleKey}
                onValueChange={setSelectedModuleKey}
                disabled={modulesLoading || modules.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      modulesLoading
                        ? t("common.loading", "Loading...")
                        : t("studentManagement.selectModule", "Select module...")
                    }
                  />
                </SelectTrigger>
                <SelectContent
                  className="w-[var(--radix-select-trigger-width)] max-w-[var(--radix-select-trigger-width)]"
                  position="popper"
                >
                  {modules.map((mod) => (
                    <SelectItem
                      key={mod.system_id}
                      value={mod.system_id}
                      className="whitespace-normal break-words py-2"
                    >
                      {mod.name}
                      {mod.batch_name ? ` — ${mod.batch_name}` : ""}
                      {mod.venue ? ` — ${mod.venue}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedModule && (currentSlot || selectedModule.venue) && (
            <div className="min-w-0 rounded-md border border-border bg-muted/40 p-3 text-sm">
              <p className="font-medium text-dashboard-text dark:text-white">
                {t("studentManagement.currentBooking", "Current booking")}
              </p>
              <p className="text-muted-foreground mt-1 break-words">
                {formatBookingLabel(
                  currentSlot?.batch_name || selectedModule.batch_name,
                  currentSlot?.venue || selectedModule.venue,
                )}
              </p>
            </div>
          )}

          {selectedModuleKey && (
            <div className="min-w-0 space-y-2">
              <Label>
                {t("studentManagement.newBooking", "New booking")}
              </Label>
              <Select
                value={newPlanningId}
                onValueChange={setNewPlanningId}
                disabled={slotsLoading || alternativeSlots.length === 0 || !currentPlanningId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      slotsLoading
                        ? t("common.loading", "Loading...")
                        : !currentPlanningId
                          ? t(
                              "studentManagement.noCurrentBooking",
                              "Current booking not found",
                            )
                        : alternativeSlots.length === 0
                          ? t(
                              "studentManagement.noSlotsAvailable",
                              "No available slots",
                            )
                          : t("studentManagement.selectSlot", "Select slot...")
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
            </div>
          )}

          {newPlanningId && !currentPlanningId && (
            <p className="text-sm text-amber-700 dark:text-amber-400 break-words">
              {t(
                "studentManagement.cannotQuoteWithoutCurrent",
                "Cannot load switch quote — current booking planning is missing.",
              )}
            </p>
          )}

          {newPlanningId && quote && (
            <div className="min-w-0 rounded-md border border-border p-3 space-y-2 text-sm">
              <p className="font-medium">
                {t("studentManagement.paymentSummary", "Payment summary")}
              </p>
              {!quote.is_paid && canSwitch ? (
                quote.direct_switch ? (
                  <p className="text-emerald-700 dark:text-emerald-400 break-words">
                    {t(
                      "studentManagement.freeSwitch",
                      "Free switch — no payment required",
                    )}
                  </p>
                ) : (
                  <p className="text-emerald-700 dark:text-emerald-400 break-words">
                    {t(
                      "studentManagement.freeAdminSwitchModuleDueLater",
                      "Free admin switch — module fee due later via student purchase",
                    )}
                  </p>
                )
              ) : quote.is_paid && !canSwitch ? (
                <>
                  {Number(quote.payable_amount) > 0 && (
                    <p className="text-amber-700 dark:text-amber-400 break-words">
                      {t("studentManagement.paymentRequired", "Payment required")}:{" "}
                      {quote.payable_amount} {quote.new_session_currency || "EUR"}
                    </p>
                  )}
                  <p className="text-amber-700 dark:text-amber-400 break-words">
                    {t(
                      "studentManagement.paidModuleBlocked",
                      "Paid module — admin cannot switch. Student must use portal.",
                    )}
                  </p>
                </>
              ) : canSwitch ? (
                <p className="text-muted-foreground break-words">
                  {t("studentManagement.noPaymentDue", "No payment due")}
                </p>
              ) : null}
              {!canSwitch && quote.is_paid && (
                <p className="text-xs text-muted-foreground break-words">
                  {t(
                    "studentManagement.adminSwitchBlocked",
                    "Switch is disabled — payment must be handled via student portal.",
                  )}
                </p>
              )}
            </div>
          )}

          {quoteLoading && newPlanningId && (
            <p className="text-sm text-muted-foreground">
              {t("common.loading", "Loading...")}
            </p>
          )}
        </div>

        <DialogFooter className="min-w-0">
          <Button variant="outline" onClick={handleClose}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            onClick={handleSwitch}
            disabled={
              !canSwitch ||
              swapMutation.isPending ||
              quoteLoading ||
              !newPlanningId
            }
          >
            {swapMutation.isPending
              ? t("common.processing", "Processing...")
              : t("studentManagement.switchLocation", "Switch Location")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminChangeLocationDialog;
