import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import {
  PlayCircle,
  StopCircle,
  HelpCircle,
  GraduationCap,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import {
  useGetTeacherExamById,
  useStartExamSession,
  useEndExamSession,
  useGetExamResults,
} from "@/store/useExamStore";
import { LoadingState, ErrorMessage } from "@/components/common";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import AnswerSheetModal from "@/components/teacher/exam/AnswerSheetModal";
import ExamStatusBadge from "@/components/admin/exam/ExamStatusBadge";
import StatusBadge from "@/components/StatusBadge";
import DashboardCard from "@/components/admin/dashboard/DashboardCard";
import { toast } from "sonner";
import { getMoment, formatInstant } from "@/utils/dateUtils";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/table/Pagination";
import { useDebounce } from "@/hooks/useDebounce";

const ExamDetail = () => {
  const { t } = useTranslation();
  const params = useParams({ strict: false });
  const exam_id = params.exam_id;
  const planning_id = params.planning_id;
  const { updateBreadcrumbs } = useBreadcrumb();

  const [examStarted, setExamStarted] = useState(false);
  const [examEnded, setExamEnded] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [canStart, setCanStart] = useState(false);

  // Pagination and Search states
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [answerSheetAttemptId, setAnswerSheetAttemptId] = useState(null);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const {
    data: examData,
    isLoading,
    error,
    refetch,
  } = useGetTeacherExamById(exam_id, planning_id);

  // exam_id is also available directly from params now

  const {
    data: resultsData,
    isLoading: resultsLoading,
    error: resultsError,
  } = useGetExamResults(exam_id, planning_id, {
    page,
    limit: rowsPerPage,
    search: debouncedSearch,
  });

  const startSessionMutation = useStartExamSession();
  const endSessionMutation = useEndExamSession();

  useEffect(() => {
    if (examData?.data) {
      updateBreadcrumbs([
        {
          label: t("sidebar.teacher.exams", { defaultValue: "Exams" }),
          path: "/teacher/exams",
          navigable: true,
        },
        {
          label: examData.data.name,
          path: `/teacher/exams/${exam_id}/${planning_id}`,
          navigable: false,
        },
      ]);

      if (examData.data.exam_session_status === "started") {
        setExamStarted(true);
        setExamEnded(false);
        if (examData.data.exam_session_id) {
          setActiveSessionId(examData.data.exam_session_id);
        }
      } else if (examData.data.exam_session_status === "ended") {
        setExamStarted(false);
        setExamEnded(true);
        setActiveSessionId(null);
      }
    }
    return () => updateBreadcrumbs([]);
  }, [
    examData?.data?.name,
    examData?.data?.exam_session_status,
    examData?.data?.exam_session_id,
    planning_id,
    t,
  ]);

  useEffect(() => {
    if (!examData?.data?.first_session) return;

    const checkSessionDate = () => {
      const now = getMoment().startOf("day");
      const sessionDate = getMoment(
        examData.data.first_session.session_date,
      ).startOf("day");
      setCanStart(
        now.isSame(sessionDate) &&
          examData.data.exam_session_status !== "started",
      );
    };

    checkSessionDate();
    const interval = setInterval(checkSessionDate, 60000);

    return () => clearInterval(interval);
  }, [examData]);

  const handleStartExam = () => {
    if (!examData?.data?.first_session?.planning_id) {
      toast.error("Missing planning session data to start the exam.");
      return;
    }
    const payload = {
      planning: examData.data.first_session.planning_id,
      exam: exam_id,
    };

    startSessionMutation.mutate(payload);
  };

  const handleEndExam = () => {
    if (!activeSessionId) {
      toast.error("No active session to end.");
      return;
    }
    endSessionMutation.mutate(activeSessionId);
  };

  if (isLoading) {
    return <LoadingState text={t("exam.loading")} fullHeight />;
  }

  if (error || !examData?.data) {
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

  const exam = examData.data;
  const isNonSessionExam = exam.type === "practical";

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold text-dashboard-text dark:text-white">
                {exam.name}
              </h2>
              <ExamStatusBadge status={exam.status} />
            </div>
            <div className="mt-2">
              <span className="inline-block px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground">
                {exam.uid}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {exam.type === "practical" && (
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
              {t("exam.type.practical", { defaultValue: "Practical/Clinical" })}
            </Badge>
          )}
          {!isNonSessionExam && !examStarted && !examEnded && (
            <Button
              onClick={handleStartExam}
              disabled={!canStart || startSessionMutation.isPending}
            >
              <PlayCircle className="h-4 w-4" />
              {startSessionMutation.isPending
                ? "Starting..."
                : t("exam.startExam", { defaultValue: "Start Exam" })}
            </Button>
          )}
          {!isNonSessionExam && examStarted && !examEnded && (
            <Button
              onClick={handleEndExam}
              disabled={endSessionMutation.isPending}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <StopCircle className="h-4 w-4" />
              {endSessionMutation.isPending
                ? "Ending..."
                : t("exam.endExam", { defaultValue: "End Exam" })}
            </Button>
          )}
          {!isNonSessionExam && examEnded && (
            <div className="text-sm font-medium text-green-600 dark:text-green-500 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-md">
              {t("exam.examCompleted", { defaultValue: "Exam Completed" })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DashboardCard
          title={t("exam.detail.totalQuestions", {
            defaultValue: "Total Questions",
          })}
          value={exam.total_questions?.toString()}
          icon={HelpCircle}
        />
        <DashboardCard
          title={t("exam.detail.totalMarks", { defaultValue: "Total Marks" })}
          value={exam.total_marks?.toString()}
          icon={GraduationCap}
        />
        <DashboardCard
          title={exam.passing_type === "percentage" ? t("exam.detail.passingPercentage", { defaultValue: "Passing Percentage" }) : t("exam.detail.passingMarks", { defaultValue: "Pass Mark" })}
          value={`${exam.passing_type === "percentage" ? (exam.passing_percentage ?? exam.passing_marks ?? 0) : (exam.passing_marks ?? exam.passing_percentage ?? 0)} ${exam.passing_type === "percentage" ? "%" : ""}`}
        />
        <DashboardCard
          title={t("exam.detail.duration", { defaultValue: "Duration" })}
          value={`${exam.duration || 0} mins`}
          icon={Timer}
        />
      </div>

      {exam.description && (
        <div className="p-5 border rounded-lg bg-card text-card-foreground shadow-sm">
          <p className="text-sm font-bold mb-2">Description:</p>
          <p className="text-sm text-card-foreground/80">{exam.description}</p>
        </div>
      )}

      {exam.instructions && (
        <div className="p-5 border rounded-lg bg-card text-card-foreground shadow-sm">
          <p className="text-sm font-bold mb-2">Instructions:</p>
          <div className="text-sm text-card-foreground/80 whitespace-pre-wrap">
            {exam.instructions}
          </div>
        </div>
      )}

      {exam.question_sources && exam.question_sources.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-dashboard-text dark:text-white mb-4">
            Question Sources
          </h3>
          <div className="border rounded-lg overflow-hidden bg-white dark:bg-card text-card-foreground shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#f4f4f5] dark:bg-muted text-muted-foreground text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4 border-b">Source</th>
                  <th className="px-6 py-4 border-b">Number of Questions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {exam.question_sources.map((source, index) => (
                  <tr key={index} className="transition-colors">
                    <td className="px-6 py-4">
                      {source.question_bank?.name ||
                        source.question_bank ||
                        "Osteopathic principles"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {source.count} questions{" "}
                      {source.question_bank?.total_questions
                        ? `(${source.question_bank.total_questions} questions available)`
                        : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(isNonSessionExam ||
        exam.exam_session_status === "ended" ||
        resultsData?.data?.length > 0) && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-dashboard-text dark:text-white">
              Student Results
            </h3>
            <Input
              placeholder="Search students..."
              className="max-w-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-6">Student</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-center">Percentage</TableHead>
                <TableHead className="text-center">Result</TableHead>
                <TableHead className="text-center">
                  {t("exam.detail.warnings", { defaultValue: "Warnings" })}
                </TableHead>
                <TableHead className="text-center px-6">Submitted At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resultsLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {t("common.loading") || "Loading results..."}
                  </TableCell>
                </TableRow>
              ) : resultsData?.data?.length > 0 ? (
                resultsData.data.map((result) => (
                  <TableRow
                    key={result._id}
                    className="transition-colors hover:bg-muted/50 cursor-pointer"
                    onClick={() => setAnswerSheetAttemptId(result._id)}
                  >
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium capitalize">
                          {result.student?.last_name}{" "}
                          {result.student?.first_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {result.student?.uid}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {result.score}
                    </TableCell>
                    <TableCell className="text-center">
                      {result.percentage !== null && result.percentage !== undefined ? `${result.percentage.toFixed(2)}%` : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={result.result} />
                    </TableCell>
                    <TableCell className="text-center">
                      {(result.integrity_violation_count || 0) > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold">
                          {result.integrity_violation_count}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground px-6 py-4">
                      {result.submitted_at ? formatInstant(result.submitted_at) : "—"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {t("common.noResultsFound") ||
                      "No results found for this exam session."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {resultsData?.total_count > 0 && (
            <Pagination
              page={page}
              setPage={setPage}
              rowsPerPage={rowsPerPage}
              setRowsPerPage={setRowsPerPage}
              totalRows={resultsData?.total_count || 0}
            />
          )}
        </div>
      )}

      <AnswerSheetModal
        open={!!answerSheetAttemptId}
        attemptId={answerSheetAttemptId}
        onClose={() => setAnswerSheetAttemptId(null)}
      />
    </div>
  );
};

export default ExamDetail;
