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
import DashboardCard from "@/components/admin/dashboard/DashboardCard";
import { HelpCircle, GraduationCap, Timer } from "lucide-react";
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DashboardCard
          title={t("exam.detail.totalQuestions")}
          value={exam.total_questions?.toString()}
          icon={HelpCircle}
        />
        <DashboardCard
          title={t("exam.detail.totalMarks")}
          value={exam.total_marks?.toString()}
          icon={GraduationCap}
        />
        <DashboardCard
          title={exam.passing_type === "percentage" ? t("exam.detail.passingPercentage", "Passing Percentage") : t("exam.detail.passingMarks")}
          value={`${exam.passing_type === "percentage" ? (exam.passing_percentage ?? exam.passing_marks ?? 0) : (exam.passing_marks ?? exam.passing_percentage ?? 0)} ${exam.passing_type === "percentage" ? "%" : ""}`}
        />
        <DashboardCard
          title={t("exam.detail.duration")}
          value={`${exam.duration || 0} ${t("common.mins")}`}
          icon={Timer}
        />
      </div>

      {exam.description && (
        <div className="p-5 border rounded-lg bg-card text-card-foreground shadow-sm">
          <p className="text-sm font-bold mb-2">{t("common.description")}</p>
          <p className="text-sm text-card-foreground/80">{exam.description}</p>
        </div>
      )}

      {exam.instructions && (
        <div className="p-5 border rounded-lg bg-card text-card-foreground shadow-sm">
          <p className="text-sm font-bold mb-2">{t("common.instructions")}</p>
          <div className="text-sm text-card-foreground/80 whitespace-pre-wrap">
            {exam.instructions}
          </div>
        </div>
      )}

      {exam.question_sources && exam.question_sources.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-dashboard-text dark:text-white mb-4">
            {t("exam.detail.questionSources")}
          </h3>
          <div className="border rounded-lg overflow-hidden bg-white dark:bg-card text-card-foreground shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#f4f4f5] dark:bg-muted text-muted-foreground text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4 border-b">{t("common.source")}</th>
                  <th className="px-6 py-4 border-b">{t("common.numberOfQuestions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {exam.question_sources.map((src, idx) => (
                  <tr key={idx} className="transition-colors">
                    <td className="px-6 py-4">
                      {src.question_bank?.name || src.bank_name || "-"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {src.count} {t("exam.questions")}{" "}
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
