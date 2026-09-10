import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "@tanstack/react-router";
import { Save } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useGetStudentPracticalDetailAdmin,
  useSetStudentPracticalScoreAdmin,
} from "@/store/useExamStore";
import { LoadingState, ErrorMessage } from "@/components/common";
import { useBreadcrumb } from "@/context/BreadCrumbContext";

const isValidScore = (score) => {
  if (score === "" || score === null || score === undefined) return false;
  const n = Number(score);
  return Number.isFinite(n) && n >= 0;
};

const formatPassingRule = (exam, t) => {
  if (!exam) return null;
  const type = exam.passing_type || "percentage";
  if (type === "marks") {
    return t(
      "exam.results.passingRuleMarks",
      "Passing type: marks · Threshold: {{value}}",
      { value: exam.passing_marks ?? "—" },
    );
  }
  return t(
    "exam.results.passingRulePercentage",
    "Passing type: percentage · Threshold: {{value}}%",
    { value: exam.passing_percentage ?? 50 },
  );
};

const PracticalResultDetailsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { updateBreadcrumbs } = useBreadcrumb();
  const { plannedId, applicationId } = useParams({ strict: false });

  const {
    data: detailData,
    isLoading,
    error,
    refetch,
  } = useGetStudentPracticalDetailAdmin(plannedId, applicationId, {
    enabled: !!plannedId && !!applicationId,
  });

  const saveMutation = useSetStudentPracticalScoreAdmin();
  const [adminScore, setAdminScore] = useState("");
  const [adminFeedback, setAdminFeedback] = useState("");
  const [adminResult, setAdminResult] = useState("");
  const [resitAdminScore, setResitAdminScore] = useState("");
  const [resitAdminFeedback, setResitAdminFeedback] = useState("");
  const [resitAdminResult, setResitAdminResult] = useState("");

  const details = detailData?.data;

  useEffect(() => {
    if (details?.student) {
      updateBreadcrumbs([
        {
          label: t("resultsManagement.title", "Results"),
          path: "/admin/results?tab=practical",
          navigable: true,
        },
        {
          label: `${details.student.first_name} ${details.student.last_name}`,
          path: `/admin/results/practical/${plannedId}/student/${applicationId}`,
          navigable: false,
        },
      ]);
    }
    return () => updateBreadcrumbs([]);
  }, [details, plannedId, applicationId, updateBreadcrumbs, t]);

  useEffect(() => {
    if (details?.admin_result) {
      setAdminScore(details.admin_result.score);
      setAdminFeedback(details.admin_result.feedback || "");
      setAdminResult(details.admin_result.result || "");
    } else {
      setAdminScore("");
      setAdminFeedback("");
      setAdminResult("");
    }
    if (details?.resit?.admin_result) {
      setResitAdminScore(details.resit.admin_result.score);
      setResitAdminFeedback(details.resit.admin_result.feedback || "");
      setResitAdminResult(details.resit.admin_result.result || "");
    } else {
      setResitAdminScore("");
      setResitAdminFeedback("");
      setResitAdminResult("");
    }
  }, [details]);

  const scoreValid = isValidScore(adminScore);
  const scoreError =
    adminScore !== "" && !scoreValid
      ? t(
          "exam.results.scoreNonNegativeError",
          "Final grade must be a number greater than or equal to 0",
        )
      : null;
  const canSave =
    scoreValid && ["pass", "fail"].includes(adminResult) && !saveMutation.isPending;

  const resitScoreValid = isValidScore(resitAdminScore);
  const resitScoreError =
    resitAdminScore !== "" && !resitScoreValid
      ? t(
          "exam.results.scoreNonNegativeError",
          "Final grade must be a number greater than or equal to 0",
        )
      : null;
  const canSaveResit =
    resitScoreValid &&
    ["pass", "fail"].includes(resitAdminResult) &&
    !saveMutation.isPending;

  const handleSave = () => {
    if (!canSave) return;
    saveMutation.mutate(
      {
        plannedId,
        applicationId,
        score: Number(adminScore),
        feedback: adminFeedback,
        result: adminResult,
      },
      {
        onSuccess: () => {
          navigate({ to: "/admin/results", search: { tab: "practical" } });
        },
      },
    );
  };

  const handleSaveResit = () => {
    if (!canSaveResit) return;
    const resitPlannedId = details?.resit?.planned_practical_exam?._id;
    if (!resitPlannedId) return;
    saveMutation.mutate({
      plannedId: resitPlannedId,
      applicationId,
      score: Number(resitAdminScore),
      feedback: resitAdminFeedback,
      result: resitAdminResult,
    });
  };

  const renderResultForm = ({
    scoreId,
    feedbackId,
    resultId,
    score,
    setScore,
    feedback,
    setFeedback,
    result,
    setResult,
    scoreErr,
    onSave,
    saveEnabled,
    title,
    exam,
  }) => {
    const instructions = exam?.feedback_instructions || "";
    const hasInstructions =
      instructions &&
      instructions !== "<p></p>" &&
      instructions.replace(/<[^>]*>/g, "").trim() !== "";
    const passingRule = formatPassingRule(exam, t);

    return (
      <Card className="border border-sidebar-border bg-sidebar">
        <CardHeader className="py-4 border-b border-sidebar-border bg-muted/10">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {passingRule && (
            <div className="p-3 bg-muted/20 text-sm rounded-lg border border-sidebar-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                {t("exam.results.passingRule", "Passing rule")}
              </p>
              <p className="font-medium text-dashboard-text dark:text-white">
                {passingRule}
              </p>
            </div>
          )}

          {hasInstructions && (
            <div className="p-3 bg-muted/10 rounded-lg border border-sidebar-border space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t(
                  "exam.feedback.instructionsTitle",
                  "Feedback instructions",
                )}
              </p>
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-sm [&_a]:text-[#ff8904] [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: instructions }}
                onClick={(e) => {
                  const anchor = e.target.closest("a");
                  if (anchor?.href) {
                    e.preventDefault();
                    window.open(anchor.href, "_blank", "noopener,noreferrer");
                  }
                }}
              />
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={scoreId} className="text-sm font-medium">
                {t("exam.results.finalGrade", "Final grade")}
              </Label>
              <Input
                id={scoreId}
                type="number"
                min={0}
                disabled={saveMutation.isPending}
                value={score}
                onChange={(e) =>
                  setScore(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder={t(
                  "exam.results.enterFinalGrade",
                  "Enter final grade",
                )}
                className="w-full bg-sidebar border-sidebar-border"
                aria-invalid={!!scoreErr}
              />
              {scoreErr && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {scoreErr}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={feedbackId} className="text-sm font-medium">
                {t("exam.results.feedback", "Feedback")}
              </Label>
              <Textarea
                id={feedbackId}
                rows={5}
                disabled={saveMutation.isPending}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={t(
                  "exam.results.enterFeedback",
                  "Enter feedback from Jotform",
                )}
                className="w-full bg-sidebar border-sidebar-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={resultId} className="text-sm font-medium">
                {t("exam.results.passFail", "Pass / Fail")}
              </Label>
              <Select
                value={result || undefined}
                onValueChange={setResult}
                disabled={saveMutation.isPending}
              >
                <SelectTrigger
                  id={resultId}
                  className="w-full bg-sidebar border-sidebar-border"
                >
                  <SelectValue
                    placeholder={t(
                      "exam.results.selectResult",
                      "Select result",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pass">
                    {t("common.pass", "Pass")}
                  </SelectItem>
                  <SelectItem value="fail">
                    {t("common.fail", "Fail")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            disabled={!saveEnabled}
            onClick={onSave}
            className="w-full flex items-center justify-center gap-2 mt-4"
          >
            <Save className="h-4 w-4" />
            {t("common.save", "Save")}
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) return <LoadingState />;

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={error?.message || t("exam.messages.loadFailed")}
          onRetry={refetch}
          variant="card"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-dashboard-text dark:text-white capitalize">
            {details?.student
              ? `${details.student.first_name} ${details.student.last_name}`
              : ""}
          </h2>
          <p className="text-xs text-muted-foreground">
            {details?.student?.uid ? `UID: ${details.student.uid}` : ""} ·{" "}
            {details?.exam?.name}
          </p>
        </div>
      </div>

      <div className="max-w-xl space-y-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          {t("exam.results.officialResult", "Official Result")}
        </h3>
        {renderResultForm({
          scoreId: "admin-score",
          feedbackId: "admin-feedback",
          resultId: "admin-result",
          score: adminScore,
          setScore: setAdminScore,
          feedback: adminFeedback,
          setFeedback: setAdminFeedback,
          result: adminResult,
          setResult: setAdminResult,
          scoreErr: scoreError,
          onSave: handleSave,
          saveEnabled: canSave,
          title: t("exam.results.resultEntry", "Result entry"),
          exam: details?.exam,
        })}
      </div>

      {details?.resit && (
        <div className="max-w-xl space-y-6 pt-4 border-t border-sidebar-border">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            {t("exam.results.resitOfficialResult", "Resit official result")}
            {details.resit.exam?.name ? ` · ${details.resit.exam.name}` : ""}
          </h3>
          {renderResultForm({
            scoreId: "resit-admin-score",
            feedbackId: "resit-admin-feedback",
            resultId: "resit-admin-result",
            score: resitAdminScore,
            setScore: setResitAdminScore,
            feedback: resitAdminFeedback,
            setFeedback: setResitAdminFeedback,
            result: resitAdminResult,
            setResult: setResitAdminResult,
            scoreErr: resitScoreError,
            onSave: handleSaveResit,
            saveEnabled: canSaveResit,
            title: t("exam.results.resultEntry", "Result entry"),
            exam: details.resit.exam,
          })}
        </div>
      )}
    </div>
  );
};

export default PracticalResultDetailsPage;
