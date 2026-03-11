import { useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import { ArrowLeft, Edit, Archive, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import {
  useGetExamById,
  usePublishExam,
  useArchiveExam,
} from "@/store/useExamStore";
import { LoadingState, ErrorMessage } from "@/components/common";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import ExamStatusBadge from "@/components/admin/exam/ExamStatusBadge";
import ExamForm from "@/components/admin/exam/ExamForm";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

const ExamDetail = () => {
  const { t } = useTranslation();
  const params = useParams({ strict: false });
  const id = params.id;
  const navigate = useNavigate();
  const { updateBreadcrumbs } = useBreadcrumb();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: examData, isLoading, error, refetch } = useGetExamById(id);
  const publishExam = usePublishExam();
  const archiveExam = useArchiveExam();

  useEffect(() => {
    if (examData?.data) {
      updateBreadcrumbs([
        {
          label: t("sidebar.admin.exams"),
          path: "/admin/examination/exams",
          navigable: true,
        },
        {
          label: examData.data.name,
          path: `/admin/examination/exams/${id}`,
          navigable: false,
        },
      ]);
    }
    return () => updateBreadcrumbs([]);
  }, [examData?.data?.name, id, t]);



  const handlePublish = async () => {
    try {
      await publishExam.mutateAsync(id);
      refetch();
    } catch (err) {
      // Error handled by store
    }
  };

  const handleArchive = async () => {
    try {
      await archiveExam.mutateAsync(id);
      refetch();
    } catch (err) {
      // Error handled by store
    }
  };

  const handleEdit = () => {
    if (examData?.data?.status === "published") {
      toast.error(t("exam.cannotEditPublished"));
      return;
    }
    setIsFormOpen(true);
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
        <div className="flex gap-2">
          {exam.status === "draft" && (
            <>
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                {t("exam.edit")}
              </Button>
              <Button onClick={handlePublish}>
                <Send className="h-4 w-4 mr-2" />
                {t("exam.publish")}
              </Button>
              <Button variant="outline" onClick={handleArchive}>
                <Archive className="h-4 w-4 mr-2" />
                {t("exam.archive")}
              </Button>
            </>
          )}
          {exam.status === "published" && (
            <Button variant="outline" onClick={handleArchive}>
              <Archive className="h-4 w-4 mr-2" />
              {t("exam.archive")}
            </Button>
          )}
        </div>
      </div>

      {exam.description && (
        <p className="text-muted-foreground">{exam.description}</p>
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

      {exam.question_sources && exam.question_sources.length > 0 && (
        <div>
          <h3 className="font-medium mb-2">{t("exam.detail.questionSources")}</h3>
          <div className="border rounded-lg divide-y">
            {exam.question_sources.map((src, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3"
              >
                <span>
                  {src.question_bank?.name || src.bank_name || "-"}
                </span>
                <span className="text-muted-foreground">
                  {src.count} {t("exam.questions")}
                  {src.available_count !== undefined && (
                    <span
                      className={
                        src.sufficient
                          ? "text-green-600 ml-1"
                          : "text-destructive ml-1"
                      }
                    >
                      ({src.available_count} {t("exam.detail.available")})
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ExamForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        examData={exam}
        onSuccess={() => {
          setIsFormOpen(false);
          refetch();
        }}
      />
    </div>
  );
};

export default ExamDetail;
