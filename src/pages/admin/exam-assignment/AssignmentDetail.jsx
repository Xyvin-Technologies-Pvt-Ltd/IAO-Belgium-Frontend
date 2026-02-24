import { useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useGetExamAssignmentById } from "@/store/useExamAssignmentStore";
import { LoadingState, ErrorMessage } from "@/components/common";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import ResultsTable from "@/components/admin/exam-assignment/ResultsTable";
import { useNavigate } from "@tanstack/react-router";

const AssignmentDetail = () => {
  const { t } = useTranslation();
  const params = useParams({ strict: false });
  const id = params.id;
  const navigate = useNavigate();
  const { updateBreadcrumbs } = useBreadcrumb();

  const { data: assignmentData, isLoading, error, refetch } =
    useGetExamAssignmentById(id);

  useEffect(() => {
    if (assignmentData?.data) {
      updateBreadcrumbs([
        {
          label: t("sidebar.admin.examAssignments"),
          path: "/admin/examination/assignments",
          navigable: false,
        },
        {
          label: `${assignmentData.data.exam?.name || "Assignment"} - Results`,
          path: `/admin/examination/assignments/${id}`,
          navigable: false,
        },
      ]);
    }
    return () => updateBreadcrumbs([]);
  }, [assignmentData?.data?.exam?.name, id, t]);

  const handleBack = () => {
    navigate({ to: "/admin/examination/assignments" });
  };

  if (isLoading) {
    return <LoadingState text={t("examAssignment.loading")} fullHeight />;
  }

  if (error || !assignmentData?.data) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={
            error?.message || t("examAssignment.messages.loadFailed")
          }
          onRetry={refetch}
          variant="card"
        />
      </div>
    );
  }

  const a = assignmentData.data;

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
            {a.exam?.name} - {t("examAssignment.results.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {a.uid} · {a.program?.name || "-"} · {a.batch?.name || "-"}
          </p>
          <p className="text-sm text-muted-foreground">
            {new Date(a.start_date).toLocaleString()} -{" "}
            {new Date(a.end_date).toLocaleString()}
          </p>
        </div>
      </div>
      <ResultsTable assignmentId={id} />
    </div>
  );
};

export default AssignmentDetail;
