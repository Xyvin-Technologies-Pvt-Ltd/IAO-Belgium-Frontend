
import { useState, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Upload, CheckCircle2, AlertTriangle, ChevronLeft, Users } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import { useGetAllPrograms } from "@/store/useDropdownStore";
import { useGetBatchesByProgram } from "@/store/useIntakeStore";
import {
  usePreviewManualTherapieImport,
  useConfirmManualTherapieImport,
} from "@/store/useManualTherapieImport";

//* ─── Constants ──────────────────────────────────────────────────────────────

const STEP = { UPLOAD: "upload", REVIEW: "review", DONE: "done" };
const ACCEPTED_EXT = [".xlsx", ".xls"];

//* ─── Sub-components ─────────────────────────────────────────────────────────

//* Checkbox list of all program modules. Checked = already completed.
const ModuleCheckboxList = ({ modules, selected, onChange }) => {
  const toggle = (id) => {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    onChange(next);
  };

  if (!modules || modules.length === 0) {
    return <span className="text-xs text-muted-foreground">No modules found for this program</span>;
  }

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {modules.map((mod) => (
        <label key={mod.id} className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            className="accent-primary"
            checked={selected.includes(mod.id)}
            onChange={() => toggle(mod.id)}
          />
          <span className="text-xs font-medium">{mod.code}</span>
        </label>
      ))}
    </div>
  );
};

//* ─── Main Dialog ─────────────────────────────────────────────────────────────

const ManualTherapieImportDialog = ({ open, onClose }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  //* Step state
  const [step, setStep] = useState(STEP.UPLOAD);

  //* Upload step state
  const [programId, setProgramId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [programSearch, setProgramSearch] = useState("");
  const [file, setFile] = useState(null);

  //* Review step state — array of student objects with admin-editable completed_modules
  const [students, setStudents] = useState([]);
  const [programMeta, setProgramMeta] = useState(null);
  const [programModules, setProgramModules] = useState([]);

  //* Confirm result
  const [confirmResult, setConfirmResult] = useState(null);

  //* Mutations
  const previewMutation = usePreviewManualTherapieImport();
  const confirmMutation = useConfirmManualTherapieImport();

  //* Data sources
  const { data: programsData, isLoading: programsLoading } = useGetAllPrograms(
    { ...(programSearch && { search: programSearch }), program_type: "Manual Therapie" },
    { enabled: open },
  );
  const programs = (programsData?.data || []).map((p) => ({
    _id: p._id,
    name: `${p.name}${p.city?.name ? ` — ${p.city.name}` : ""}`,
  }));

  const { data: batchesData, isLoading: batchesLoading } = useGetBatchesByProgram(
    programId,
    { enabled: open && !!programId },
  );
  const batches = useMemo(() => {
    const groups = batchesData?.data || [];
    return groups.flatMap((group) => {
      const intakeName = group.intake?.name || "";
      return (group.batches || []).map((batch) => ({
        _id: String(batch._id),
        name: [batch.name, intakeName].filter(Boolean).join(" · "),
      }));
    });
  }, [batchesData]);

  //* ── Handlers ──

  const handleReset = useCallback(() => {
    setStep(STEP.UPLOAD);
    setProgramId("");
    setBatchId("");
    setFile(null);
    setStudents([]);
    setProgramMeta(null);
    setProgramModules([]);
    setConfirmResult(null);
    previewMutation.reset();
    confirmMutation.reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleProgramChange = (val) => {
    setProgramId(val);
    setBatchId("");
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED_EXT.some((ext) => f.name.toLowerCase().endsWith(ext))) {
      toast.error("Invalid file. Please upload an Excel (.xlsx) file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setFile(f);
  };

  //* Run preview — calls POST /preview, transitions to review step.
  const handlePreview = async () => {
    if (!file || !programId || !batchId) return;
    try {
      const res = await previewMutation.mutateAsync({ file, programId, batchId });
      const parsed = res?.data?.students || [];
      const modules = (res?.data?.program_modules || []).map((m) => ({
        id: m._id,
        code: m.uid || m.name,
      }));

      const enriched = parsed.map((s) => ({
        ...s,
        to_follow: s.to_follow || [],
        completed_modules: s.completed_modules || [],
      }));

      setStudents(enriched);
      setProgramModules(modules);
      setProgramMeta(res?.data?.program || null);
      setStep(STEP.REVIEW);
    } catch (err) {
      toast.error(err?.message || "Preview failed. Please check the file and try again.");
    }
  };

  //* Checking a module marks it completed (removed from pending).
  //* Unchecking moves it back to pending (to follow).
  const handleCompletedChange = (idx, newCompleted) => {
    setStudents((prev) =>
      prev.map((s, i) => {
        if (i !== idx) return s;
        const completedSet = new Set(newCompleted);
        const previousCompleted = s.completed_modules || [];
        const previousPending = s.to_follow || [];
        const stillPending = previousPending.filter((id) => !completedSet.has(id));
        const movedBackToPending = previousCompleted.filter(
          (id) => !completedSet.has(id) && !stillPending.includes(id),
        );
        return {
          ...s,
          completed_modules: newCompleted,
          to_follow: [...stillPending, ...movedBackToPending],
        };
      }),
    );
  };

  //* Confirm import — calls POST /confirm with the reviewed student array.
  const handleConfirm = async () => {
    if (!programId || !batchId || batchId === "undefined") {
      toast.error("Please select a valid program and batch before confirming.");
      setStep(STEP.UPLOAD);
      return;
    }
    try {
      //* Strip internal UI-only fields before sending.
      const payload = students.map(
        ({ to_follow_codes, completed_codes, warnings, ...rest }) => rest,
      );
      const res = await confirmMutation.mutateAsync({
        programId,
        batchId,
        students: payload,
      });
      setConfirmResult(res?.data || null);
      setStep(STEP.DONE);
    } catch (err) {
      toast.error(err?.message || "Import failed. Please try again.");
    }
  };

  //* ── Render ──

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("manualTherapieImport.title", "Manual Therapie — Migrate Students")}
          </DialogTitle>
        </DialogHeader>

        {/* ── STEP 1: Upload ── */}
        {step === STEP.UPLOAD && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t(
                "manualTherapieImport.description",
                "Upload a single-location Excel file (Gent or Antwerpen). Select the target program and batch, then run a preview to review the student list before confirming.",
              )}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SearchableSelect
                label={t("manualTherapieImport.selectProgram", "Program (Manual Therapie)")}
                placeholder="Select program"
                required
                items={programs}
                value={programId}
                onChange={handleProgramChange}
                onSearch={setProgramSearch}
                isLoading={programsLoading}
              />
              <SearchableSelect
                label={t("manualTherapieImport.selectBatch", "Target Batch (Group)")}
                placeholder={programId ? "Select batch" : "Select a program first"}
                required
                items={batches}
                value={batchId}
                onChange={setBatchId}
                disabled={!programId}
                isLoading={batchesLoading}
              />
            </div>

            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="h-10 w-10 text-muted-foreground" />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={!batchId}
              >
                {t("manualTherapieImport.selectFile", "Select Excel File")}
              </Button>
              {!batchId && (
                <p className="text-xs text-muted-foreground">
                  {t(
                    "manualTherapieImport.selectBatchFirst",
                    "Select a program and batch before choosing a file.",
                  )}
                </p>
              )}
              {file && (
                <p className="text-sm font-medium text-foreground">{file.name}</p>
              )}
            </div>

            {previewMutation.isError && (
              <div className="flex items-center gap-2 text-sm text-red-600 rounded border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-3">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {previewMutation.error?.message || "Preview failed"}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button
                onClick={handlePreview}
                disabled={!file || !programId || !batchId || previewMutation.isPending}
              >
                {previewMutation.isPending
                  ? t("common.loading", "Loading...")
                  : t("manualTherapieImport.preview", "Preview Students")}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Review students + select completed modules ── */}
        {step === STEP.REVIEW && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(STEP.UPLOAD)}
                className="gap-1 -ml-2"
              >
                <ChevronLeft className="h-4 w-4" />
                {t("common.back", "Back")}
              </Button>
              <span className="text-sm text-muted-foreground">
                <Users className="inline h-4 w-4 mr-1" />
                {students.length} {t("manualTherapieImport.studentsFound", "student(s) parsed")}
                {programMeta && (
                  <span className="ml-2 font-medium">— {programMeta.name}</span>
                )}
              </span>
            </div>

            <p className="text-sm text-muted-foreground">
              {t(
                "manualTherapieImport.reviewInstructions",
                "To follow + completed are the selected modules. Completed modules are locked. To-follow modules stay pending. Students not found in CoachView can still be imported; archive history will be missing until a match exists.",
              )}
            </p>

            <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
              {students.map((s, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border p-3 space-y-2 bg-background"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        {s.first_name} {s.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                      {s.in_coachview ? (
                        <Badge className="mt-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px]">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {t("manualTherapieImport.alreadyOnCoachView", "Already on CoachView")}
                          {s.coachview_name ? ` — ${s.coachview_name}` : ""}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="mt-1 text-[10px] text-muted-foreground">
                          {t("manualTherapieImport.notInCoachView", "Not in CoachView")}
                        </Badge>
                      )}
                    </div>
                    {s.warnings && s.warnings.length > 0 && (
                      <div className="flex flex-col gap-1 items-end">
                        {s.warnings.map((w, wi) => (
                          <Badge
                            key={wi}
                            variant="outline"
                            className="text-amber-600 border-amber-300 text-[10px] whitespace-normal text-right max-w-65"
                          >
                            <AlertTriangle className="h-3 w-3 mr-1 shrink-0" />
                            {w}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1 font-medium">
                      {t("manualTherapieImport.pendingLabel", "To follow (pending):")}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(s.to_follow || []).length === 0 ? (
                        <span className="text-xs text-muted-foreground">None</span>
                      ) : (
                        (s.to_follow || []).map((id) => {
                          const mod = programModules.find((m) => m.id === id);
                          return (
                            <Badge key={id} variant="outline" className="text-[10px]">
                              {mod?.code || id}
                            </Badge>
                          );
                        })
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1 font-medium">
                      {t("manualTherapieImport.completedLabel", "Already completed (AJ 25-26):")}
                    </p>
                    <ModuleCheckboxList
                      modules={programModules}
                      selected={s.completed_modules}
                      onChange={(next) => handleCompletedChange(idx, next)}
                    />
                  </div>
                </div>
              ))}
            </div>

            {confirmMutation.isError && (
              <div className="flex items-center gap-2 text-sm text-red-600 rounded border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-3">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {confirmMutation.error?.message || "Import failed"}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={confirmMutation.isPending || students.length === 0}
              >
                {confirmMutation.isPending
                  ? t("common.loading", "Importing...")
                  : t("manualTherapieImport.confirm", "Confirm Import")}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Done ── */}
        {step === STEP.DONE && confirmResult && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-green-600 font-semibold">
                <CheckCircle2 className="h-5 w-5" />
                {t("manualTherapieImport.importComplete", "Import complete")}
              </div>

              <div className="flex flex-wrap gap-4">
                <span className="text-green-600 font-medium">
                  {t("manualTherapieImport.imported", "Imported")}: {confirmResult.imported ?? 0}
                </span>
                {confirmResult.completed_marked > 0 && (
                  <span className="text-blue-600 font-medium">
                    {t("manualTherapieImport.completedMarked", "Modules marked completed")}: {confirmResult.completed_marked}
                  </span>
                )}
                {confirmResult.skipped > 0 && (
                  <span className="text-amber-600 font-medium">
                    <AlertTriangle className="inline h-4 w-4 mr-1" />
                    {t("manualTherapieImport.skipped", "Skipped")}: {confirmResult.skipped}
                  </span>
                )}
              </div>

              {Array.isArray(confirmResult.errors) && confirmResult.errors.length > 0 && (
                <div>
                  <p className="font-medium mb-1">
                    {t("manualTherapieImport.errors", "Errors")}
                  </p>
                  <ul className="list-disc pl-5 space-y-1 max-h-40 overflow-y-auto text-muted-foreground">
                    {confirmResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleReset}>
                {t("manualTherapieImport.importAnother", "Import Another File")}
              </Button>
              <Button onClick={handleClose}>
                {t("common.close", "Close")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ManualTherapieImportDialog;
