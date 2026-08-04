import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Ban, CheckCircle2, ArrowLeft } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useInfiniteCoachviewPersons,
  usePreviewCoachviewStudents,
  useAddCoachviewStudents,
} from "@/store/useCoachviewImport";
import DiscrepancyAcknowledgementDialog from "./DiscrepancyAcknowledgementDialog";

//* Recorded even when nothing needed acknowledging — a manual add always
//* leaves a reason in the audit trail (see add_students' admin_logs entry),
//* but a clean selection shouldn't force the admin through a confirmation
//* dialog just to restate that.
const DEFAULT_REASON = "Manually added from CoachView — no discrepancies found.";

//* Manual escape hatch for CoachView "back door" entries — people who never
//* landed in a cohort the API exposes and so are never picked up by
//* MigrateFromCoachViewDialog's whole-cohort import. Three steps in one
//* dialog: search individual CoachView persons, review the server's
//* per-student discrepancy findings, then (only if something needs
//* acknowledging) the shared questionnaire before committing.
const AddStudentsFromCoachViewDialog = ({ open, onClose, batch }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState("search"); // "search" | "review"
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [selected, setSelected] = useState(new Map()); // cv_id -> person row
  const [preview, setPreview] = useState(null);
  const [yearOverrides, setYearOverrides] = useState({});
  const [ackOpen, setAckOpen] = useState(false);
  const [result, setResult] = useState(null);

  const {
    data: personsPages,
    isLoading: personsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteCoachviewPersons(
    { search: debouncedSearch, batch_id: batch?._id },
    { enabled: open && step === "search" && !!batch?._id },
  );

  const persons = useMemo(() => {
    const rows = [];
    for (const page of personsPages?.pages || []) {
      for (const p of page?.data || []) rows.push(p);
    }
    return rows;
  }, [personsPages]);

  const previewMutation = usePreviewCoachviewStudents();
  const addMutation = useAddCoachviewStudents();

  const isImported = result && result.imported !== undefined;

  const handleClose = () => {
    setStep("search");
    setSearch("");
    setSelected(new Map());
    setPreview(null);
    setYearOverrides({});
    setAckOpen(false);
    setResult(null);
    onClose();
  };

  const toggleSelect = (person, checked) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (checked) next.set(person.cv_id, person);
      else next.delete(person.cv_id);
      return next;
    });
  };

  const handleReview = async () => {
    if (selected.size === 0 || !batch?._id) return;
    try {
      const response = await previewMutation.mutateAsync({
        batchId: batch._id,
        cvIds: [...selected.keys()],
      });
      const data = response?.data || null;
      setPreview(data);
      //* Default one year ahead of the CoachView-derived placement — same
      //* reasoning as MigrateFromCoachViewDialog: by the time an admin runs
      //* this, the academic year CoachView recorded has typically already
      //* elapsed, so continuity means landing them in the *next* year, not
      //* re-running the one they were placed in. Still editable per row, and
      //* the server clamps to the programme's duration on commit either way.
      const defaults = {};
      (data?.students || []).forEach((s) => {
        defaults[s.cv_id] = s.suggested_year + 1;
      });
      setYearOverrides(defaults);
      setStep("review");
    } catch {
      setPreview(null);
    }
  };

  const handleYearChange = (cvId, value) => {
    const year = parseInt(value, 10);
    setYearOverrides((prev) => ({ ...prev, [cvId]: Number.isNaN(year) ? undefined : year }));
  };

  const students = preview?.students || [];
  const hasBlocking = students.some((s) => s.discrepancies.some((d) => d.blocking));
  const hasAnyDiscrepancy = students.some((s) => s.discrepancies.length > 0);

  const submit = async (reason, acknowledgedByGroup = {}) => {
    if (!batch?._id || !preview) return;
    const payload = students.map((s) => ({
      cv_id: s.cv_id,
      year: yearOverrides[s.cv_id] ?? s.suggested_year + 1,
      acknowledgements: acknowledgedByGroup[s.cv_id] || [],
    }));
    try {
      const response = await addMutation.mutateAsync({
        batchId: batch._id,
        students: payload,
        reason,
      });
      setResult(response?.data || null);
      setAckOpen(false);
    } catch (err) {
      if (err?.data) setResult(err.data);
    }
  };

  const handleConfirmClick = () => {
    if (hasBlocking) return;
    if (!hasAnyDiscrepancy) {
      submit(DEFAULT_REASON, {});
    } else {
      setAckOpen(true);
    }
  };

  const ackGroups = students
    .filter((s) => s.discrepancies.length > 0)
    .map((s) => ({
      key: s.cv_id,
      label: s.full_name || s.cv_id,
      subtitle: s.email || undefined,
      blockingItems: s.discrepancies.filter((d) => d.blocking),
      items: s.discrepancies.filter((d) => !d.blocking),
    }));

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("addStudents.title", "Add students from CoachView")}</DialogTitle>
          <DialogDescription>
            {t(
              "addStudents.description",
              "For students who reached CoachView through a route the API doesn't expose as a cohort. Search for the person directly and add them to this group.",
            )}
          </DialogDescription>
        </DialogHeader>

        {step === "search" && !isImported && (
          <div className="space-y-4">
            <Input
              placeholder={t("addStudents.searchPlaceholder", "Search by name or email...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="border rounded-md max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>{t("coachviewImport.table.name", "Name")}</TableHead>
                    <TableHead>{t("coachviewImport.table.email", "Email")}</TableHead>
                    <TableHead>{t("addStudents.table.placement", "Placement")}</TableHead>
                    <TableHead>{t("addStudents.table.status", "Status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {personsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center p-6">
                        {t("common.loading", "Loading...")}
                      </TableCell>
                    </TableRow>
                  ) : persons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center p-6 text-muted-foreground">
                        {t("addStudents.noResults", "No matches.")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    persons.map((p) => (
                      <TableRow
                        key={p.cv_id}
                        className="cursor-pointer"
                        onClick={() => toggleSelect(p, !selected.has(p.cv_id))}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selected.has(p.cv_id)}
                            onCheckedChange={(checked) => toggleSelect(p, !!checked)}
                          />
                        </TableCell>
                        <TableCell>{p.full_name || t("common.na", "n/a")}</TableCell>
                        <TableCell>{p.email || "—"}</TableCell>
                        <TableCell>
                          {p.placement_program_code
                            ? `${p.placement_program_code} · ${t("coachviewImport.year", "Year")} ${
                                p.placement_year ?? "—"
                              }`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {p.already_in_this_batch && (
                              <span className="text-xs text-gray-500">
                                {t("addStudents.alreadyInGroup", "Already in this group")}
                              </span>
                            )}
                            {p.already_in_lms && !p.already_in_this_batch && (
                              <span className="text-xs text-blue-600">
                                {t("addStudents.alreadyInLms", "Already in LMS")}
                              </span>
                            )}
                            {p.inactief && (
                              <span className="text-xs text-amber-600">
                                {t("addStudents.inactive", "Inactive in CoachView")}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {hasNextPage && (
                <div className="flex justify-center p-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? t("common.loading", "Loading...") : t("common.loadMore", "Load more")}
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("addStudents.selectedCount", "{{count}} selected", { count: selected.size })}
              </span>
              <Button onClick={handleReview} disabled={selected.size === 0 || previewMutation.isPending}>
                {previewMutation.isPending
                  ? t("common.loading", "Loading...")
                  : t("addStudents.review", "Review selection")}
              </Button>
            </div>
          </div>
        )}

        {step === "review" && preview && !isImported && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setStep("search")} className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" /> {t("common.back", "Back")}
            </Button>

            <div className="border rounded-md max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("coachviewImport.table.name", "Name")}</TableHead>
                    <TableHead>{t("coachviewImport.table.email", "Email")}</TableHead>
                    <TableHead>{t("coachviewImport.table.year", "Year to assign")}</TableHead>
                    <TableHead>{t("addStudents.table.findings", "Findings")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => {
                    const blocking = s.discrepancies.filter((d) => d.blocking);
                    const warnings = s.discrepancies.filter((d) => !d.blocking);
                    return (
                      <TableRow key={s.cv_id}>
                        <TableCell>{s.full_name || t("common.na", "n/a")}</TableCell>
                        <TableCell>{s.email || "—"}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            className="w-16 h-8"
                            value={yearOverrides[s.cv_id] ?? s.suggested_year + 1}
                            onChange={(e) => handleYearChange(s.cv_id, e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          {blocking.length === 0 && warnings.length === 0 ? (
                            <span className="flex items-center gap-1.5 text-green-600 text-xs">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {t("addStudents.noFindings", "No issues")}
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              {blocking.map((d) => (
                                <span key={d.code} className="flex items-center gap-1.5 text-red-600 text-xs">
                                  <Ban className="h-3.5 w-3.5 shrink-0" />
                                  {d.message}
                                </span>
                              ))}
                              {warnings.map((d) => (
                                <span key={d.code} className="flex items-center gap-1.5 text-amber-600 text-xs">
                                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                  {d.message}
                                </span>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {hasBlocking && (
              <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded-md text-red-600 text-xs">
                <Ban className="h-4 w-4 shrink-0" />
                {t(
                  "addStudents.blockingWarning",
                  "One or more selected students has a blocking issue. Go back and deselect them before continuing.",
                )}
              </div>
            )}
          </div>
        )}

        {isImported && (
          <div className="space-y-2 rounded-lg border p-4 text-sm">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-green-600 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                {t("coachviewImport.imported", "Imported")}: {result.imported}
              </span>
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

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {isImported ? t("common.close", "Close") : t("common.cancel", "Cancel")}
          </Button>
          {step === "review" && !isImported && (
            <Button onClick={handleConfirmClick} disabled={hasBlocking || addMutation.isPending}>
              {addMutation.isPending ? t("common.loading", "Loading...") : t("addStudents.confirmAdd", "Add students")}
            </Button>
          )}
        </DialogFooter>

        <DiscrepancyAcknowledgementDialog
          open={ackOpen}
          onClose={() => setAckOpen(false)}
          title={t("addStudents.ackTitle", "Confirm before adding")}
          description={t(
            "addStudents.ackDescription",
            "Review and acknowledge every finding, then confirm.",
          )}
          groups={ackGroups}
          onConfirm={(reason, acknowledgedByGroup) => submit(reason, acknowledgedByGroup)}
          isSubmitting={addMutation.isPending}
          confirmLabel={t("addStudents.confirmAdd", "Add students")}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddStudentsFromCoachViewDialog;
