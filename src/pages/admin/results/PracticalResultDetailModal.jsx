import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useGetStudentPracticalDetailAdmin,
  useSetStudentPracticalScoreAdmin,
} from "@/store/useExamStore";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";
import StatusBadge from "@/components/StatusBadge";

const PracticalResultDetailModal = ({ open, onClose, plannedId, applicationId }) => {
  const { t } = useTranslation();
  const { data: detailData, isLoading, error, refetch } = useGetStudentPracticalDetailAdmin(
    plannedId,
    applicationId,
    { enabled: open && !!plannedId && !!applicationId }
  );

  const saveMutation = useSetStudentPracticalScoreAdmin();
  const [adminScore, setAdminScore] = useState("");

  const details = detailData?.data;

  useEffect(() => {
    if (details?.admin_result) {
      setAdminScore(details.admin_result.score);
    } else {
      setAdminScore("");
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
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("exam.results.practicalDetailsTitle", "Practical Exam Result Details")}</DialogTitle>
          <DialogDescription className="capitalize">
            {details?.student ? `${details.student.last_name} ${details.student.first_name}` : ""}
            {details?.student?.uid ? ` · ${details.student.uid}` : ""}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <ErrorMessage
            message={error?.message || t("exam.messages.loadFailed")}
            onRetry={refetch}
            variant="inline"
          />
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {t("exam.results.teacherFeedback", "Teacher Feedback")}
              </h3>
              <div className="space-y-4">
                {details?.teacher_feedbacks?.map((tf) => (
                  <div key={tf.teacher._id} className="p-4 bg-muted/40 rounded-lg border border-sidebar-border">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">
                        {tf.teacher.first_name} {tf.teacher.last_name}
                      </span>
                      <StatusBadge status={tf.status} />
                    </div>
                    {tf.status === "submitted" ? (
                      <div className="space-y-2 mt-2">
                        <div className="text-sm font-medium mb-1">
                          {t("exam.results.totalScore", "Total Score")}: {tf.score_summary.total_score} / {tf.score_summary.max_score} ({Math.round(tf.score_summary.percentage * 100) / 100}%)
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          {tf.score_summary.breakdown?.map((b) => (
                            <div key={b.field_key} className="p-2 bg-sidebar rounded border border-sidebar-border/40">
                              <span className="font-medium">{b.label}:</span>{" "}
                              <span>
                                {b.value ?? "—"}
                                {b.max_marks !== undefined ? ` / ${b.max_marks}` : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        {t("exam.results.pendingFeedback", "Feedback is still pending")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-sidebar-border pt-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {t("exam.results.officialResult", "Official Result")}
              </h3>
              
              {!details?.can_set_result && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-200 text-xs rounded-lg mb-4">
                  {t("exam.results.waitingTeachers", "Waiting for all assigned teachers to submit their feedback before official result can be entered.")}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-1">
                  <Label htmlFor="admin-score">
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
                  />
                </div>
                {derivedResult && (
                  <>
                    <div className="p-3 bg-muted/30 rounded-lg text-sm">
                      <span className="text-muted-foreground block text-xs">
                        {t("exam.results.derivedPercentage", "Percentage")}
                      </span>
                      <span className="font-semibold text-base">
                        {Math.round(derivedResult.percentage * 100) / 100}%
                      </span>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg text-sm">
                      <span className="text-muted-foreground block text-xs">
                        {t("exam.results.derivedResult", "Derived Result")}
                      </span>
                      <span className="font-semibold capitalize text-base">
                        <StatusBadge status={derivedResult.result} />
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 border-t border-sidebar-border pt-4">
          <Button variant="outline" onClick={onClose}>
            {t("common.close", "Close")}
          </Button>
          {details?.can_set_result && (
            <Button
              disabled={adminScore === "" || saveMutation.isPending}
              onClick={handleSave}
            >
              {t("common.save", "Save")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PracticalResultDetailModal;
