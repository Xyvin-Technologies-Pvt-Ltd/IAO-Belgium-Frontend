import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { ArrowLeft, Clock, Calendar, PlayCircle, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useGetTeacherExamById } from "@/store/useExamStore";
import { LoadingState, ErrorMessage } from "@/components/common";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import ExamStatusBadge from "@/components/admin/exam/ExamStatusBadge";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import moment from "moment";

const ExamDetail = () => {
  const { t } = useTranslation();
  const params = useParams({ strict: false });
  const id = params.id;
  const { updateBreadcrumbs } = useBreadcrumb();
  
  const [examStarted, setExamStarted] = useState(false);
  const [examEnded, setExamEnded] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [canStart, setCanStart] = useState(false);

  const { data: examData, isLoading, error, refetch } = useGetTeacherExamById(id);

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
    }
    return () => updateBreadcrumbs([]);
  }, [examData?.data?.name, id, t]);

  useEffect(() => {
    if (!examData?.data?.first_session || !examData?.data?.duration) return;

    const session = examData.data.first_session;

    const updateTimer = () => {
      const now = moment();
      const sessionDate = moment(session.session_date);
      
      // Check if today is the session date
      const isSessionDay = now.isSame(sessionDate, 'day');

      if (isSessionDay) {
        setCanStart(true);
        
        // If exam is started, calculate remaining time based on exam duration
        if (examStarted) {
          // Calculate time remaining from when exam was started
          const examDurationMs = examData.data.duration * 60 * 1000;
          // You might want to store the actual start time when exam begins
          // For now, we'll just show the full duration
          if (timeRemaining === null) {
            setTimeRemaining(examDurationMs);
          } else {
            const remaining = timeRemaining - 1000; // Decrease by 1 second
            if (remaining <= 0) {
              setTimeRemaining(0);
              setExamEnded(true);
            } else {
              setTimeRemaining(remaining);
            }
          }
        }
      } else {
        setCanStart(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [examData, examStarted, timeRemaining]);


  const handleStartExam = () => {
    if (!canStart) {
      toast.error(t("exam.cannotStartYet", { defaultValue: "Exam can only be started on the session date" }));
      return;
    }
    // Initialize timer with full exam duration
    const examDurationMs = examData.data.duration * 60 * 1000;
    setTimeRemaining(examDurationMs);
    setExamStarted(true);
    toast.success(t("exam.examStarted", { defaultValue: "Exam started successfully" }));
  };

  const handleEndExam = () => {
    setExamEnded(true);
    setExamStarted(false);
    toast.success(t("exam.examEnded", { defaultValue: "Exam ended successfully" }));
  };

  const formatTime = (ms) => {
    if (ms === null || ms === undefined) return "--:--:--";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return moment(dateString).format('MMM DD, YYYY');
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
  const firstSession = exam.first_session;

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
       
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
                {exam.name}
              </h2>
              <ExamStatusBadge status={exam.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {exam.uid} · {exam.total_questions} {t("exam.questions")} ·{" "}
              {exam.duration} {t("exam.minutes")}
            </p>
          </div>
        </div>
      </div>

      {/* Exam Session Card */}
      {firstSession && (
        <div className="border rounded-lg p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t("exam.examSession", { defaultValue: "Exam Session" })}</h3>
            {examStarted && !examEnded && (
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <Clock className="h-5 w-5 animate-pulse" />
                <span className="text-2xl font-mono font-bold">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("exam.sessionDate", { defaultValue: "Session Date" })}</p>
                <p className="font-medium">{formatDate(firstSession.session_date)}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {!examStarted && !examEnded && (
              <Button 
                onClick={handleStartExam}
                disabled={!canStart}
                className="flex items-center gap-2"
              >
                <PlayCircle className="h-4 w-4" />
                {t("exam.startExam", { defaultValue: "Start Exam" })}
              </Button>
            )}
            {examStarted && !examEnded && (
              <Button 
                onClick={handleEndExam}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <StopCircle className="h-4 w-4" />
                {t("exam.endExam", { defaultValue: "End Exam" })}
              </Button>
            )}
            {examEnded && (
              <div className="text-sm text-muted-foreground">
                {t("exam.examCompleted", { defaultValue: "Exam has been completed" })}
              </div>
            )}
            {!canStart && !examStarted && !examEnded && (
              <div className="text-sm text-muted-foreground">
                {t("exam.waitingForSession", { defaultValue: "Exam can only be started on the session date" })}
              </div>
            )}
          </div>
        </div>
      )}

      {exam.description && (
        <div className="p-4 border rounded-lg bg-muted/50">
          <p className="text-sm font-medium mb-1">{t("exam.detail.description")}</p>
          <p className="text-muted-foreground">{exam.description}</p>
        </div>
      )}

      {exam.module_name && (
        <div className="p-4 border rounded-lg bg-muted/50">
          <p className="text-sm font-medium mb-1">{t("exam.detail.module")}</p>
          <p className="text-lg">{exam.module_name}</p>
          <p className="text-sm text-muted-foreground">{exam.module_uid}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">
            {t("exam.detail.totalQuestions")}
          </p>
          <p className="text-xl font-semibold">{exam.total_questions}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">
            {t("exam.detail.totalMarks")}
          </p>
          <p className="text-xl font-semibold">{exam.total_marks}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">
            {t("exam.detail.passingMarks")}
          </p>
          <p className="text-xl font-semibold">
            {exam.passing_marks}{" "}
            {exam.passing_type === "percentage" ? "%" : ""}
          </p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">
            {t("exam.detail.duration")}
          </p>
          <p className="text-xl font-semibold">{exam.duration} min</p>
        </div>
      </div>


    </div>
  );
};

export default ExamDetail;
