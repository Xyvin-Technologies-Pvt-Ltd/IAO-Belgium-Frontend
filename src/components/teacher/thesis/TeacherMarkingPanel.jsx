import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  getTeacherAssessment,
  saveTeacherAssessmentDraft,
  submitTeacherAssessment,
} from "@/api/thesisApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const scoreMap = (assessment) => {
  const map = {};
  for (const row of assessment?.scores || []) {
    map[String(row.criterion_id)] = {
      marks: row.marks ?? "",
      comment: row.comment || "",
    };
  }
  return map;
};

const RoleForm = ({ thesisId, trajectoryId, userId, block, onSaved }) => {
  const { t } = useTranslation();
  const readOnly = Boolean(block.read_only);

  const initialScores = useMemo(
    () => scoreMap(block.assessment),
    [block.assessment]
  );
  const initialFeedback = block.assessment?.final_feedback || "";

  const [draftScores, setDraftScores] = useState(null);
  const [draftFeedback, setDraftFeedback] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const scores = draftScores ?? initialScores;
  const finalFeedback = draftFeedback ?? initialFeedback;

  const payload = useMemo(() => {
    const rows = [];
    for (const section of block.config?.sections || []) {
      for (const criterion of section.criteria || []) {
        const current = scores[String(criterion._id)] || {};
        rows.push({
          criterion_id: criterion._id,
          section_id: section._id,
          marks: current.marks === "" ? null : Number(current.marks),
          comment: current.comment || "",
        });
      }
    }
    return { role: block.role, scores: rows, final_feedback: finalFeedback };
  }, [block, scores, finalFeedback]);

  const draftMutation = useMutation({
    mutationFn: () =>
      saveTeacherAssessmentDraft(thesisId, trajectoryId, userId, payload),
    onSuccess: () => {
      toast.success(t("thesis.marking.draftSaved", "Draft saved successfully"));
      setDraftScores(null);
      setDraftFeedback(null);
      setValidationErrors({});
      onSaved();
    },
    onError: (error) =>
      toast.error(
        error?.message || t("thesis.marking.saveError", "Could not save draft")
      ),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      submitTeacherAssessment(thesisId, trajectoryId, userId, payload),
    onSuccess: () => {
      toast.success(
        t("thesis.marking.submitted", "Assessment submitted successfully")
      );
      setDraftScores(null);
      setDraftFeedback(null);
      setValidationErrors({});
      onSaved();
    },
    onError: (error) =>
      toast.error(
        error?.message ||
          t("thesis.marking.submitError", "Could not submit assessment")
      ),
  });

  const sectionTotal = (section) => {
    let awarded = 0;
    let max = 0;
    for (const criterion of section.criteria || []) {
      max += Number(criterion.max_score) || 0;
      const marks = scores[String(criterion._id)]?.marks;
      awarded += marks === "" || marks == null ? 0 : Number(marks) || 0;
    }
    return { awarded, max };
  };

  const liveRoleTotal = useMemo(() => {
    let awarded = 0;
    let max = 0;
    for (const section of block.config?.sections || []) {
      for (const criterion of section.criteria || []) {
        max += Number(criterion.max_score) || 0;
        const marks = scores[String(criterion._id)]?.marks;
        awarded += marks === "" || marks == null ? 0 : Number(marks) || 0;
      }
    }
    return { awarded, max };
  }, [block.config?.sections, scores]);

  const weightsEnabled = Boolean(block.config?.weights_enabled);
  const assessment = block.assessment;
  const hasUnsavedScoreEdits = draftScores != null;
  const showAsPercentage =
    weightsEnabled && !hasUnsavedScoreEdits && assessment?.percentage != null;
  const summaryValue = showAsPercentage
    ? assessment.percentage
    : hasUnsavedScoreEdits || !assessment
      ? liveRoleTotal.awarded
      : assessment.total_marks ?? liveRoleTotal.awarded;
  const summaryMax = showAsPercentage
    ? null
    : hasUnsavedScoreEdits || !assessment
      ? liveRoleTotal.max
      : assessment.max_marks ?? liveRoleTotal.max;
  const outcome = assessment?.outcome;

  const handleScoreChange = (criterionId, val) => {
    setDraftScores((prev) => {
      const current = prev ?? initialScores;
      return {
        ...current,
        [criterionId]: {
          ...current[criterionId],
          marks: val,
        },
      };
    });
    if (validationErrors[`marks_${criterionId}`]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[`marks_${criterionId}`];
        return next;
      });
    }
  };

  const handleCommentChange = (criterionId, val) => {
    setDraftScores((prev) => {
      const current = prev ?? initialScores;
      return {
        ...current,
        [criterionId]: {
          ...current[criterionId],
          comment: val,
        },
      };
    });
    if (validationErrors[`comment_${criterionId}`]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[`comment_${criterionId}`];
        return next;
      });
    }
  };

  const handleFeedbackChange = (val) => {
    setDraftFeedback(val);
    if (validationErrors.final_feedback) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next.final_feedback;
        return next;
      });
    }
  };

  const validateForSubmit = () => {
    const errors = {};
    const criteria = (block.config?.sections || []).flatMap(
      (section) => section.criteria || []
    );

    for (const criterion of criteria) {
      const cId = String(criterion._id);
      const current = scores[cId] || {};
      const marksVal = current.marks;

      // 1. Marks are mandatory for every criterion on submit
      if (marksVal === "" || marksVal == null) {
        errors[`marks_${cId}`] = t(
          "thesis.marking.scoreRequired",
          "Score is mandatory"
        );
      } else {
        const num = Number(marksVal);
        if (
          Number.isNaN(num) ||
          num < 0 ||
          num > Number(criterion.max_score)
        ) {
          errors[`marks_${cId}`] = t(
            "thesis.marking.scoreRange",
            `Must be between 0 and ${criterion.max_score}`
          );
        }
      }

      // 2. Comments are mandatory if configured as required
      if (criterion.comment_required && !current.comment?.trim()) {
        errors[`comment_${cId}`] = t(
          "thesis.marking.commentMandatoryError",
          "Comment is mandatory for this criterion"
        );
      }
    }

    // 3. Final feedback is mandatory if enabled and required
    const fb = block.config?.final_feedback;
    if (fb?.enabled && fb?.required && !finalFeedback?.trim()) {
      errors.final_feedback = t(
        "thesis.marking.finalFeedbackMandatoryError",
        "Final feedback is mandatory before submitting"
      );
    }

    return errors;
  };

  const handleSubmit = () => {
    const errors = validateForSubmit();
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error(
        t(
          "thesis.marking.validationErrorToast",
          "Please complete all mandatory scores and comments marked with * before submitting."
        )
      );
      return;
    }
    submitMutation.mutate();
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-5">
      {/* Role Assessment Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="text-base font-bold text-foreground">
            {block.role === "supervisor"
              ? t("thesis.marking.supervisorForm", "Supervisor Assessment")
              : block.role === "additional_reader"
                ? t(
                    "thesis.marking.additionalReaderForm",
                    "Additional Reader Assessment"
                  )
                : t("thesis.marking.readerForm", "Reader Assessment")}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {readOnly
              ? t(
                  "thesis.marking.submittedNotice",
                  "Assessment submitted. View-only mode."
                )
              : t(
                  "thesis.marking.evaluatorInstructions",
                  "Grade criteria scores and provide feedback. Drafts save partial work; all mandatory fields are required to submit."
                )}
          </p>
        </div>

        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border self-start sm:self-center shrink-0 ${
            readOnly
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
              : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
          }`}
        >
          {readOnly
            ? t("thesis.marking.submittedStatus", "Submitted")
            : t("thesis.marking.draftStatus", "Draft in Progress")}
        </span>
      </div>

      {/* Role total: percentage when weights on (saved), else marks/max */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg bg-muted/30 border border-border/70 items-center">
        <div className="space-y-0.5">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
            {showAsPercentage
              ? t("thesis.marking.percentage", "Percentage")
              : t("thesis.marking.totalScore", "Total Score")}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {showAsPercentage ? (
              <div className="flex items-baseline gap-0.5">
                <span className="text-xl font-bold text-foreground">
                  {summaryValue}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  %
                </span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-foreground">
                  {summaryValue ?? 0}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  / {summaryMax ?? 0}
                </span>
              </div>
            )}
            {outcome === "pass" || outcome === "fail" ? (
              <span
                className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  outcome === "pass"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                }`}
              >
                {outcome === "pass"
                  ? t("thesis.marking.pass", "Pass")
                  : t("thesis.marking.fail", "Fail")}
              </span>
            ) : null}
          </div>
        </div>
        {hasUnsavedScoreEdits && weightsEnabled ? (
          <p className="text-xs text-muted-foreground sm:border-l sm:border-border/60 sm:pl-3">
            {t(
              "thesis.marking.percentageAfterSave",
              "Weighted percentage updates after you save or submit."
            )}
          </p>
        ) : null}
      </div>

      {/* Evaluation Sections */}
      {(block.config?.sections || []).map((section, sIdx) => {
        const totals = sectionTotal(section);
        return (
          <div key={section._id || sIdx} className="space-y-3.5 pt-2">
            <div className="flex items-center justify-between pb-1 border-b border-border/60">
              <h3 className="text-sm font-bold text-foreground">
                {section.name}
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-foreground border border-border">
                {t("thesis.marking.sectionScore", "Score")}: {totals.awarded} /{" "}
                {totals.max}
              </span>
            </div>

            <div className="space-y-3">
              {section.criteria.map((criterion) => {
                const cId = String(criterion._id);
                const current = scores[cId] || { marks: "", comment: "" };
                const marksError = validationErrors[`marks_${cId}`];
                const commentError = validationErrors[`comment_${cId}`];

                return (
                  <div
                    key={criterion._id}
                    className={`rounded-lg border p-4 space-y-3 transition-colors ${
                      marksError || commentError
                        ? "border-destructive/60 bg-destructive/5"
                        : "border-border/80 bg-card hover:border-border"
                    }`}
                  >
                    {/* Criterion Title & Score Input */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground">
                            {criterion.name}
                          </p>
                        </div>

                        {criterion.guidance && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {criterion.guidance}
                          </p>
                        )}
                      </div>

                      {/* Score Input with clear mandatory indicator */}
                      <div className="w-full sm:w-36 shrink-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold flex items-center gap-1">
                            <span>{t("thesis.marking.score", "Score")}</span>
                            <span className="text-destructive font-bold">*</span>
                          </Label>
                          <span className="text-[11px] font-medium text-muted-foreground">
                            / {criterion.max_score}{" "}
                            {t("thesis.marking.pts", "pts")}
                          </span>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          max={criterion.max_score}
                          step="any"
                          disabled={readOnly}
                          value={current.marks}
                          placeholder={`0 - ${criterion.max_score}`}
                          className={`text-sm ${
                            marksError
                              ? "border-destructive focus-visible:ring-destructive"
                              : ""
                          }`}
                          onChange={(e) =>
                            handleScoreChange(cId, e.target.value)
                          }
                        />
                        {marksError && (
                          <p className="text-[11px] font-medium text-destructive mt-0.5">
                            {marksError}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Evaluator Comment Textarea */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold flex items-center gap-1">
                          <span>
                            {t(
                              "thesis.marking.criterionComment",
                              "Evaluator Comment"
                            )}
                          </span>
                          {criterion.comment_required && (
                            <span className="text-destructive font-bold">*</span>
                          )}
                        </Label>
                      </div>

                      <Textarea
                        rows={2}
                        disabled={readOnly}
                        value={current.comment}
                        placeholder={t(
                          "thesis.marking.commentPlaceholder",
                          "Comments or feedback for this criterion..."
                        )}
                        className={`text-xs sm:text-sm ${
                          commentError
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }`}
                        onChange={(e) =>
                          handleCommentChange(cId, e.target.value)
                        }
                      />
                      {commentError && (
                        <p className="text-[11px] font-medium text-destructive mt-0.5">
                          {commentError}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Final Feedback Section */}
      {block.config?.final_feedback?.enabled && (
        <div
          className={`space-y-2 p-4 sm:p-5 rounded-xl border ${
            validationErrors.final_feedback
              ? "border-destructive bg-destructive/5"
              : "border-border bg-muted/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold flex items-center gap-1">
              <span>
                {block.config.final_feedback.title ||
                  t("thesis.marking.finalFeedback", "Final Feedback")}
              </span>
              {block.config.final_feedback.required && (
                <span className="text-destructive font-bold">*</span>
              )}
            </Label>
          </div>

          {block.config.final_feedback.instructions && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {block.config.final_feedback.instructions}
            </p>
          )}

          <Textarea
            rows={3}
            disabled={readOnly}
            value={finalFeedback}
            placeholder={t(
              "thesis.marking.finalFeedbackPlaceholder",
              "Enter overall evaluation assessment and final recommendations..."
            )}
            className={`text-xs sm:text-sm ${
              validationErrors.final_feedback
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }`}
            onChange={(e) => handleFeedbackChange(e.target.value)}
          />

          {validationErrors.final_feedback && (
            <p className="text-[11px] font-medium text-destructive mt-0.5">
              {validationErrors.final_feedback}
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            disabled={draftMutation.isPending || submitMutation.isPending}
            onClick={() => draftMutation.mutate()}
            className="cursor-pointer"
          >
            {draftMutation.isPending && (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            )}
            {t("thesis.marking.saveDraft", "Save Draft")}
          </Button>

          <Button
            type="button"
            disabled={draftMutation.isPending || submitMutation.isPending}
            onClick={handleSubmit}
            className="cursor-pointer font-semibold"
          >
            {submitMutation.isPending && (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            )}
            {t("thesis.marking.submit", "Submit Final Assessment")}
          </Button>
        </div>
      )}
    </div>
  );
};

const TeacherMarkingPanel = ({ thesisId, trajectoryId, userId }) => {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: ["teacher-thesis-assessment", thesisId, trajectoryId, userId],
    queryFn: () => getTeacherAssessment(thesisId, trajectoryId, userId),
    enabled: Boolean(thesisId && trajectoryId && userId),
  });

  const roles = query.data?.data?.roles || [];

  if (query.isLoading) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-xl border border-border bg-card text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        {t("thesis.marking.loading", "Loading assessment evaluation...")}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/10 text-sm text-destructive">
        {query.error?.message ||
          t("thesis.marking.loadError", "Could not load the assessment")}
      </div>
    );
  }

  if (!roles.length) return null;

  return (
    <div className="space-y-6">
      {roles.map((block) => (
        <RoleForm
          key={block.role}
          thesisId={thesisId}
          trajectoryId={trajectoryId}
          userId={userId}
          block={block}
          onSaved={() => query.refetch()}
        />
      ))}
    </div>
  );
};

export default TeacherMarkingPanel;
