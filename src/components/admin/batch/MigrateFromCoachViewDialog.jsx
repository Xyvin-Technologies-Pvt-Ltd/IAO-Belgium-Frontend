import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle2, Eye, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import {
  useCoachviewCohorts,
  usePreviewCoachviewCohort,
  useMigrateCoachviewCohort,
} from "@/store/useCoachviewImport";

const ARCHIVE_URL = import.meta.env.VITE_APP_ARCHIVE_URL || "https://archive.osteopathie.eu/";

const STATUS_LABELS = {
  new: { label: "Will import", className: "text-green-600" },
  already_migrated: { label: "Already migrated", className: "text-gray-500" },
  email_conflict: { label: "Email conflict", className: "text-amber-600" },
  no_email: { label: "No email", className: "text-red-500" },
  graduate: { label: "Beyond program length", className: "text-gray-500" },
};

const MigrateFromCoachViewDialog = ({ open, onClose, batch }) => {
  const { t } = useTranslation();
  const [cohortSearch, setCohortSearch] = useState("");
  const [selectedCohortId, setSelectedCohortId] = useState(
    batch?.coachview_cohort?.opleiding_id || "",
  );
  //* The full row for the selected cohort, captured at selection time.
  //* Radix's <SelectValue> can only show a label for a value if a matching
  //* <SelectItem> is currently mounted — once the admin clears the search
  //* box (or the debounced query changes), the fetched list no longer
  //* contains the previously-picked cohort and the trigger goes blank even
  //* though selectedCohortId is still correct. Keeping this around and
  //* merging it back into cohortOptions below keeps that item mounted.
  const [selectedCohort, setSelectedCohort] = useState(
    batch?.coachview_cohort
      ? {
          opleiding_id: batch.coachview_cohort.opleiding_id,
          code: batch.coachview_cohort.code,
          target_year: batch.coachview_cohort.target_year,
          academic_year: batch.coachview_cohort.academic_year,
          location_name: null,
          student_count: batch.coachview_cohort.migrated_count,
        }
      : null,
  );
  const [preview, setPreview] = useState(null);
  const [previewedCohortId, setPreviewedCohortId] = useState(null);
  const [result, setResult] = useState(null);
  const [yearOverrides, setYearOverrides] = useState({});

  const { data: cohortsData, isLoading: cohortsLoading } = useCoachviewCohorts(
    { search: cohortSearch, limit: 30 },
    { enabled: open },
  );

  const cohortOptions = useMemo(() => {
    const base = (cohortsData?.data || []).map((c) => ({
      _id: c.opleiding_id,
      name: c.code,
      raw: c,
    }));
    if (selectedCohort && !base.some((o) => o._id === selectedCohort.opleiding_id)) {
      base.unshift({ _id: selectedCohort.opleiding_id, name: selectedCohort.code, raw: selectedCohort });
    }
    return base;
  }, [cohortsData, selectedCohort]);

  const previewMutation = usePreviewCoachviewCohort();
  const migrateMutation = useMigrateCoachviewCohort();

  const isReMigrate = !!batch?.coachview_cohort?.code;
  const isPreviewed = previewedCohortId === selectedCohortId && !!preview;
  const isImported = result && result.imported !== undefined;

  const handleClose = () => {
    setCohortSearch("");
    setSelectedCohort(null);
    setPreview(null);
    setPreviewedCohortId(null);
    setResult(null);
    setYearOverrides({});
    onClose();
  };

  const handleCohortChange = (value) => {
    setSelectedCohortId(value);
    const picked = cohortOptions.find((o) => o._id === value);
    if (picked) setSelectedCohort(picked.raw);
    setPreview(null);
    setPreviewedCohortId(null);
    setResult(null);
    setYearOverrides({});
  };

  const handlePreview = async () => {
    if (!selectedCohortId || !batch?._id) return;
    try {
      const response = await previewMutation.mutateAsync({
        opleidingId: selectedCohortId,
        batchId: batch._id,
      });
      const data = response?.data || null;
      setPreview(data);
      setPreviewedCohortId(selectedCohortId);
      setResult(null);
      //* Preload every importable student one year ahead of the cohort's own
      //* year — by the time an admin runs this, the academic year the cohort
      //* describes has typically already elapsed, so continuity means
      //* landing them in the *next* year, not re-running the one they were
      //* enrolled in. Stored in state (not just the input's visual default)
      //* so it's submitted even if the admin never touches the field.
      const defaults = {};
      (data?.students || []).forEach((s) => {
        if (s.importable) defaults[s.cv_id] = s.assigned_year + 1;
      });
      setYearOverrides(defaults);
    } catch {
      setPreview(null);
    }
  };

  const handleYearChange = (cvId, value) => {
    const year = parseInt(value, 10);
    setYearOverrides((prev) => ({ ...prev, [cvId]: Number.isNaN(year) ? undefined : year }));
  };

  const handleMigrate = async () => {
    if (!isPreviewed || !batch?._id) return;
    const overrides = Object.entries(yearOverrides)
      .filter(([, year]) => year !== undefined)
      .map(([cv_id, year]) => ({ cv_id, year }));

    try {
      const response = await migrateMutation.mutateAsync({
        batchId: batch._id,
        opleiding_id: selectedCohortId,
        overrides,
      });
      setResult(response?.data || null);
    } catch (err) {
      if (err?.data) setResult(err.data);
    }
  };

  const importableCount = preview?.summary?.importable ?? 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isReMigrate
              ? t("coachviewImport.retitle", "Re-sync from CoachView")
              : t("coachviewImport.title", "Migrate from CoachView")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "coachviewImport.description",
              "Pick the CoachView cohort this group corresponds to. Every student in that cohort will be enrolled here at the appropriate programme year.",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <SearchableSelect
            label={t("coachviewImport.selectCohort", "CoachView cohort")}
            placeholder={t("coachviewImport.selectCohort", "CoachView cohort")}
            items={cohortOptions}
            value={selectedCohortId}
            onChange={handleCohortChange}
            onSearch={setCohortSearch}
            isLoading={cohortsLoading}
            renderItem={(item) => (
              <span>
                {item.raw.code}
                <span className="text-muted-foreground">
                  {" "}
                  — {item.raw.location_name || t("common.na", "n/a")} · {t("coachviewImport.year", "Year")}{" "}
                  {item.raw.target_year} · {item.raw.student_count}{" "}
                  {t("coachviewImport.students", "students")}
                </span>
              </span>
            )}
          />

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={!selectedCohortId || previewMutation.isPending}
            >
              {previewMutation.isPending
                ? t("common.loading", "Loading...")
                : t("coachviewImport.preview", "Preview")}
            </Button>
          </div>

          {preview && (
            <div className="space-y-3">
              {preview.cohort.is_graduate_cohort && (
                <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded-md text-red-600 text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {t(
                    "coachviewImport.graduateWarning",
                    "This cohort's year exceeds the program's duration — these students have graduated and will not be imported.",
                  )}
                </div>
              )}

              {!preview.cohort.is_graduate_cohort && importableCount === 0 && (
                <div className="flex items-center gap-2 p-2 bg-amber-500/10 rounded-md text-amber-600 text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {t(
                    "coachviewImport.nothingToImport",
                    "Nothing to import — this cohort has no importable students. Double-check you picked the right code.",
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-green-600 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t("coachviewImport.willImport", "Will import")}: {preview.summary.importable}
                </span>
                {preview.summary.already_migrated > 0 && (
                  <span className="text-gray-500">
                    {t("coachviewImport.alreadyMigrated", "Already migrated")}: {preview.summary.already_migrated}
                  </span>
                )}
                {preview.summary.email_conflict > 0 && (
                  <span className="text-amber-600">
                    {t("coachviewImport.emailConflict", "Email conflicts")}: {preview.summary.email_conflict}
                  </span>
                )}
                {preview.summary.no_email > 0 && (
                  <span className="text-red-500">
                    {t("coachviewImport.noEmail", "No email")}: {preview.summary.no_email}
                  </span>
                )}
                {preview.summary.differs > 0 && (
                  <span className="flex items-center gap-1.5 text-amber-600">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {t("coachviewImport.yearDiffers", "Year differs from CoachView")}: {preview.summary.differs}
                  </span>
                )}
              </div>

              <div className="border rounded-md max-h-80 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("coachviewImport.table.name", "Name")}</TableHead>
                      <TableHead>{t("coachviewImport.table.email", "Email")}</TableHead>
                      <TableHead>{t("coachviewImport.table.coachview", "CoachView")}</TableHead>
                      <TableHead>{t("coachviewImport.table.year", "Year to assign")}</TableHead>
                      <TableHead>{t("coachviewImport.table.status", "Status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.students.map((s) => {
                      const status = STATUS_LABELS[s.match_status] || STATUS_LABELS.new;
                      const isSkipped = !s.importable;
                      return (
                        <TableRow key={s.cv_id} className={isSkipped ? "opacity-50" : ""}>
                          <TableCell className={isSkipped ? "line-through" : ""}>
                            {s.full_name || t("common.na", "n/a")}
                          </TableCell>
                          <TableCell>{s.email || "—"}</TableCell>
                          <TableCell>
                            {s.derived_year != null
                              ? `${t("coachviewImport.year", "Year")} ${s.derived_year} (${s.derived_outcome || "—"})`
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {s.importable ? (
                              <Input
                                type="number"
                                min={1}
                                className="w-16 h-8"
                                value={yearOverrides[s.cv_id] ?? s.assigned_year + 1}
                                onChange={(e) => handleYearChange(s.cv_id, e.target.value)}
                              />
                            ) : (
                              s.assigned_year
                            )}
                            {s.differs && (
                              <AlertTriangle className="inline-block h-3.5 w-3.5 text-amber-600 ml-1" />
                            )}
                          </TableCell>
                          <TableCell className={status.className}>{status.label}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-2 rounded-lg border p-4 text-sm">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-green-600 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  {t("coachviewImport.imported", "Imported")}: {result.imported}
                </span>
                {result.skipped > 0 && (
                  <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    {t("coachviewImport.skipped", "Skipped")}: {result.skipped}
                  </span>
                )}
              </div>
              {Array.isArray(result.errors) && result.errors.length > 0 && (
                <ul className="list-disc pl-5 space-y-1 max-h-32 overflow-y-auto text-muted-foreground">
                  {result.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <a
            href={ARCHIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t("coachviewImport.viewArchive", "View previous years in the CoachView Archive")}
          </a>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {isImported ? t("common.close", "Close") : t("common.cancel", "Cancel")}
          </Button>
          {!isImported && (
            <Button
              onClick={handleMigrate}
              disabled={!isPreviewed || importableCount === 0 || migrateMutation.isPending}
              title={!isPreviewed ? t("coachviewImport.previewRequired", "Run a preview first.") : undefined}
            >
              {migrateMutation.isPending ? (
                t("common.loading", "Loading...")
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-1.5" />
                  {t("coachviewImport.confirmMigrate", "Migrate")}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MigrateFromCoachViewDialog;
