import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import moment from "moment";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  Edit3,
  RotateCcw,
  MessageSquare,
  MessageSquareQuote,
  Calculator,
  Send,
  Undo2,
  User,
  UserCheck,
  History,
  Loader2,
} from "lucide-react";
import {
  editThesisEvaluation,
  getThesisEvaluation,
  publishThesisEvaluation,
  reopenThesisEvaluation,
  withdrawThesisEvaluation,
} from "@/api/thesisApi";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DISSERTATION_CLASSES = [
  "Distinction",
  "Merit",
  "Pass (higher)",
  "Pass (lower)",
  "Compensable Fail",
  "Fail",
];

const personName = (person) => {
  if (!person) return null;
  const name = `${person.first_name || ""} ${person.last_name || ""}`.trim();
  return name || person.email || null;
};

const calculateSectionTotal = (section, scores) => {
  let awarded = 0;
  let max = 0;
  for (const criterion of section.criteria || []) {
    max += Number(criterion.max_score || 0);
    const score = (scores || []).find(
      (row) => String(row.criterion_id) === String(criterion._id)
    );
    if (
      score &&
      score.marks !== null &&
      score.marks !== undefined &&
      score.marks !== ""
    ) {
      awarded += Number(score.marks);
    }
  }
  return { awarded, max };
};

const RoleCard = ({
  role,
  block,
  canModify,
  markingScheme,
  onEdit,
  onReopen,
  busy,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const assessment = block?.assessment;
  const snapshot = assessment?.config_snapshot;
  const assessorName = personName(block?.assessor);
  const hasMarkingScheme = Boolean(markingScheme?.sections?.length);
  const canEnterMarks = canModify && !assessment;

  const hasMarks = Boolean(
    assessment &&
      Array.isArray(assessment.scores) &&
      assessment.scores.some(
        (s) => s.marks !== null && s.marks !== undefined && s.marks !== ""
      )
  );

  const sections = (snapshot?.sections || [])
    .map((section) => ({
      ...section,
      criteria: (section.criteria || []).filter(
        (criterion) =>
          !(
            (role === "reader" || role === "additional_reader") &&
            criterion.filled_by === "supervisor"
          )
      ),
    }))
    .filter((section) => section.criteria.length);

  const getStatusBadge = () => {
    if (!assessment) {
      return (
        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full border bg-muted text-muted-foreground border-border">
          {t("thesisManagement.marking.notStarted", "Not started")}
        </span>
      );
    }
    if (assessment.status === "submitted") {
      return (
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          {t("thesisManagement.marking.submitted", "Submitted")}
        </span>
      );
    }
    if (assessment.status === "draft") {
      return (
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          {t("thesisManagement.marking.draft", "Draft in progress")}
        </span>
      );
    }
    if (assessment.status === "reopened") {
      return (
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
          {t("thesisManagement.marking.reopened", "Reopened")}
        </span>
      );
    }
    return (
      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full border bg-muted text-muted-foreground border-border">
        {assessment.status}
      </span>
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4 shadow-2xs flex flex-col justify-between">
      <div className="space-y-4">
        {/* Card Header: Role & Assessor */}
        <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3.5">
          <div className="space-y-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              {role === "supervisor"
                ? t("thesisManagement.marking.supervisor", "Supervisor")
                : role === "additional_reader"
                  ? t(
                      "thesisManagement.marking.additionalReader",
                      "Additional Reader"
                    )
                  : t("thesisManagement.marking.reader", "Reader")}
            </span>
            <div className="flex items-center gap-2">
              {assessorName ? (
                <div className="flex items-center gap-2 min-w-0">
                  <UserCheck className="w-4 h-4 text-primary shrink-0" />
                  <h3 className="text-base font-semibold text-foreground truncate">
                    {assessorName}
                  </h3>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <User className="w-4 h-4 shrink-0" />
                  <span className="text-sm italic font-normal">
                    {t("thesisManagement.marking.notAssigned", "Not assigned")}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="shrink-0">{getStatusBadge()}</div>
        </div>

        {/* Empty State when no marks added */}
        {!hasMarks && !assessment ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {t("thesisManagement.marking.noMarksYet", "No marks added yet")}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                {assessorName
                  ? t(
                      "thesisManagement.marking.awaitingAssessor",
                      "Awaiting evaluation submission from {{name}}.",
                      { name: assessorName }
                    )
                  : t(
                      "thesisManagement.marking.noAssessorAssigned",
                      "No {{role}} has been assigned to evaluate this student.",
                      {
                        role:
                          role === "supervisor"
                            ? t("thesisManagement.marking.supervisor", "supervisor")
                            : role === "additional_reader"
                              ? t(
                                  "thesisManagement.marking.additionalReader",
                                  "additional reader"
                                )
                              : t("thesisManagement.marking.reader", "reader"),
                      }
                    )}
              </p>
            </div>
            {canEnterMarks ? (
              <div className="space-y-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
                  onClick={() => onEdit(role, null)}
                >
                  <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>
                    {t("thesisManagement.marking.enterMarks", "Enter marks")}
                  </span>
                </Button>
                {!hasMarkingScheme ? (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    {t(
                      "thesisManagement.marking.configureSchemeFirst",
                      "Configure a marking scheme on this thesis first."
                    )}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          /* Marks Summary Grid */
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-lg bg-muted/30 border border-border/70">
              <div className="space-y-0.5">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                  {t("thesisManagement.marking.totalScore", "Total Score")}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-foreground">
                    {assessment?.total_marks ?? 0}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    / {assessment?.max_marks ?? 0}
                  </span>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                  {t("thesisManagement.marking.percentage", "Percentage")}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold text-foreground">
                    {assessment?.percentage != null
                      ? `${assessment.percentage}%`
                      : "—"}
                  </span>
                  {assessment?.outcome ? (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        assessment.outcome === "pass"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-destructive/10 text-destructive border border-destructive/20"
                      }`}
                    >
                      {assessment.outcome}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 space-y-0.5 sm:border-l sm:border-border/60 sm:pl-3">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                  {assessment?.submitted_at
                    ? t("thesisManagement.marking.submittedAt", "Submitted")
                    : t("thesisManagement.marking.lastSaved", "Last Saved")}
                </span>
                <span className="text-xs font-medium text-foreground/80 flex items-center gap-1 mt-1">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  {assessment?.submitted_at
                    ? moment(assessment.submitted_at).format("DD/MM/YYYY")
                    : assessment?.updatedAt
                    ? moment(assessment.updatedAt).format("DD/MM/YYYY")
                    : "—"}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant={open ? "secondary" : "outline"}
                className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
                onClick={() => setOpen((value) => !value)}
              >
                {open ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
                <span>
                  {open
                    ? t("thesisManagement.marking.hideMarks", "Hide marks")
                    : t("thesisManagement.marking.viewMarks", "View marks")}
                </span>
              </Button>

              {canModify && assessment && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
                  onClick={() => onEdit(role, assessment)}
                >
                  <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>
                    {t("thesisManagement.marking.editMarks", "Edit marks")}
                  </span>
                </Button>
              )}

              {canModify && assessment?.status === "submitted" && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  className="h-8 gap-1.5 text-xs font-semibold cursor-pointer text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                  onClick={() => onReopen(role)}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t("thesisManagement.marking.reopen", "Reopen")}</span>
                </Button>
              )}
            </div>

            {/* Expanded Detailed Breakdown */}
            {open && (
              <div className="space-y-4 pt-3 border-t border-border">
                {sections.map((section) => {
                  const secTotal = calculateSectionTotal(
                    section,
                    assessment?.scores
                  );
                  return (
                    <div key={section._id} className="space-y-2">
                      {/* Section Title with Subtotal Pill */}
                      <div className="flex items-center justify-between px-3 py-1.5 rounded-md bg-muted/40 border border-border/60">
                        <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                          {section.name}
                        </span>
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          {secTotal.awarded} / {secTotal.max} pts
                        </span>
                      </div>

                      {/* Criteria Rows */}
                      <div className="divide-y divide-border/60 rounded-lg border border-border/70 overflow-hidden bg-card/60">
                        {section.criteria.map((criterion, cIdx) => {
                          const score = (assessment?.scores || []).find(
                            (row) =>
                              String(row.criterion_id) === String(criterion._id)
                          );
                          const hasMark =
                            score?.marks !== null &&
                            score?.marks !== undefined &&
                            score?.marks !== "";

                          return (
                            <div
                              key={criterion._id}
                              className="p-3.5 space-y-2 hover:bg-muted/15 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-0.5 flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-foreground leading-snug">
                                    {cIdx + 1}. {criterion.name}
                                  </p>
                                  {criterion.guidance && (
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      {criterion.guidance}
                                    </p>
                                  )}
                                </div>
                                <div className="shrink-0 text-right">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold ${
                                      hasMark
                                        ? "bg-primary/10 text-primary border border-primary/20"
                                        : "bg-muted text-muted-foreground border border-border"
                                    }`}
                                  >
                                    {hasMark
                                      ? `${score.marks} / ${criterion.max_score}`
                                      : `— / ${criterion.max_score}`}
                                  </span>
                                </div>
                              </div>

                              {/* Evaluator Comment in Structured Callout */}
                              {score?.comment ? (
                                <div className="flex items-start gap-2 p-2.5 rounded-md bg-muted/40 border border-border/50 text-xs">
                                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                                  <div className="space-y-0.5 min-w-0 flex-1">
                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                      {t(
                                        "thesisManagement.marking.comment",
                                        "Comment"
                                      )}
                                    </span>
                                    <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                      {score.comment}
                                    </p>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Final Feedback */}
                {assessment?.final_feedback ? (
                  <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider">
                      <MessageSquareQuote className="w-4 h-4" />
                      <span>
                        {snapshot?.final_feedback?.title ||
                          t(
                            "thesisManagement.marking.finalFeedback",
                            "Final Feedback"
                          )}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {assessment.final_feedback}
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ThesisEvaluationPanel = ({
  thesisId,
  trajectoryId,
  userId,
  canModify,
}) => {
  const { t } = useTranslation();
  const [editor, setEditor] = useState(null);
  const [resultDraft, setResultDraft] = useState(null);

  const query = useQuery({
    queryKey: ["thesis-evaluation", thesisId, trajectoryId, userId],
    queryFn: () => getThesisEvaluation(thesisId, trajectoryId, userId),
    enabled: Boolean(thesisId && trajectoryId && userId),
  });

  const data = query.data?.data;
  const invalidate = () => query.refetch();

  const editMutation = useMutation({
    mutationFn: () =>
      editThesisEvaluation(thesisId, trajectoryId, userId, editor.role, {
        scores: editor.scores,
        final_feedback: editor.final_feedback,
      }),
    onSuccess: () => {
      toast.success(
        editor?.isCreate
          ? t("thesisManagement.marking.marksEntered", "Marks entered")
          : t("thesisManagement.marking.marksUpdated", "Marks updated")
      );
      setEditor(null);
      invalidate();
    },
    onError: (error) => toast.error(error?.message || "Could not update marks"),
  });

  const reopenMutation = useMutation({
    mutationFn: (role) =>
      reopenThesisEvaluation(thesisId, trajectoryId, userId, role),
    onSuccess: () => {
      toast.success(
        t("thesisManagement.marking.reopened", "Assessment reopened")
      );
      invalidate();
    },
    onError: (error) => toast.error(error?.message || "Could not reopen"),
  });

  const publishMutation = useMutation({
    mutationFn: (body) =>
      publishThesisEvaluation(thesisId, trajectoryId, userId, body),
    onSuccess: () => {
      toast.success(
        t("thesisManagement.marking.sent", "Result sent to the student")
      );
      setResultDraft(null);
      invalidate();
    },
    onError: (error) =>
      toast.error(error?.message || "Could not send the result"),
  });

  const withdrawMutation = useMutation({
    mutationFn: () => withdrawThesisEvaluation(thesisId, trajectoryId, userId),
    onSuccess: () => {
      toast.success(t("thesisManagement.marking.withdrawn", "Result withdrawn"));
      invalidate();
    },
    onError: (error) =>
      toast.error(error?.message || "Could not withdraw the result"),
  });

  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-sm text-muted-foreground gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span>
          {t("thesisManagement.marking.loadingEvaluation", "Loading evaluation…")}
        </span>
      </div>
    );
  }

  if (query.error) {
    return (
      <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-sm text-destructive">
        {query.error?.message || "Could not load evaluation"}
      </div>
    );
  }

  if (!data) return null;

  const openEditor = (role, assessment) => {
    const scheme = assessment?.config_snapshot || data.marking_scheme;
    if (!scheme?.sections?.length) {
      toast.error(
        t(
          "thesisManagement.marking.noMarkingScheme",
          "No marking scheme is configured for this thesis"
        )
      );
      return;
    }

    const criteria = [];
    for (const section of scheme.sections || []) {
      for (const criterion of section.criteria || []) {
        if (
          (role === "reader" || role === "additional_reader") &&
          criterion.filled_by === "supervisor"
        ) {
          continue;
        }
        const score = (assessment?.scores || []).find(
          (row) => String(row.criterion_id) === String(criterion._id)
        );
        criteria.push({
          criterion_id: criterion._id,
          section_id: section._id,
          name: criterion.name,
          max_score: criterion.max_score,
          marks: score?.marks ?? "",
          comment: score?.comment || "",
        });
      }
    }
    setEditor({
      role,
      isCreate: !assessment,
      scores: criteria,
      final_feedback: assessment?.final_feedback || "",
      feedback_enabled: Boolean(scheme?.final_feedback?.enabled),
    });
  };

  const status = data.publication?.status || "unpublished";
  const resultLocked = !canModify || status === "published";
  const savedResult = {
    dissertation_result: data.publication?.dissertation_result ?? "",
    dissertation_class: data.publication?.dissertation_class || "",
    student_feedback: data.publication?.student_feedback || "",
  };
  const resultForm = resultDraft || savedResult;
  const updateResult = (patch) => {
    setResultDraft({ ...resultForm, ...patch });
  };

  return (
    <div className="space-y-5">
      {/* Role Cards (Supervisor, Reader, Additional Reader) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <RoleCard
          role="supervisor"
          block={data.supervisor}
          canModify={canModify}
          markingScheme={data.marking_scheme}
          busy={reopenMutation.isPending}
          onEdit={openEditor}
          onReopen={(role) => reopenMutation.mutate(role)}
        />
        <RoleCard
          role="reader"
          block={data.reader}
          canModify={canModify}
          markingScheme={data.marking_scheme}
          busy={reopenMutation.isPending}
          onEdit={openEditor}
          onReopen={(role) => reopenMutation.mutate(role)}
        />
        {data.additional_reader ? (
          <RoleCard
            role="additional_reader"
            block={data.additional_reader}
            canModify={canModify}
            markingScheme={data.marking_scheme}
            busy={reopenMutation.isPending}
            onEdit={openEditor}
            onReopen={(role) => reopenMutation.mutate(role)}
          />
        ) : null}
      </div>

      {/* Grade Summary & Publication Card */}
      <div className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary shrink-0" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              {t(
                "thesisManagement.marking.calculation",
                "Evaluation Summary & Publication"
              )}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {t("thesisManagement.marking.publicationStatus", "Publication")}:
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                status === "published"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-muted text-muted-foreground border-border"
              }`}
            >
              {status === "published"
                ? t("thesisManagement.marking.published", "Published to Student")
                : t("thesisManagement.marking.unpublished", "Unpublished (Draft)")}
            </span>
          </div>
        </div>

        <div
          className={`grid grid-cols-1 gap-3 ${
            data.additional_reader ? "sm:grid-cols-3" : "sm:grid-cols-2"
          }`}
        >
          <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              {t("thesisManagement.marking.supervisorScore", "Supervisor Total")}
            </span>
            <p className="text-lg font-bold text-foreground">
              {data.calculation?.supervisor_total != null
                ? `${data.calculation.supervisor_total} / ${data.calculation.supervisor_max}`
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.calculation?.supervisor_percentage != null
                ? `${data.calculation.supervisor_percentage}%`
                : t("common.pending", "Pending")}
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              {t("thesisManagement.marking.readerScore", "Reader Total")}
            </span>
            <p className="text-lg font-bold text-foreground">
              {data.calculation?.reader_total != null
                ? `${data.calculation.reader_total} / ${data.calculation.reader_max}`
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.calculation?.reader_percentage != null
                ? `${data.calculation.reader_percentage}%`
                : t("common.pending", "Pending")}
            </p>
          </div>

          {data.additional_reader ? (
            <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                {t(
                  "thesisManagement.marking.additionalReaderScore",
                  "Additional Reader Total"
                )}
              </span>
              <p className="text-lg font-bold text-foreground">
                {data.calculation?.additional_reader_total != null
                  ? `${data.calculation.additional_reader_total} / ${data.calculation.additional_reader_max}`
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {data.calculation?.additional_reader_percentage != null
                  ? `${data.calculation.additional_reader_percentage}%`
                  : t("common.pending", "Pending")}
              </p>
            </div>
          ) : null}
        </div>

        <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-2">
          <h4 className="text-sm font-bold text-foreground">
            {t("thesisManagement.marking.finalPercentage", "Final Percentage")}
          </h4>
          <p className="font-mono text-xs text-muted-foreground break-all">
            {data.calculation?.final_formula}
          </p>
          <p className="text-lg font-bold text-foreground">
            {data.calculation?.final_percentage != null
              ? `${data.calculation.final_percentage}%`
              : data.calculation?.final_percentage_message ||
                t(
                  "thesisManagement.marking.waitingMarks",
                  "Waiting for supervisor and reader marks"
                )}
          </p>
        </div>

        <div className="space-y-4 pt-1">
          <h4 className="text-sm font-bold text-foreground">
            {t(
              "thesisManagement.marking.dissertationResult",
              "Dissertation Result"
            )}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                {t(
                  "thesisManagement.marking.dissertationResultPercent",
                  "Dissertation Result (%)"
                )}
              </Label>
              <Input
                type="number"
                min="0"
                max="100"
                disabled={resultLocked}
                value={resultForm.dissertation_result}
                onChange={(event) =>
                  updateResult({ dissertation_result: event.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                {t("thesisManagement.marking.class", "Class")}
              </Label>
              <Select
                value={resultForm.dissertation_class || undefined}
                disabled={resultLocked}
                onValueChange={(value) =>
                  updateResult({ dissertation_class: value })
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue
                    placeholder={t(
                      "thesisManagement.marking.selectClass",
                      "Select class"
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {DISSERTATION_CLASSES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              {t(
                "thesisManagement.marking.feedbackToStudent",
                "Feedback to Student"
              )}
            </Label>
            <Textarea
              rows={4}
              disabled={resultLocked}
              value={resultForm.student_feedback}
              onChange={(event) =>
                updateResult({ student_feedback: event.target.value })
              }
            />
          </div>
        </div>

        {canModify && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
            <Button
              type="button"
              size="sm"
              disabled={publishMutation.isPending || status === "published"}
              className="h-8 gap-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              onClick={() => publishMutation.mutate(resultForm)}
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {t(
                  "thesisManagement.marking.approveAndSend",
                  "Approve and send to student"
                )}
              </span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={withdrawMutation.isPending || status !== "published"}
              className="h-8 gap-1.5 text-xs font-semibold cursor-pointer text-destructive hover:bg-destructive/10 border-destructive/30"
              onClick={() => withdrawMutation.mutate()}
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>
                {t("thesisManagement.marking.withdraw", "Withdraw result")}
              </span>
            </Button>
          </div>
        )}
      </div>

      {/* Activity Log Card */}
      <div className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-3.5 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <History className="w-4 h-4 text-primary shrink-0" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            {t("thesisManagement.marking.activity", "Evaluation activity")}
          </h3>
        </div>
        {(data.activity || []).length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            {t(
              "thesisManagement.marking.noActivity",
              "No evaluation activity yet"
            )}
          </p>
        ) : (
          <div className="space-y-2.5">
            {data.activity.map((log) => (
              <div
                key={log._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 rounded-lg border border-border/60 bg-muted/10 text-xs"
              >
                <span className="font-medium text-foreground">
                  {String(log.detail || "").replace(
                    / at \d{4}-\d{2}-\d{2}T[\d:.]+Z$/,
                    ""
                  )}
                </span>
                <span className="text-muted-foreground shrink-0">
                  {personName(log.actor) || "System"} ·{" "}
                  {moment(log.createdAt).format("DD/MM/YYYY")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Marks Dialog */}
      <Dialog
        open={Boolean(editor)}
        onOpenChange={(open) => !open && setEditor(null)}
      >
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editor?.isCreate
                ? t("thesisManagement.marking.enterMarks", "Enter marks")
                : t("thesisManagement.marking.editMarks", "Edit marks")}{" "}
              -{" "}
              {editor?.role === "supervisor"
                ? t("thesisManagement.marking.supervisor", "Supervisor")
                : editor?.role === "additional_reader"
                  ? t(
                      "thesisManagement.marking.additionalReader",
                      "Additional Reader"
                    )
                  : t("thesisManagement.marking.reader", "Reader")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5 py-2">
            {(editor?.scores || []).map((row, index) => (
              <div
                key={row.criterion_id}
                className="p-3.5 rounded-lg border border-border/80 bg-card space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {row.name}
                  </p>
                  <span className="text-xs font-medium text-muted-foreground">
                    / {row.max_score} pts
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-start">
                  <div className="sm:col-span-1 space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      {t("thesisManagement.marking.score", "Score")} *
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max={row.max_score}
                      step="any"
                      value={row.marks}
                      placeholder={`0 - ${row.max_score}`}
                      className="h-9 text-sm"
                      onChange={(event) =>
                        setEditor((current) => ({
                          ...current,
                          scores: current.scores.map((item, i) =>
                            i === index
                              ? { ...item, marks: event.target.value }
                              : item
                          ),
                        }))
                      }
                    />
                  </div>
                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      {t("thesisManagement.marking.comment", "Comment")}
                    </label>
                    <Textarea
                      rows={2}
                      value={row.comment}
                      placeholder={t(
                        "thesisManagement.marking.commentPlaceholder",
                        "Enter evaluator comment..."
                      )}
                      className="text-xs sm:text-sm"
                      onChange={(event) =>
                        setEditor((current) => ({
                          ...current,
                          scores: current.scores.map((item, i) =>
                            i === index
                              ? { ...item, comment: event.target.value }
                              : item
                          ),
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            ))}

            {editor?.feedback_enabled && (
              <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                  {t(
                    "thesisManagement.marking.finalFeedback",
                    "Final Feedback"
                  )}
                </label>
                <Textarea
                  rows={3}
                  value={editor.final_feedback}
                  placeholder={t(
                    "thesisManagement.marking.finalFeedbackPlaceholder",
                    "Enter overall assessment and feedback..."
                  )}
                  className="text-sm"
                  onChange={(event) =>
                    setEditor((current) => ({
                      ...current,
                      final_feedback: event.target.value,
                    }))
                  }
                />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditor(null)}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              type="button"
              disabled={editMutation.isPending}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              onClick={() => editMutation.mutate()}
            >
              {editMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              <span>{t("common.save", "Save Changes")}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ThesisEvaluationPanel;
