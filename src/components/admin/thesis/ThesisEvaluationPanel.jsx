import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  updateOralDefenceResult,
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

const OutcomeBadge = ({ outcome, t }) => {
  if (outcome !== "pass" && outcome !== "fail") return null;
  const isPass = outcome === "pass";
  return (
    <span
      className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
        isPass
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
          : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
      }`}
    >
      {isPass
        ? t("thesisManagement.marking.pass", "Pass")
        : t("thesisManagement.marking.fail", "Fail")}
    </span>
  );
};

const outcomeFromPercentage = (percentage, passPercentage) => {
  if (percentage == null || passPercentage == null) return null;
  return Number(percentage) >= Number(passPercentage) ? "pass" : "fail";
};

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
  const assessorName = personName(block?.assessor);
  const hasMarkingScheme = Boolean(markingScheme?.sections?.length);
  const canEnterMarks = canModify && !assessment;
  const showAsPercentage = Boolean(markingScheme?.weights_enabled);

  const hasMarks = Boolean(
    assessment &&
      Array.isArray(assessment.scores) &&
      assessment.scores.some(
        (s) => s.marks !== null && s.marks !== undefined && s.marks !== ""
      )
  );

  const sections = (markingScheme?.sections || [])
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
    <div className="bg-card border border-border rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between h-full space-y-4">
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
                <div className="flex items-center gap-1.5 min-w-0">
                  <UserCheck className="w-4 h-4 text-primary shrink-0" />
                  <h3
                    className="text-sm sm:text-base font-semibold text-foreground truncate"
                    title={assessorName}
                  >
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

        {/* Middle: Score box or Compact Status box */}
        {hasMarks ? (
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg bg-muted/30 border border-border/70 min-h-[74px] items-center">
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                {showAsPercentage
                  ? t("thesisManagement.marking.percentage", "Percentage")
                  : t("thesisManagement.marking.totalScore", "Total Score")}
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {showAsPercentage ? (
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-xl font-bold text-foreground">
                      {assessment?.percentage != null
                        ? assessment.percentage
                        : "—"}
                    </span>
                    {assessment?.percentage != null ? (
                      <span className="text-xs text-muted-foreground font-medium">
                        %
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-foreground">
                      {assessment?.total_marks ?? 0}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      / {assessment?.max_marks ?? 0}
                    </span>
                  </div>
                )}
                <OutcomeBadge outcome={assessment?.outcome} t={t} />
              </div>
            </div>

            <div className="space-y-0.5 border-l border-border/60 pl-3">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                {assessment?.submitted_at
                  ? t("thesisManagement.marking.submittedAt", "Submitted")
                  : t("thesisManagement.marking.lastSaved", "Last Saved")}
              </span>
              <span className="text-xs font-medium text-foreground/80 flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {assessment?.submitted_at
                  ? moment(assessment.submitted_at).format("DD/MM/YYYY")
                  : assessment?.updatedAt
                  ? moment(assessment.updatedAt).format("DD/MM/YYYY")
                  : "—"}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-lg bg-muted/25 border border-border/70 min-h-[74px] flex flex-col justify-center space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                {showAsPercentage
                  ? t("thesisManagement.marking.percentage", "Percentage")
                  : t("thesisManagement.marking.totalScore", "Total Score")}
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                <Clock className="w-3 h-3 text-muted-foreground/70" />
                {t("thesisManagement.marking.pendingSubmission", "Pending")}
              </span>
            </div>
            <p className="text-xs text-foreground/80 font-medium leading-snug">
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
        )}
      </div>

      {/* Action Buttons Row */}
      <div className="pt-2 mt-auto border-t border-border/40">
        <div className="flex flex-wrap items-center gap-2">
          {hasMarks && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className={`h-8 gap-1.5 text-xs font-semibold cursor-pointer border transition-all ${
                open
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "border-border bg-card hover:bg-muted text-foreground"
              }`}
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
          )}

          {canModify && assessment && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-8 gap-1.5 text-xs font-semibold cursor-pointer border border-border bg-card hover:border-primary/40 hover:text-primary text-foreground transition-all"
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
              variant="secondary"
              disabled={busy}
              className="h-8 gap-1.5 text-xs font-semibold cursor-pointer text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-all"
              onClick={() => onReopen(role)}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t("thesisManagement.marking.reopen", "Reopen")}</span>
            </Button>
          )}

          {canEnterMarks && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-8 gap-1.5 text-xs font-semibold cursor-pointer border border-border bg-card hover:border-primary/40 hover:text-primary text-foreground transition-all"
              onClick={() => onEdit(role, null)}
            >
              <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
              <span>
                {t("thesisManagement.marking.enterMarks", "Enter marks")}
              </span>
            </Button>
          )}
        </div>

        {canEnterMarks && !hasMarkingScheme && (
          <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1.5">
            {t(
              "thesisManagement.marking.configureSchemeFirst",
              "Configure a marking scheme on this thesis first."
            )}
          </p>
        )}
      </div>

      {/* Expanded Detailed Breakdown */}
      {open && hasMarks && (
        <div className="space-y-3.5 pt-3 border-t border-border/70 mt-3">
          {sections.map((section) => {
            const secTotal = calculateSectionTotal(
              section,
              assessment?.scores
            );
            return (
              <div key={section._id} className="space-y-2">
                {/* Section Header with score pill */}
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-muted/40 border border-border/60">
                  <span className="text-[11px] font-bold text-foreground uppercase tracking-wider truncate mr-2">
                    {section.name}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground shrink-0">
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
                        className="p-3 space-y-1.5 hover:bg-muted/15 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-foreground leading-snug">
                              {cIdx + 1}. {criterion.name}
                            </p>
                            {criterion.guidance && (
                              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                                {criterion.guidance}
                              </p>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
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
                          <div className="flex items-start gap-1.5 p-2 rounded-md bg-muted/40 border border-border/50 text-xs mt-1">
                            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                {t(
                                  "thesisManagement.marking.comment",
                                  "Comment"
                                )}
                              </span>
                              <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-xs">
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
            <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider">
                <MessageSquareQuote className="w-4 h-4 shrink-0" />
                <span>
                  {markingScheme?.final_feedback?.title ||
                    t(
                      "thesisManagement.marking.finalFeedback",
                      "Final Feedback"
                    )}
                </span>
              </div>
              <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {assessment.final_feedback}
              </p>
            </div>
          ) : null}
        </div>
      )}
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
  const queryClient = useQueryClient();
  const [editor, setEditor] = useState(null);
  const [resultDraft, setResultDraft] = useState(null);
  const [oralDraft, setOralDraft] = useState(null);

  const query = useQuery({
    queryKey: ["thesis-evaluation", thesisId, trajectoryId, userId],
    queryFn: () => getThesisEvaluation(thesisId, trajectoryId, userId),
    enabled: Boolean(thesisId && trajectoryId && userId),
  });

  const data = query.data?.data;
  const invalidate = () => {
    query.refetch();
    queryClient.invalidateQueries({
      queryKey: [
        "thesis-trajectory-student-detail",
        thesisId,
        trajectoryId,
        userId,
      ],
    });
  };

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

  const oralResultMutation = useMutation({
    mutationFn: (body) =>
      updateOralDefenceResult(
        thesisId,
        trajectoryId,
        userId,
        body.step_id,
        {
          oral_defence_result: body.oral_defence_result,
          oral_defence_class: body.oral_defence_class,
          oral_defence_feedback: body.oral_defence_feedback,
        }
      ),
    onSuccess: () => {
      toast.success(
        t("thesis.oralDefence.resultSaved", "Oral defence result saved")
      );
      setOralDraft(null);
      invalidate();
    },
    onError: (error) =>
      toast.error(error?.message || "Could not save oral defence result"),
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
    const scheme = data.marking_scheme;
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
          comment_required: Boolean(criterion.comment_required),
        });
      }
    }
    setEditor({
      role,
      isCreate: !assessment,
      scores: criteria,
      final_feedback: assessment?.final_feedback || "",
      feedback_enabled: Boolean(scheme?.final_feedback?.enabled),
      feedback_required: Boolean(scheme?.final_feedback?.required),
      feedback_title: scheme?.final_feedback?.title || "",
    });
  };

  const status = data.publication?.status || "unpublished";
  const resultLocked = !canModify || status === "published";
  const showAsPercentage = Boolean(data.marking_scheme?.weights_enabled);
  const showAdditionalReader = Boolean(data.additional_reader?.assignment);
  const passPercentage =
    data.pass_percentage ?? data.calculation?.pass_percentage ?? null;
  const finalOutcome = outcomeFromPercentage(
    data.calculation?.final_percentage,
    passPercentage
  );
  const formatRoleSummary = (total, max, percentage) => {
    if (showAsPercentage) {
      return percentage != null ? `${percentage}%` : "—";
    }
    return total != null ? `${total} / ${max}` : "—";
  };
  const savedResult = {
    dissertation_result: data.publication?.dissertation_result ?? "",
    dissertation_class: data.publication?.dissertation_class || "",
    student_feedback: data.publication?.student_feedback || "",
  };
  const resultForm = resultDraft || savedResult;
  const updateResult = (patch) => {
    setResultDraft({ ...resultForm, ...patch });
  };

  const oral = data.oral_defence;
  const savedOral = {
    result: oral?.result != null ? String(oral.result) : "",
    class: oral?.class || "",
    feedback: oral?.feedback || "",
  };
  const oralForm = oralDraft || savedOral;
  const updateOral = (patch) => {
    setOralDraft({ ...oralForm, ...patch });
  };
  const oralLocked = !canModify || !oral?.unlocked;

  const handleSaveOralResult = () => {
    if (!oral?.step_id) return;
    const resultNum = Number(oralForm.result);
    if (
      Number.isNaN(resultNum) ||
      resultNum < 0 ||
      resultNum > 100 ||
      !oralForm.class
    ) {
      toast.error(
        t(
          "thesis.oralDefence.resultValidation",
          "Enter a result between 0 and 100 and select a class"
        )
      );
      return;
    }
    oralResultMutation.mutate({
      step_id: oral.step_id,
      oral_defence_result: resultNum,
      oral_defence_class: oralForm.class,
      oral_defence_feedback: oralForm.feedback || "",
    });
  };

  return (
    <div className="space-y-5">
      {/* Role Cards (Supervisor, Reader, Additional Reader) */}
      <div
        className={`grid grid-cols-1 gap-5 items-stretch ${
          showAdditionalReader
            ? "lg:grid-cols-3 md:grid-cols-2"
            : "lg:grid-cols-2"
        }`}
      >
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
        {showAdditionalReader ? (
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
            showAdditionalReader ? "sm:grid-cols-3" : "sm:grid-cols-2"
          }`}
        >
          <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              {showAsPercentage
                ? t(
                    "thesisManagement.marking.supervisorPercentage",
                    "Supervisor Percentage"
                  )
                : t("thesisManagement.marking.supervisorScore", "Supervisor Total")}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-lg font-bold text-foreground">
                {formatRoleSummary(
                  data.calculation?.supervisor_total,
                  data.calculation?.supervisor_max,
                  data.calculation?.supervisor_percentage
                )}
              </p>
              <OutcomeBadge
                outcome={data.supervisor?.assessment?.outcome}
                t={t}
              />
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              {showAsPercentage
                ? t(
                    "thesisManagement.marking.readerPercentage",
                    "Reader Percentage"
                  )
                : t("thesisManagement.marking.readerScore", "Reader Total")}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-lg font-bold text-foreground">
                {formatRoleSummary(
                  data.calculation?.reader_total,
                  data.calculation?.reader_max,
                  data.calculation?.reader_percentage
                )}
              </p>
              <OutcomeBadge
                outcome={data.reader?.assessment?.outcome}
                t={t}
              />
            </div>
          </div>

          {showAdditionalReader ? (
            <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                {showAsPercentage
                  ? t(
                      "thesisManagement.marking.additionalReaderPercentage",
                      "Additional Reader Percentage"
                    )
                  : t(
                      "thesisManagement.marking.additionalReaderScore",
                      "Additional Reader Total"
                    )}
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-lg font-bold text-foreground">
                  {formatRoleSummary(
                    data.calculation?.additional_reader_total,
                    data.calculation?.additional_reader_max,
                    data.calculation?.additional_reader_percentage
                  )}
                </p>
                <OutcomeBadge
                  outcome={data.additional_reader?.assessment?.outcome}
                  t={t}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="p-5 rounded-lg border border-primary/20 bg-primary/[0.04] space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-foreground">
              {t("thesisManagement.marking.finalPercentage", "Final Percentage")}
            </h4>
            {passPercentage != null ? (
              <span className="text-[11px] font-medium text-muted-foreground">
                {t("thesisManagement.marking.passPercentage", "Pass percentage")}:{" "}
                {passPercentage}%
              </span>
            ) : null}
          </div>
          <p className="font-mono text-xs text-muted-foreground break-all">
            {data.calculation?.final_formula}
          </p>
          {data.calculation?.final_percentage != null ? (
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                {data.calculation.final_percentage}%
              </p>
              <OutcomeBadge outcome={finalOutcome} t={t} />
            </div>
          ) : (
            <p className="text-sm font-medium text-muted-foreground">
              {data.calculation?.final_percentage_message ||
                t(
                  "thesisManagement.marking.waitingMarks",
                  "Waiting for supervisor and reader marks"
                )}
            </p>
          )}
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

      {oral ? (
        <div className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
            <div className="space-y-1 min-w-0">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                {t("thesis.oralDefence.result", "Oral Defence Result")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {oral.step_name ||
                  t("thesis.types.oralDefence", "Oral Defence")}
              </p>
            </div>
            {!oral.unlocked ? (
              <span className="shrink-0 text-[11px] font-semibold px-2 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                {t("thesis.oralDefence.lockedBadge", "Locked")}
              </span>
            ) : oral.recorded_at ? (
              <span className="shrink-0 text-[11px] font-semibold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                {t("thesis.oralDefence.recordedBadge", "Recorded")}
              </span>
            ) : null}
          </div>

          {!oral.unlocked ? (
            <p className="text-sm text-muted-foreground">
              {t(
                "thesis.oralDefence.lockedNotice",
                "Oral defence unlocks after the dissertation result is published and the student has passed (pass percentage)."
              )}
            </p>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                {t("thesis.oralDefence.resultPercent", "Result (%)")}
              </Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                disabled={oralLocked}
                value={oralForm.result}
                onChange={(event) =>
                  updateOral({ result: event.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                {t("thesis.oralDefence.resultClass", "Class")}
              </Label>
              <Select
                value={oralForm.class || undefined}
                disabled={oralLocked}
                onValueChange={(value) => updateOral({ class: value })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue
                    placeholder={t(
                      "thesis.oralDefence.selectClass",
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
              {t("thesis.oralDefence.feedback", "Feedback (optional)")}
            </Label>
            <Textarea
              rows={3}
              disabled={oralLocked}
              value={oralForm.feedback}
              onChange={(event) =>
                updateOral({ feedback: event.target.value })
              }
            />
          </div>

          {canModify ? (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
              <Button
                type="button"
                size="sm"
                disabled={
                  oralLocked ||
                  oralResultMutation.isPending ||
                  !oralForm.class ||
                  oralForm.result === ""
                }
                className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
                onClick={handleSaveOralResult}
              >
                {oralResultMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                <span>
                  {t(
                    "thesis.oralDefence.saveResult",
                    "Save oral result"
                  )}
                </span>
              </Button>
              {oral.recorded_at ? (
                <span className="text-xs text-muted-foreground">
                  {t("thesis.oralDefence.lastRecorded", "Last recorded")}{" "}
                  {moment(oral.recorded_at).format("DD/MM/YYYY HH:mm")}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

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
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <span>{t("thesisManagement.marking.score", "Score")}</span>
                      <span className="text-destructive font-bold">*</span>
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
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <span>
                        {t("thesisManagement.marking.comment", "Comment")}
                      </span>
                      {row.comment_required ? (
                        <span className="text-destructive font-bold">*</span>
                      ) : null}
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
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1">
                  <span>
                    {editor.feedback_title ||
                      t(
                        "thesisManagement.marking.finalFeedback",
                        "Final Feedback"
                      )}
                  </span>
                  {editor.feedback_required ? (
                    <span className="text-destructive font-bold">*</span>
                  ) : null}
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
