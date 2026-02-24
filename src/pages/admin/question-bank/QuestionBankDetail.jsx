import { useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useGetQuestionBankById } from "@/store/useQuestionBankStore";
import { LoadingState, ErrorMessage } from "@/components/common";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import QuestionList from "@/components/admin/question-bank/QuestionList";
import { useNavigate } from "@tanstack/react-router";

const QuestionBankDetail = () => {
  const { t } = useTranslation();
  const params = useParams({ strict: false });
  const id = params.id;
  const navigate = useNavigate();
  const { updateBreadcrumbs } = useBreadcrumb();

  const { data: bank, isLoading, error, refetch } = useGetQuestionBankById(id);

  useEffect(() => {
    if (bank?.data) {
      updateBreadcrumbs([
        {
          label: t("sidebar.admin.questionBanks"),
          path: "/admin/examination/question-banks",
          navigable: false,
        },
        {
          label: bank.data.name,
          path: `/admin/examination/question-banks/${id}`,
          navigable: false,
        },
      ]);
    }
    return () => updateBreadcrumbs([]);
  }, [bank?.data?.name, id, t]);

  const handleBack = () => {
    navigate({ to: "/admin/examination/question-banks" });
  };

  if (isLoading) {
    return <LoadingState text={t("questionBank.loading")} fullHeight />;
  }

  if (error || !bank?.data) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={error?.message || t("questionBank.messages.loadFailed")}
          onRetry={refetch}
          variant="card"
        />
      </div>
    );
  }

  const b = bank.data;

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
            {b.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {b.uid} · {b.question_count ?? 0} {t("questionBank.questions")}
          </p>
        </div>
      </div>
      {b.description && (
        <p className="text-muted-foreground">{b.description}</p>
      )}
      <QuestionList questionBankId={id} />
    </div>
  );
};

export default QuestionBankDetail;
