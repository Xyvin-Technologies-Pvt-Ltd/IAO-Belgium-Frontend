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
import StatusBadge from "@/components/StatusBadge";
import {
  useDemoteYearCompletion,
  useEvaluateYearCompletion,
  usePromoteYearCompletion,
} from "@/store/useYearCompletionStore";
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
  const demoteMutation = useDemoteYearCompletion();
  const [report, setReport] = useState(null);
  const [confirmPromote, setConfirmPromote] = useState(false);

  useEffect(() => {
    if (!open || !applicationId) return;
    setReport(null);
    setConfirmPromote(false);
    evaluateMutation.mutate(applicationId, {
      onSuccess: (res) => setReport(res?.data || res),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, applicationId]);

  const busy =
    evaluateMutation.isPending ||
    promoteMutation.isPending ||
    demoteMutation.isPending;

  const handlePromote = () => {
    if (!report?.met && !confirmPromote) {
      setConfirmPromote(true);
      return;
    }
    promoteMutation.mutate(applicationId, {
      onSuccess: () => {
        onOpenChange(false);
        onDone?.();
      },
    });
  };

  const handleDemote = () => {
    demoteMutation.mutate(applicationId, {
      onSuccess: () => {
        onOpenChange(false);
        onDone?.();
      },
    });
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
                  "Review ProgramConfig criteria, then promote or demote.",
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
            variant="secondary"
            onClick={handleDemote}
            disabled={busy || !report?.can_demote}
          >
            {t("yearCompletion.demote", "Demote")}
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
