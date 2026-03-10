import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Clock,
  Calendar,
  PlayCircle,
  StopCircle,
  HelpCircle,
  GraduationCap,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import {
  useGetTeacherExamById,
  useStartExamSession,
  useEndExamSession,
} from "@/store/useExamStore";
import { LoadingState, ErrorMessage } from "@/components/common";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import ExamStatusBadge from "@/components/admin/exam/ExamStatusBadge";
import DashboardCard from "@/components/admin/dashboard/DashboardCard";
import { toast } from "sonner";
import moment from "moment";

const ExamDetail = () => {
  const { t } = useTranslation();
  const params = useParams({ strict: false });
  const id = params.id;
  const { updateBreadcrumbs } = useBreadcrumb();

  const [examStarted, setExamStarted] = useState(false);
  const [examEnded, setExamEnded] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [canStart, setCanStart] = useState(false);

  const {
    data: examData,
    isLoading,
    error,
    refetch,
  } = useGetTeacherExamById(id);
  const startSessionMutation = useStartExamSession();
  const endSessionMutation = useEndExamSession();

  useEffect(() => {
    if (examData?.data) {
      updateBreadcrumbs([
        {
          label: t("sidebar.teacher.exams", { defaultValue: "Exams" }),
          path: "/teacher/exams",
          navigable: false,
        },
        {
          label: examData.data.name,
          path: `/teacher/exams/${id}`,
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
  }, [examData?.data?.name, examData?.data?.exam_session_status, examData?.data?.exam_session_id, id, t]);

  useEffect(() => {
    if (!examData?.data?.first_session) return;

    const checkSessionDate = () => {
      const now = moment.utc().startOf('day');
      const sessionDate = moment.utc(examData.data.first_session.session_date).startOf('day');
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
      exam: id,
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
          {!examStarted && !examEnded && (
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
          {examStarted && !examEnded && (
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
          {examEnded && (
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
          title={t("exam.detail.passingMarks", { defaultValue: "Pass Mark" })}
          value={`${exam.passing_marks || 0} ${exam.passing_type === "percentage" ? "%" : ""}`}
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
    </div>
  );
};

export default ExamDetail;
