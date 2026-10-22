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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/StatusBadge";
import {
  useEvaluateYearCompletion,
  usePromoteYearCompletion,
} from "@/store/useYearCompletionStore";
import { useMarkStudentAsFailed } from "@/store/useBatchStore";
import { Loader2 } from "lucide-react";

const MetBadge = ({ met, t }) => (
  <span
    className={`text-xs font-medium px-2 py-0.5 rounded ${
      met
        ? "bg-green-100 text-green-800"
        : "bg-amber-100 text-amber-800"
    }`}
  >
    {met ? t("common.met", "Met") : t("common.notMet", "Not met")}
  </span>
);

const YearCompletionDialog = ({
  open,
  onOpenChange,
  applicationId,
  studentName,
  onDone,
}) => {
  const { t } = useTranslation();
  const evaluateMutation = useEvaluateYearCompletion();
  const promoteMutation = usePromoteYearCompletion();
  const markFailedMutation = useMarkStudentAsFailed();
  const [report, setReport] = useState(null);
  const [confirmPromote, setConfirmPromote] = useState(false);
  const [confirmFailed, setConfirmFailed] = useState(false);
  const [failReason, setFailReason] = useState("");

  useEffect(() => {
    if (!open || !applicationId) return;
    setReport(null);
    setConfirmPromote(false);
    setConfirmFailed(false);
    setFailReason("");
    evaluateMutation.mutate(applicationId, {
      onSuccess: (res) => setReport(res?.data || res),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, applicationId]);

  const busy =
    evaluateMutation.isPending ||
    promoteMutation.isPending ||
    markFailedMutation.isPending;

  const canMarkFailed =
    !!report &&
    (report.can_mark_failed === true || report.year_status === "active");

  const handlePromote = () => {
    if (!report?.met && !confirmPromote) {
      setConfirmPromote(true);
      setConfirmFailed(false);
      return;
    }
    promoteMutation.mutate(applicationId, {
      onSuccess: () => {
        onOpenChange(false);
        onDone?.();
      },
    });
  };

  const handleMarkFailedClick = () => {
    if (!confirmFailed) {
      setConfirmFailed(true);
      setConfirmPromote(false);
      return;
    }
    markFailedMutation.mutate(
      {
        applicationId,
        reason: failReason || undefined,
        force: true,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("yearCompletion.title", "Calculate year completion")}
          </DialogTitle>
          <DialogDescription>
            {studentName
              ? t("yearCompletion.forStudent", "Student: {{name}}", {
                  name: studentName,
                })
              : t(
                  "yearCompletion.description",
                  "Review ProgramConfig criteria, then promote or mark as failed. Failed students can be re-enrolled into another batch.",
                )}
          </DialogDescription>
        </DialogHeader>

        {evaluateMutation.isPending && (
          <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("yearCompletion.calculating", "Calculating...")}
          </div>
        )}

        {evaluateMutation.isError && (
          <p className="text-sm text-destructive py-4">
            {evaluateMutation.error?.message ||
              t("yearCompletion.failed", "Calculation failed")}
          </p>
        )}

        {report && (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span>
                {t("yearCompletion.year", "Year")}{" "}
                <strong>{report.current_year}</strong>
              </span>
              <StatusBadge status={report.year_status || "active"} />
              <MetBadge met={!!report.met} t={t} />
            </div>

            <section className="border rounded-md p-3 space-y-2">
              <div className="flex justify-between font-medium">
                <span>{t("yearCompletion.modules", "Modules")}</span>
                <MetBadge met={!!report.modules?.met} t={t} />
              </div>
              <p>
                {report.modules?.completed ?? 0}/{report.modules?.total ?? 0}{" "}
                {t("yearCompletion.completed", "completed")}
              </p>
              {(report.carry_forward_modules || []).length > 0 && (
                <ul className="text-muted-foreground list-disc pl-4">
                  {report.carry_forward_modules.map((m) => (
                    <li key={String(m.component_id)}>
                      {m.name} — {m.status}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="border rounded-md p-3 space-y-1">
              <div className="flex justify-between font-medium">
                <span>{t("yearCompletion.attendance", "Attendance")}</span>
                <MetBadge
                  met={
                    !!report.attendance?.overall_met &&
                    !!report.attendance?.per_module_met
                  }
                  t={t}
                />
              </div>
              {report.attendance?.skipped_online ? (
                <p className="text-muted-foreground">
                  {t("yearCompletion.onlineSkip", "Skipped for online program")}
                </p>
              ) : (
                <p>
                  {t("yearCompletion.overall", "Overall")}:{" "}
                  {Math.round(report.attendance?.overall_percentage || 0)}%
                  {" / "}
                  {report.config?.attendance?.overall_min_percentage ?? 80}%
                </p>
              )}
            </section>

            <section className="border rounded-md p-3 space-y-1">
              <div className="flex justify-between font-medium">
                <span>{t("yearCompletion.exams", "Exams")}</span>
                <MetBadge met={!!report.exams?.met} t={t} />
              </div>
              <p className="text-muted-foreground">
                {report.exams?.required
                  ? t("yearCompletion.examsRequired", "Required")
                  : t("yearCompletion.examsOptional", "Not required")}
              </p>
            </section>

            <section className="border rounded-md p-3 space-y-1">
              <div className="flex justify-between font-medium">
                <span>{t("yearCompletion.submissions", "Submissions")}</span>
                <MetBadge met={!!report.submissions?.met} t={t} />
              </div>
            </section>

            <section className="border rounded-md p-3 space-y-1">
              <div className="flex justify-between font-medium">
                <span>{t("yearCompletion.skillDays", "Skill days")}</span>
                <MetBadge met={!!report.skill_days?.met} t={t} />
              </div>
              <p className="text-muted-foreground">
                {report.skill_days?.required
                  ? t("yearCompletion.skillDaysRequired", "Required")
                  : t("yearCompletion.skillDaysOptional", "Not required")}
              </p>
            </section>

            {confirmPromote && !report.met && (
              <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                {t(
                  "yearCompletion.overrideConfirm",
                  "Some criteria are not met. Confirm you are promoting based on these criteria anyway.",
                )}
              </p>
            )}

            {confirmFailed && (
              <div className="space-y-2 border border-red-200 bg-red-50 rounded p-3">
                <p className="text-red-800">
                  {t(
                    "yearCompletion.markFailedConfirm",
                    "This marks the student as failed for the current year. They can then be re-enrolled into a different batch to repeat the year. This does not move them back a year in the same batch.",
                  )}
                </p>
                <div>
                  <Label>
                    {t(
                      "batchManagement.yearLog.markFailedReason",
                      "Reason (optional)",
                    )}
                  </Label>
                  <Textarea
                    className="mt-1"
                    rows={2}
                    value={failReason}
                    onChange={(e) => setFailReason(e.target.value)}
                    placeholder={t(
                      "batchManagement.yearLog.markFailedReasonPlaceholder",
                      "Optional reason…",
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:items-center">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleMarkFailedClick}
            disabled={busy || !canMarkFailed}
          >
            {confirmFailed
              ? t(
                  "yearCompletion.confirmMarkFailed",
                  "Confirm mark as failed",
                )
              : t("yearCompletion.markFailed", "Mark as Failed")}
          </Button>
          <Button
            onClick={handlePromote}
            disabled={busy || !report || report.year_status === "completed"}
          >
            {confirmPromote && !report?.met
              ? t("yearCompletion.confirmPromote", "Confirm promote")
              : t("yearCompletion.promote", "Promote")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default YearCompletionDialog;
