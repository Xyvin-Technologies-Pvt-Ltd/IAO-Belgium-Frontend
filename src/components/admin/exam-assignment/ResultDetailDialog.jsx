import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { useGetAttemptDetail } from "@/store/useExamAssignmentStore";
import { Skeleton } from "@/components/ui/skeleton";

const ResultDetailDialog = ({ open, onClose, assignmentId, attemptId }) => {
  const { t } = useTranslation();
  const { data, isLoading } = useGetAttemptDetail(
    assignmentId,
    attemptId,
    { enabled: open && !!assignmentId && !!attemptId },
  );

  const attempt = data?.data;

  const getStudentName = (student) => {
    if (!student) return "-";
    return [student.first_name, student.last_name]
      .filter(Boolean)
      .join(" ") || "-";
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("examAssignment.results.attemptDetail")}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : attempt ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("examAssignment.results.student")}
                </p>
                <p className="font-medium">
                  {getStudentName(attempt.student)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("examAssignment.results.email")}
                </p>
                <p className="font-medium">
                  {attempt.student?.email || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("examAssignment.results.score")}
                </p>
                <p className="font-medium">
                  {attempt.total_marks_obtained} / {attempt.total_marks}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("examAssignment.results.percentage")}
                </p>
                <p className="font-medium">{attempt.percentage}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("examAssignment.results.passed")}
                </p>
                <p className="font-medium">
                  {attempt.is_passed ? t("common.yes") : t("common.no")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("examAssignment.results.status")}
                </p>
                <p className="font-medium">{attempt.status || "-"}</p>
              </div>
            </div>
            {attempt.questions && attempt.questions.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">
                  {t("examAssignment.results.questionsAnswered")}
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {attempt.questions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-3 border rounded-lg text-sm"
                    >
                      <p className="font-medium">
                        Q{idx + 1}:{" "}
                        {q.question?.question_text?.slice(0, 80)}...
                      </p>
                      <p className="text-muted-foreground mt-1">
                        {q.is_correct
                          ? t("examAssignment.results.correct")
                          : t("examAssignment.results.incorrect")}{" "}
                        · {t("examAssignment.results.marks")}:{" "}
                        {q.marks_obtained ?? 0}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">
            {t("examAssignment.results.noData")}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ResultDetailDialog;
