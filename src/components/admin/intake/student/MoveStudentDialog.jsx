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
import { useGetAllPrograms } from "@/store/useDropdownStore";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import { AlertCircle } from "lucide-react";

const toId = (value) => {
  if (!value) return "";
  return String(value._id || value);
};

const formatProgramLabel = (program) => {
  if (!program) return "";
  const location = program.city?.name || (program.is_online ? "Online" : "");
  return [program.name, location, program.language?.name]
    .filter(Boolean)
    .join(" - ");
};

const MoveStudentDialog = ({ open, onOpenChange, student }) => {
  const { t } = useTranslation();
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedAcademicId, setSelectedAcademicId] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [programSearch, setProgramSearch] = useState("");
  const [academicSearch, setAcademicSearch] = useState("");
  const [batchSearch, setBatchSearch] = useState("");

  const originalProgramId = toId(student?.program_id);
  const originalBatchId = toId(student?.batch_id);
  const originalYear = String(student?.current_year || 1);
  const hasBlockingAvailabilities = Boolean(student?.has_blocking_availabilities);

  const { data: programsData, isLoading: programsLoading } = useGetAllPrograms(
    { ...(programSearch && { search: programSearch }) },
    { enabled: Boolean(open) },
  );

  const { data, isLoading, error, refetch } = useGetBatchesByProgram(
    selectedProgramId,
    { enabled: Boolean(open && selectedProgramId) },
  );
  const moveStudentMutation = useMoveStudentToAnotherBatch();

  const intakeGroups = data?.data || [];

  const programs = useMemo(() => {
    const list = (programsData?.data || []).map((program) => ({
      ...program,
      _id: String(program._id),
      name: formatProgramLabel(program),
    }));
    if (
      selectedProgramId &&
      !list.some((item) => item._id === selectedProgramId)
    ) {
      list.unshift({
        _id: selectedProgramId,
        name:
          selectedProgramId === originalProgramId && student?.program_name
            ? student.program_name
            : selectedProgramId,
        year: student?.program_year,
      });
    }
    return list;
  }, [
    programsData?.data,
    originalProgramId,
    selectedProgramId,
    student?.program_name,
    student?.program_year,
  ]);

  const selectedProgram = programs.find(
    (program) => program._id === selectedProgramId,
  );
  const maxYear = Math.max(
    1,
    Number(selectedProgram?.year || student?.program_year || 1),
  );
  const yearItems = useMemo(
    () =>
      Array.from({ length: maxYear }, (_, index) => ({
        _id: String(index + 1),
        name: String(index + 1),
      })),
    [maxYear],
  );

  const allBatches = useMemo(() => {
    return intakeGroups.flatMap((group) => {
      const intakeName = group.intake?.name || "";
      const academic = group.intake?.academic;
      const academicId = academic?._id ? String(academic._id) : "";
      const academicName = academic?.name || "";
      return (group.batches || []).map((batch) => ({
        ...batch,
        _id: String(batch._id),
        intake_id: group.intake?._id,
        academic_id: academicId,
        academic_name: academicName,
        label: [batch.name, academicName || intakeName]
          .filter(Boolean)
          .join(" · "),
      }));
    });
  }, [intakeGroups]);

  const academicItems = useMemo(() => {
    const map = new Map();
    allBatches.forEach((batch) => {
      if (batch.academic_id && !map.has(batch.academic_id)) {
        map.set(batch.academic_id, {
          _id: batch.academic_id,
          name: batch.academic_name || batch.academic_id,
        });
      }
    });
    let list = [...map.values()];
    const q = String(academicSearch || "").trim().toLowerCase();
    if (q) {
      list = list.filter((item) => item.name.toLowerCase().includes(q));
    }
    return list;
  }, [allBatches, academicSearch]);

  const batchSelectItems = useMemo(() => {
    const q = String(batchSearch || "").trim().toLowerCase();
    let list = allBatches
      .filter(
        (batch) =>
          !selectedAcademicId ||
          String(batch.academic_id) === String(selectedAcademicId),
      )
      .map((batch) => ({
        _id: batch._id,
        name: `${batch.label} (${batch.student_count ?? 0} ${t(
          "batchManagement.modal.moveStudent.studentsCount",
          "students",
        )}${
          batch.is_full_filled && batch._id !== originalBatchId
            ? ` · ${t("common.full", "Full")}`
            : ""
        })`,
        is_full_filled: batch.is_full_filled,
      }));

    if (q) {
      list = list.filter((item) => item.name.toLowerCase().includes(q));
    }

    if (selectedBatchId) {
      const selected = list.find(
        (item) => String(item._id) === String(selectedBatchId),
      );
      const fromAll = allBatches.find(
        (batch) => String(batch._id) === String(selectedBatchId),
      );
      if (!selected && fromAll) {
        list = [
          {
            _id: fromAll._id,
            name: fromAll.label,
            is_full_filled: fromAll.is_full_filled,
          },
          ...list,
        ];
      }
    }

    return list;
  }, [
    allBatches,
    batchSearch,
    selectedAcademicId,
    selectedBatchId,
    originalBatchId,
    t,
  ]);

  useEffect(() => {
    if (!open || !student) return;
    setSelectedProgramId(originalProgramId);
    setSelectedYear(originalYear);
    setSelectedBatchId(originalBatchId);
    setSelectedAcademicId(toId(student.academic_id));
    setProgramSearch("");
    setAcademicSearch("");
    setBatchSearch("");
  }, [open, student, originalProgramId, originalYear, originalBatchId]);

  useEffect(() => {
    if (!open || !allBatches.length) return;

    if (selectedBatchId) {
      const match = allBatches.find(
        (batch) => String(batch._id) === String(selectedBatchId),
      );
      if (match?.academic_id && !selectedAcademicId) {
        setSelectedAcademicId(match.academic_id);
      }
      return;
    }

    const uniqueAcademicIds = [
      ...new Set(allBatches.map((batch) => batch.academic_id).filter(Boolean)),
    ];
    if (!selectedAcademicId && uniqueAcademicIds.length === 1) {
      setSelectedAcademicId(uniqueAcademicIds[0]);
    }
  }, [open, allBatches, selectedBatchId, selectedAcademicId]);

  useEffect(() => {
    if (selectedYear && Number(selectedYear) > maxYear) {
      setSelectedYear(String(maxYear));
    }
  }, [maxYear, selectedYear]);

  const selectedBatch = allBatches.find(
    (batch) => String(batch._id) === String(selectedBatchId),
  );
  const selectedBatchIsFull =
    selectedBatch?.is_full_filled &&
    String(selectedBatchId) !== originalBatchId;

  const hasChanges =
    String(selectedBatchId) !== originalBatchId ||
    String(selectedProgramId) !== originalProgramId ||
    String(selectedYear) !== originalYear;

  const handleProgramChange = (value) => {
    setSelectedProgramId(value);
    setSelectedAcademicId("");
    setSelectedBatchId("");
    setAcademicSearch("");
    setBatchSearch("");
  };

  const handleAcademicChange = (value) => {
    setSelectedAcademicId(value);
    if (selectedBatchId) {
      const match = allBatches.find(
        (batch) => String(batch._id) === String(selectedBatchId),
      );
      if (match && String(match.academic_id) !== String(value)) {
        setSelectedBatchId("");
      }
    }
  };

  const handleMove = async () => {
    if (!selectedBatchId || !student) return;

    try {
      await moveStudentMutation.mutateAsync({
        applicationId: student.application_id,
        targetBatchId: selectedBatchId,
        currentYear: Number(selectedYear) || 1,
      });

      onOpenChange(false);
    } catch (err) {
      console.error("Failed to move student:", err);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const fieldsDisabled = hasBlockingAvailabilities || moveStudentMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg min-w-0 overflow-hidden sm:max-w-lg">
        <DialogHeader className="min-w-0">
          <DialogTitle className="font-semibold pr-6">
            {t("batchManagement.modal.moveStudent.title")}
          </DialogTitle>
          <DialogDescription>
            {t("batchManagement.modal.moveStudent.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-5 overflow-hidden">
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

          {hasBlockingAvailabilities ? (
            <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded-md">
              <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
              <p className="text-xs text-destructive min-w-0">
                {t(
                  "batchManagement.modal.moveStudent.blockingAvailabilities",
                  "This student cannot be moved because one or more modules are in progress or completed. Only students with available or locked modules can be moved.",
                )}
              </p>
            </div>
          ) : null}

          {!originalProgramId ? (
            <ErrorMessage
              message={t(
                "batchManagement.modal.moveStudent.missingProgram",
                "Could not determine this student's programme. Refresh and try again.",
              )}
              variant="inline"
            />
          ) : (
            <div className="min-w-0 space-y-4">
              <SearchableSelect
                className="min-w-0"
                label={t(
                  "batchManagement.modal.moveStudent.studyYear",
                  "Study year",
                )}
                placeholder={t(
                  "batchManagement.modal.moveStudent.selectStudyYear",
                  "Select study year",
                )}
                items={yearItems}
                value={selectedYear}
                onChange={setSelectedYear}
                required
                disabled={fieldsDisabled}
              />

              {programsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : (
                <SearchableSelect
                  className="min-w-0"
                  label={t(
                    "batchManagement.modal.moveStudent.program",
                    "Programme",
                  )}
                  placeholder={t(
                    "batchManagement.modal.moveStudent.selectProgram",
                    "Select a programme",
                  )}
                  searchPlaceholder={t(
                    "batchManagement.modal.moveStudent.searchPrograms",
                    "Search programmes…",
                  )}
                  items={programs}
                  value={selectedProgramId}
                  onChange={handleProgramChange}
                  onSearch={setProgramSearch}
                  required
                  disabled={fieldsDisabled}
                />
              )}

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
                <>
                  <SearchableSelect
                    className="min-w-0"
                    label={t(
                      "batchManagement.modal.moveStudent.academicYear",
                      "Academic year",
                    )}
                    placeholder={t(
                      "batchManagement.modal.moveStudent.selectAcademicYear",
                      "Select academic year",
                    )}
                    searchPlaceholder={t(
                      "batchManagement.modal.moveStudent.searchAcademicYears",
                      "Search academic years…",
                    )}
                    items={academicItems}
                    value={selectedAcademicId}
                    onChange={handleAcademicChange}
                    onSearch={setAcademicSearch}
                    required
                    disabled={fieldsDisabled || academicItems.length === 0}
                  />

                  {batchSelectItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t(
                        "batchManagement.modal.moveStudent.noBatches",
                        "No groups available for this programme and academic year.",
                      )}
                    </p>
                  ) : (
                    <SearchableSelect
                      className="min-w-0"
                      label={t(
                        "batchManagement.modal.moveStudent.assignToBatch",
                      )}
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
                      disabled={fieldsDisabled}
                    />
                  )}
                </>
              )}
            </div>
          )}

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
              fieldsDisabled ||
              !selectedBatchId ||
              !selectedProgramId ||
              !selectedYear ||
              !hasChanges ||
              selectedBatchIsFull ||
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
