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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import {
  useAssignStudentModule,
  useSearchModulesForAssign,
} from "@/store/useModuleOverrideStore";
import { useGetAllPrograms } from "@/store/useDropdownStore";
import { useGetAdminStudentComponentSlots } from "@/store/useStudentStore";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { getMoment } from "@/utils/dateUtils";

const formatProgramLabel = (program) => {
  const parts = [program.name];
  if (program.city?.name) parts.push(program.city.name);
  if (program.language?.name) parts.push(program.language.name);
  return parts.filter(Boolean).join(" · ");
};

const AssignModuleDialog = ({
  open,
  onOpenChange,
  applicationId,
  studentId,
  totalYears = 1,
  defaultYear = 1,
  durationUnit = "years",
  onDone,
}) => {
  const { t } = useTranslation();
  const [programId, setProgramId] = useState("");
  const [programSearch, setProgramSearch] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [planningId, setPlanningId] = useState("");
  const [countsForYear, setCountsForYear] = useState(String(defaultYear || 1));
  const [reason, setReason] = useState("");

  const yearOptions = useMemo(
    () => Array.from({ length: Math.max(1, Number(totalYears) || 1) }, (_, i) => i + 1),
    [totalYears],
  );

  const yearLabel = durationUnit === "semesters"
    ? t("common.semester", "Semester")
    : t("common.year", "Year");

  const { data: programsData, isLoading: programsLoading } = useGetAllPrograms(
    { ...(programSearch && { search: programSearch }) },
    { enabled: open },
  );

  const programs = useMemo(
    () =>
      (programsData?.data || []).map((program) => ({
        ...program,
        _id: String(program._id),
        name: formatProgramLabel(program),
      })),
    [programsData?.data],
  );

  const { data, isLoading, isFetching } = useSearchModulesForAssign(
    { search, program_id: programId, limit: 40 },
    { enabled: open && !!programId },
  );
  const assignMutation = useAssignStudentModule();

  const modules = useMemo(() => data?.data || [], [data]);
  const selectedModule = useMemo(
    () => modules.find((m) => m._id === selectedId) || null,
    [modules, selectedId],
  );

  //* Pass component ObjectId (not system_id string) so slots resolve with this
  //* module's programme language — avoids empty list when student language differs.
  const slotLookupId = selectedModule?._id || selectedId || "";

  const {
    data: slotsResponse,
    isLoading: slotsLoading,
    isFetching: slotsFetching,
  } = useGetAdminStudentComponentSlots(studentId, slotLookupId, {
    enabled: open && !!studentId && !!slotLookupId,
  });

  const rawSlots = slotsResponse?.data || [];
  const availableSlots = useMemo(() => {
    return (slotsResponse?.data || []).filter((slot) => {
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
      return true;
    });
  }, [slotsResponse?.data]);

  const hasAnyPlannings = rawSlots.length > 0;
  const hasSlotOptions = availableSlots.length > 0;
  const slotsReady = !slotsLoading && !slotsFetching;

  useEffect(() => {
    if (!selectedId) {
      setPlanningId("");
      return;
    }
    setPlanningId("");
  }, [selectedId]);

  useEffect(() => {
    if (open) {
      setCountsForYear(String(defaultYear || 1));
    }
  }, [open, defaultYear]);

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

  const handleProgramChange = (value) => {
    setProgramId(value);
    setSelectedId("");
    setPlanningId("");
    setSearch("");
  };

  const handleClose = () => {
    setProgramId("");
    setProgramSearch("");
    setSearch("");
    setSelectedId("");
    setPlanningId("");
    setCountsForYear(String(defaultYear || 1));
    setReason("");
    onOpenChange(false);
  };

  //* Module, study year, and a planning group are required.
  const assignEnabled =
    !!selectedId &&
    !!countsForYear &&
    !!planningId &&
    !!applicationId &&
    !assignMutation.isPending &&
    (!studentId || !slotLookupId || slotsReady);

  const handleAssign = async () => {
    if (!assignEnabled) return;
    try {
      await assignMutation.mutateAsync({
        application_id: applicationId,
        component_id: selectedId,
        counts_for_year: Number(countsForYear),
        planning_id: planningId,
        reason: reason || undefined,
      });
      onDone?.();
      handleClose();
    } catch {
      // toast handled in mutation
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => (!v ? handleClose() : onOpenChange(v))}
    >
      <DialogContent className="max-w-lg max-h-[85vh] min-w-0 overflow-x-hidden overflow-y-auto">
        <DialogHeader className="min-w-0">
          <DialogTitle>
            {t("studentManagement.moduleOverride.assignTitle", "Assign module")}
          </DialogTitle>
          <DialogDescription className="break-words">
            {t(
              "studentManagement.moduleOverride.assignDesc",
              "Select a program, module, study year, and planning group. The student can pay online, or you can mark as paid later.",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-4 py-2 overflow-x-hidden">
          {programsLoading ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner size="sm" />
            </div>
          ) : (
            <SearchableSelect
              className="min-w-0"
              label={t(
                "studentManagement.moduleOverride.program",
                "Program",
              )}
              placeholder={t(
                "studentManagement.moduleOverride.selectProgram",
                "Select a program",
              )}
              searchPlaceholder={t(
                "studentManagement.moduleOverride.searchPrograms",
                "Search programs…",
              )}
              items={programs}
              value={programId}
              onChange={handleProgramChange}
              onSearch={setProgramSearch}
              required
            />
          )}

          {programId ? (
            <>
              <div className="min-w-0">
                <Label>{t("common.search", "Search")}</Label>
                <Input
                  className="mt-1"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t(
                    "studentManagement.moduleOverride.searchPlaceholder",
                    "Search by name or module ID",
                  )}
                />
              </div>

              <div className="min-w-0 border rounded-md max-h-56 overflow-y-auto overflow-x-hidden">
                {isLoading || isFetching ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : modules.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 text-center">
                    {t("common.noResults", "No results")}
                  </p>
                ) : (
                  <ul className="divide-y dark:divide-white/10">
                    {modules.map((m) => (
                      <li key={m._id} className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setSelectedId(m._id)}
                          className={`w-full min-w-0 text-left px-3 py-2 text-sm hover:bg-muted/60 ${
                            selectedId === m._id
                              ? "bg-orange-50 dark:bg-orange-950/30"
                              : ""
                          }`}
                        >
                          <div className="font-medium truncate">{m.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {m.uid}
                            {m.amount != null ? ` · €${m.amount}` : ""}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center border rounded-md break-words">
              {t(
                "studentManagement.moduleOverride.selectProgramHint",
                "Select a program to see modules",
              )}
            </p>
          )}

          {selectedId ? (
            <div className="min-w-0 space-y-2">
              <Label>
                {t(
                  "studentManagement.moduleOverride.countsForYear",
                  "Counts for {{unit}}",
                  { unit: yearLabel.toLowerCase() },
                )}
              </Label>
              <Select value={countsForYear} onValueChange={setCountsForYear}>
                <SelectTrigger className="min-w-0 w-full">
                  <SelectValue
                    placeholder={t(
                      "studentManagement.moduleOverride.selectYear",
                      "Select {{unit}}…",
                      { unit: yearLabel.toLowerCase() },
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {yearLabel} {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground break-words">
                {t(
                  "studentManagement.moduleOverride.countsForYearHint",
                  "Extra (cross-program) modules must be completed before this study year can be finished.",
                )}
              </p>
            </div>
          ) : null}

          {selectedId ? (
            <div className="min-w-0 space-y-2">
              <Label>
                {t(
                  "studentManagement.moduleOverride.planning",
                  "Planning group",
                )}
              </Label>
              {!studentId ? (
                <p className="text-sm text-muted-foreground break-words">
                  {t(
                    "studentManagement.moduleOverride.missingStudent",
                    "Student id missing; cannot load planning slots.",
                  )}
                </p>
              ) : slotsLoading || slotsFetching ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : hasSlotOptions ? (
                <Select value={planningId} onValueChange={setPlanningId}>
                  <SelectTrigger className="min-w-0 w-full [&>span]:truncate [&>span]:block [&>span]:text-left">
                    <SelectValue
                      placeholder={t(
                        "studentManagement.moduleOverride.selectPlanning",
                        "Select a planning group…",
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent
                    className="w-[var(--radix-select-trigger-width)] max-w-[var(--radix-select-trigger-width)]"
                    position="popper"
                  >
                    {availableSlots.map((slot) => (
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
              ) : hasAnyPlannings ? (
                <p className="text-sm text-muted-foreground border rounded-md p-3 break-words">
                  {t(
                    "studentManagement.moduleOverride.planningsFull",
                    "All planning groups for this module are full. Free a seat or pick another module.",
                  )}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground border rounded-md p-3 break-words">
                  {t(
                    "studentManagement.moduleOverride.noPlannings",
                    "No planning groups for this module. Choose a module that has a planning group.",
                  )}
                </p>
              )}
            </div>
          ) : null}

          <div className="min-w-0">
            <Label>
              {t(
                "studentManagement.moduleOverride.reason",
                "Reason (optional)",
              )}
            </Label>
            <Textarea
              className="mt-1"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            type="button"
            disabled={!assignEnabled}
            onClick={handleAssign}
          >
            {assignMutation.isPending
              ? t("common.processing", "Processing...")
              : t("studentManagement.moduleOverride.assign", "Assign")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignModuleDialog;
