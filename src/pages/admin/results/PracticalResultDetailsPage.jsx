import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useGetStudentPracticalDetailAdmin,
  useSetStudentPracticalScoreAdmin,
} from "@/store/useExamStore";
import { LoadingState, ErrorMessage } from "@/components/common";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import StatusBadge from "@/components/StatusBadge";

const PracticalResultDetailsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { updateBreadcrumbs } = useBreadcrumb();
  const { plannedId, applicationId } = useParams({ strict: false });

  const { data: detailData, isLoading, error, refetch } = useGetStudentPracticalDetailAdmin(
    plannedId,
    applicationId,
    { enabled: !!plannedId && !!applicationId }
  );

  const saveMutation = useSetStudentPracticalScoreAdmin();
  const [adminScore, setAdminScore] = useState("");
  const [resitAdminScore, setResitAdminScore] = useState("");

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
    } else {
      setAdminScore("");
    }
    if (details?.resit?.admin_result) {
      setResitAdminScore(details.resit.admin_result.score);
    } else {
      setResitAdminScore("");
    }
  }, [details]);

  const maxTotalMarks = Number(details?.exam?.total_marks) > 0 ? details.exam.total_marks : 100;

  const derivedResult = useMemo(() => {
    if (adminScore === "" || isNaN(Number(adminScore))) return null;
    const scoreVal = Number(adminScore);
    const exam = details?.exam;
    if (!exam) return null;
    const percentage = maxTotalMarks > 0 ? (scoreVal / maxTotalMarks) * 100 : 0;
    let result;
    if (exam.passing_type === "percentage") {
      const threshold = exam.passing_percentage ?? 50;
      result = percentage >= threshold ? "pass" : "fail";
    } else {
      const threshold = exam.passing_marks ?? 0;
      result = scoreVal >= threshold ? "pass" : "fail";
    }
    return { percentage, result };
  }, [adminScore, details?.exam, maxTotalMarks]);

  const resitMaxTotalMarks =
    Number(details?.resit?.exam?.total_marks) > 0 ? details.resit.exam.total_marks : 100;

  const derivedResitResult = useMemo(() => {
    if (resitAdminScore === "" || isNaN(Number(resitAdminScore))) return null;
    const scoreVal = Number(resitAdminScore);
    const exam = details?.resit?.exam;
    if (!exam) return null;
    const percentage = resitMaxTotalMarks > 0 ? (scoreVal / resitMaxTotalMarks) * 100 : 0;
    let result;
    if (exam.passing_type === "percentage") {
      const threshold = exam.passing_percentage ?? 50;
      result = percentage >= threshold ? "pass" : "fail";
    } else {
      const threshold = exam.passing_marks ?? 0;
      result = scoreVal >= threshold ? "pass" : "fail";
    }
    return { percentage, result };
  }, [resitAdminScore, details?.resit?.exam, resitMaxTotalMarks]);

  const handleSave = () => {
    if (adminScore === "" || isNaN(Number(adminScore))) return;
    saveMutation.mutate(
      {
        plannedId,
        applicationId,
        score: Number(adminScore),
      },
      {
        onSuccess: () => {
          navigate({ to: "/admin/results", search: { tab: "practical" } });
        },
      }
    );
  };

  const handleSaveResit = () => {
    if (resitAdminScore === "" || isNaN(Number(resitAdminScore))) return;
    const resitPlannedId = details?.resit?.planned_practical_exam?._id;
    if (!resitPlannedId) return;
    saveMutation.mutate({
      plannedId: resitPlannedId,
      applicationId,
      score: Number(resitAdminScore),
    });
  };

  const renderFeedbackCards = (feedbacks = []) => (
    <div className="space-y-6">
      {feedbacks.map((tf) => (
        <Card key={tf.teacher._id} className="border border-sidebar-border overflow-hidden bg-sidebar">
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
                    {tf.score_summary.total_score} / {tf.score_summary.max_score} ({Math.round(tf.score_summary.percentage * 100) / 100}%)
                  </span>
                </div>
                <div className="space-y-4">
                  {tf.score_summary.breakdown?.map((b) => {
                    const isComment = b.max_marks === undefined || b.max_marks === null;
                    if (isComment) {
                      return (
                        <div key={b.field_key} className="space-y-1">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                            {b.label}
                            {b.required && <span className="text-red-500"> *</span>}
                          </span>
                          <div className="p-3 bg-muted/10 rounded border border-sidebar-border text-sm leading-relaxed whitespace-pre-line text-dashboard-text dark:text-white/80">
                            {b.value || <span className="text-gray-400 italic">No comment provided</span>}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={b.field_key} className="flex justify-between items-center py-2 border-b border-sidebar-border/30 text-sm">
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
                {t("exam.results.pendingFeedback", "Feedback is still pending")}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
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
      {/* Header section */}
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-dashboard-text dark:text-white capitalize">
            {details?.student ? `${details.student.first_name} ${details.student.last_name}` : ""}
          </h2>
          <p className="text-xs text-muted-foreground">
            {details?.student?.uid ? `UID: ${details.student.uid}` : ""} · {details?.exam?.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Teacher Feedbacks (takes 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            {t("exam.results.teacherFeedback", "Teacher Feedback")}
          </h3>

          <div className="space-y-6">
            {renderFeedbackCards(details?.teacher_feedbacks)}
          </div>
        </div>

        {/* Right Column: Official Score Input (takes 1 col) */}
        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            {t("exam.results.officialResult", "Official Result")}
          </h3>

          <Card className="border border-sidebar-border bg-sidebar sticky top-6">
            <CardHeader className="py-4 border-b border-sidebar-border bg-muted/10">
              <CardTitle className="text-base font-semibold">
                {t("exam.results.scoreEntry", "Score Entry")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {!details?.can_set_result && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-200 text-xs rounded-lg border border-yellow-200 dark:border-yellow-900 leading-relaxed">
                  {t("exam.results.waitingTeachers", "Waiting for all assigned teachers to submit their feedback before official result can be entered.")}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-score" className="text-sm font-medium">
                    {t("exam.results.officialScore", "Official Score")} (Max: {maxTotalMarks})
                  </Label>
                  <Input
                    id="admin-score"
                    type="number"
                    min={0}
                    max={maxTotalMarks}
                    disabled={!details?.can_set_result || saveMutation.isPending}
                    value={adminScore}
                    onChange={(e) => setAdminScore(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder={t("exam.results.enterScore", "Enter score")}
                    className="w-full bg-sidebar border-sidebar-border"
                  />
                </div>

                {derivedResult && (
                  <div className="space-y-3 pt-2">
                    <div className="p-3 bg-muted/20 rounded-lg flex justify-between items-center text-sm border border-sidebar-border/40">
                      <span className="text-muted-foreground">
                        {t("exam.results.derivedPercentage", "Percentage")}
                      </span>
                      <span className="font-semibold">
                        {Math.round(derivedResult.percentage * 100) / 100}%
                      </span>
                    </div>
                    <div className="p-3 bg-muted/20 rounded-lg flex justify-between items-center text-sm border border-sidebar-border/40">
                      <span className="text-muted-foreground">
                        {t("exam.results.derivedResult", "Result")}
                      </span>
                      <span>
                        <StatusBadge status={derivedResult.result} />
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {details?.can_set_result && (
                <Button
                  disabled={adminScore === "" || saveMutation.isPending}
                  onClick={handleSave}
                  className="w-full flex items-center justify-center gap-2 mt-4"
                >
                  <Save className="h-4 w-4" />
                  {t("common.save", "Save Score")}
                </Button>
              )}
            </CardContent>
          </Card>
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
            <Card className="border border-sidebar-border bg-sidebar sticky top-6">
              <CardHeader className="py-4 border-b border-sidebar-border bg-muted/10">
                <CardTitle className="text-base font-semibold">
                  {t("exam.results.scoreEntry", "Score Entry")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {!details.resit.can_set_result && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-200 text-xs rounded-lg border border-yellow-200 dark:border-yellow-900 leading-relaxed">
                    {t("exam.results.waitingTeachers", "Waiting for all assigned teachers to submit their feedback before official result can be entered.")}
                  </div>
                )}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resit-admin-score" className="text-sm font-medium">
                      {t("exam.results.officialScore", "Official Score")} (Max: {resitMaxTotalMarks})
                    </Label>
                    <Input
                      id="resit-admin-score"
                      type="number"
                      min={0}
                      max={resitMaxTotalMarks}
                      disabled={!details.resit.can_set_result || saveMutation.isPending}
                      value={resitAdminScore}
                      onChange={(e) => setResitAdminScore(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder={t("exam.results.enterScore", "Enter score")}
                      className="w-full bg-sidebar border-sidebar-border"
                    />
                  </div>
                  {derivedResitResult && (
                    <div className="space-y-3 pt-2">
                      <div className="p-3 bg-muted/20 rounded-lg flex justify-between items-center text-sm border border-sidebar-border/40">
                        <span className="text-muted-foreground">
                          {t("exam.results.derivedPercentage", "Percentage")}
                        </span>
                        <span className="font-semibold">
                          {Math.round(derivedResitResult.percentage * 100) / 100}%
                        </span>
                      </div>
                      <div className="p-3 bg-muted/20 rounded-lg flex justify-between items-center text-sm border border-sidebar-border/40">
                        <span className="text-muted-foreground">
                          {t("exam.results.derivedResult", "Result")}
                        </span>
                        <span>
                          <StatusBadge status={derivedResitResult.result} />
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                {details.resit.can_set_result && (
                  <Button
                    disabled={resitAdminScore === "" || saveMutation.isPending}
                    onClick={handleSaveResit}
                    className="w-full flex items-center justify-center gap-2 mt-4"
                  >
                    <Save className="h-4 w-4" />
                    {t("common.save", "Save Score")}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticalResultDetailsPage;
