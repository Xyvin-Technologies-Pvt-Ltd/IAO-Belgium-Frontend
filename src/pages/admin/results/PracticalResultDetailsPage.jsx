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
import StatusBadge from "@/components/StatusBadge";

const isValidScore = (score, max) => {
  if (score === "" || score === null || score === undefined) return false;
  const n = Number(score);
  return Number.isFinite(n) && n >= 0 && n <= max;
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

  const maxTotalMarks =
    Number(details?.exam?.total_marks) > 0 ? details.exam.total_marks : 100;
  const scoreValid = isValidScore(adminScore, maxTotalMarks);
  const scoreError =
    adminScore !== "" && !scoreValid
      ? t(
          "exam.results.scoreRangeError",
          "Score must be between 0 and {{max}}",
          { max: maxTotalMarks },
        )
      : null;
  const canSave =
    scoreValid && ["pass", "fail"].includes(adminResult) && !saveMutation.isPending;

  const resitMaxTotalMarks =
    Number(details?.resit?.exam?.total_marks) > 0
      ? details.resit.exam.total_marks
      : 100;
  const resitScoreValid = isValidScore(resitAdminScore, resitMaxTotalMarks);
  const resitScoreError =
    resitAdminScore !== "" && !resitScoreValid
      ? t(
          "exam.results.scoreRangeError",
          "Score must be between 0 and {{max}}",
          { max: resitMaxTotalMarks },
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

  const renderFeedbackCards = (feedbacks = []) => (
    <div className="space-y-6">
      {feedbacks.map((tf) => (
        <Card
          key={tf.teacher._id}
          className="border border-sidebar-border overflow-hidden bg-sidebar"
        >
          <CardHeader className="bg-muted/30 py-3 flex flex-row items-center justify-between border-b border-sidebar-border">
            <CardTitle className="text-base font-semibold">
              {tf.teacher.first_name} {tf.teacher.last_name}
            </CardTitle>
            <StatusBadge status={tf.status} />
          </CardHeader>
          <CardContent className="p-6">
            {tf.status === "submitted" ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-muted/20 p-3 rounded-lg border border-sidebar-border/50 text-sm font-medium">
                  <span>{t("exam.results.totalScore", "Total Score")}</span>
                  <span>
                    {tf.score_summary.total_score} / {tf.score_summary.max_score}{" "}
                    ({Math.round(tf.score_summary.percentage * 100) / 100}%)
                  </span>
                </div>
                <div className="space-y-4">
                  {tf.score_summary.breakdown?.map((b) => {
                    const isComment =
                      b.max_marks === undefined || b.max_marks === null;
                    if (isComment) {
                      return (
                        <div key={b.field_key} className="space-y-1">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                            {b.label}
                            {b.required && <span className="text-red-500"> *</span>}
                          </span>
                          <div className="p-3 bg-muted/10 rounded border border-sidebar-border text-sm leading-relaxed whitespace-pre-line text-dashboard-text dark:text-white/80">
                            {b.value || (
                              <span className="text-gray-400 italic">
                                No comment provided
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={b.field_key}
                        className="flex justify-between items-center py-2 border-b border-sidebar-border/30 text-sm"
                      >
                        <span className="font-medium text-muted-foreground">
                          {b.label}
                          {b.required && <span className="text-red-500"> *</span>}
                        </span>
                        <span className="font-semibold text-dashboard-text dark:text-white">
                          {b.value ?? "—"} / {b.max_marks}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic py-4 text-center">
                {t(
                  "exam.results.pendingFeedback",
                  "Feedback is still pending",
                )}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderResultForm = ({
    scoreId,
    feedbackId,
    resultId,
    maxMarks,
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
    showOptionalNote = false,
  }) => (
    <Card className="border border-sidebar-border bg-sidebar sticky top-6">
      <CardHeader className="py-4 border-b border-sidebar-border bg-muted/10">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {showOptionalNote && (
          <div className="p-3 bg-muted/20 text-muted-foreground text-xs rounded-lg border border-sidebar-border leading-relaxed">
            {t(
              "exam.results.teachersOptional",
              "Teacher in-app feedback is optional. You can enter the official result from Jotform.",
            )}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={scoreId} className="text-sm font-medium">
              {t("exam.results.finalGrade", "Final grade")} (Max: {maxMarks})
            </Label>
            <Input
              id={scoreId}
              type="number"
              min={0}
              max={maxMarks}
              disabled={saveMutation.isPending}
              value={score}
              onChange={(e) =>
                setScore(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder={t("exam.results.enterFinalGrade", "Enter final grade")}
              className="w-full bg-sidebar border-sidebar-border"
              aria-invalid={!!scoreErr}
            />
            {scoreErr && (
              <p className="text-xs text-red-600 dark:text-red-400">{scoreErr}</p>
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
              <SelectTrigger id={resultId} className="w-full bg-sidebar border-sidebar-border">
                <SelectValue
                  placeholder={t("exam.results.selectResult", "Select result")}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            {t("exam.results.teacherFeedback", "Teacher Feedback")}
          </h3>
          <div className="space-y-6">
            {renderFeedbackCards(details?.teacher_feedbacks)}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            {t("exam.results.officialResult", "Official Result")}
          </h3>
          {renderResultForm({
            scoreId: "admin-score",
            feedbackId: "admin-feedback",
            resultId: "admin-result",
            maxMarks: maxTotalMarks,
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
            showOptionalNote: true,
          })}
        </div>
      </div>

      {details?.resit && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-sidebar-border">
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              {t("exam.results.resitTeacherFeedback", "Resit teacher feedback")}
              {details.resit.exam?.name ? ` · ${details.resit.exam.name}` : ""}
            </h3>
            {renderFeedbackCards(details.resit.teacher_feedbacks)}
          </div>
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              {t("exam.results.resitOfficialResult", "Resit official result")}
            </h3>
            {renderResultForm({
              scoreId: "resit-admin-score",
              feedbackId: "resit-admin-feedback",
              resultId: "resit-admin-result",
              maxMarks: resitMaxTotalMarks,
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
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticalResultDetailsPage;
