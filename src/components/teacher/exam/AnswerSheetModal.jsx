import { X, CheckCircle2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGetStudentAnswerSheet } from "@/store/useExamStore";
import { LoadingState, ErrorMessage } from "@/components/common";
import StatusBadge from "@/components/StatusBadge";
import { getMoment, formatInstant } from "@/utils/dateUtils";

const AnswerSheetModal = ({ open, attemptId, onClose }) => {
  const { t } = useTranslation();
  const { data, isLoading, error } = useGetStudentAnswerSheet(attemptId, {
    enabled: open && !!attemptId,
  });

  if (!open) return null;

  const sheet = data?.data;
  const exam = sheet?.exam;

  const studentName = sheet
    ? `${sheet.student?.last_name || ""} ${sheet.student?.first_name || ""}`.trim()
    : "";

  const scoreDisplay = exam
    ? `${sheet?.score ?? 0} / ${exam.total_marks ?? 0}`
    : `${sheet?.score ?? 0}`;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b dark:border-white/20 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t("examAnswerSheet.title", "Answer Sheet")}
            </h2>
            {sheet && (
              <p className="text-sm text-gray-500 dark:text-white/70 mt-1">
                <span className="font-medium capitalize">{studentName}</span>
                {sheet.student?.uid ? ` · ${sheet.student.uid}` : ""}
                {exam?.name ? ` · ${exam.name}` : ""}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground dark:text-white/70 hover:text-gray-700 dark:hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <ErrorMessage
              message={
                error?.message ||
                t("examAnswerSheet.loadFailed", "Failed to load answer sheet")
              }
            />
          ) : !sheet ? (
            <ErrorMessage
              message={t("examAnswerSheet.notFound", "Answer sheet not found")}
            />
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-8 text-sm font-semibold rounded-[6px] border border-border/60 p-4">
                <div>
                  <p className="text-muted-foreground">
                    {t("examAnswerSheet.result", "Result")}
                  </p>
                  <StatusBadge status={sheet.result} />
                </div>
                <div>
                  <p className="text-muted-foreground">
                    {t("examAnswerSheet.score", "Score")}
                  </p>
                  <p className="text-base">{scoreDisplay}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    {t("examAnswerSheet.percentage", "Percentage")}
                  </p>
                  <p className="text-base">
                    {sheet.percentage !== null && sheet.percentage !== undefined
                      ? `${sheet.percentage.toFixed(2)}%`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    {t("examAnswerSheet.submittedAt", "Submitted At")}
                  </p>
                  <p className="text-base">
                    {sheet.submitted_at
                      ? formatInstant(sheet.submitted_at)
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    {t("examAnswerSheet.warnings", "Integrity warnings")}
                  </p>
                  <p
                    className={`text-base ${
                      (sheet.integrity_violation_count || 0) > 0
                        ? "text-orange-600"
                        : ""
                    }`}
                  >
                    {sheet.integrity_violation_count || 0}
                  </p>
                </div>
              </div>

              {(sheet.integrity_violations?.length || 0) > 0 && (
                <div className="rounded-[6px] border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900 p-4 space-y-2">
                  <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                    {t("examAnswerSheet.warningLog", "Warning log")}
                  </p>
                  <ul className="space-y-1 text-sm text-orange-900 dark:text-orange-200">
                    {sheet.integrity_violations.map((v, idx) => (
                      <li key={`${v.type}-${v.at}-${idx}`}>
                        <span className="font-medium">
                          {t(`examAnswerSheet.violation.${v.type}`, v.type)}
                        </span>
                        {v.at ? ` · ${formatInstant(v.at)}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-6">
                {(sheet.questions || []).map((q, index) => (
                  <div
                    key={q.question_id || index}
                    className="space-y-3 rounded-[6px] border border-border/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-base text-gray-900 dark:text-white">
                        {index + 1}. {q.question_text}
                      </p>
                      <span className="text-xs font-semibold px-2.5 py-1 bg-muted border border-border/40 rounded-[4px] shrink-0 text-muted-foreground select-none">
                        {q.marks_awarded || 0} / {q.marks || 0}
                      </span>
                    </div>
                    <div className="space-y-2 ml-2">
                      {(q.options || []).map((opt) => (
                        <div
                          key={opt.index}
                          className="flex items-center gap-3 text-sm"
                        >
                          {opt.is_selected && opt.is_correct && (
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                          )}
                          {opt.is_selected && !opt.is_correct && (
                            <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                          )}
                          {!opt.is_selected && opt.is_correct && (
                            <CheckCircle2 className="w-5 h-5 text-green-500 opacity-50 shrink-0" />
                          )}
                          {!opt.is_selected && !opt.is_correct && (
                            <div className="w-5 h-5 border rounded-full shrink-0" />
                          )}
                          <p
                            className={
                              opt.is_correct
                                ? "text-green-600 font-medium"
                                : "text-gray-700 dark:text-white/80"
                            }
                          >
                            {opt.option_text}
                          </p>
                          {opt.is_selected && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted border border-border/40 text-muted-foreground">
                              {t("examAnswerSheet.studentAnswer", "Student answer")}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    {q.selected_option === null && (
                      <p className="text-xs text-muted-foreground ml-2">
                        {t("examAnswerSheet.notAnswered", "Not answered")}
                      </p>
                    )}
                    {q.explanation && (
                      <p className="text-xs text-muted-foreground ml-2 border-t border-border/40 pt-2">
                        <span className="font-semibold">
                          {t("examAnswerSheet.explanation", "Explanation")}:
                        </span>{" "}
                        {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnswerSheetModal;
