import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Badge } from "@/components/ui/badge";
import { useGetOtherExamDetail, useGetOtherExamStudents } from "@/store/useExamStore";
import { LoadingState, ErrorMessage } from "@/components/common";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import StatusBadge from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/table/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { getMoment } from "@/utils/dateUtils";

const OtherExamDetail = () => {
  const { t } = useTranslation();
  const params = useParams({ strict: false });
  const exam_id = params.exam_id;
  const { updateBreadcrumbs } = useBreadcrumb();

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const {
    data: examData,
    isLoading,
    error,
    refetch,
  } = useGetOtherExamDetail(exam_id);

  const {
    data: studentsData,
    isLoading: studentsLoading,
    isFetching: studentsFetching,
  } = useGetOtherExamStudents(exam_id, {
    page,
    limit: rowsPerPage,
    search: debouncedSearch,
  });

  useEffect(() => {
    if (examData?.data) {
      updateBreadcrumbs([
        {
          label: t("sidebar.teacher.otherExams", { defaultValue: "Other Exams" }),
          path: "/teacher/other-exams",
          navigable: true,
        },
        {
          label: examData.data.name,
          path: `/teacher/other-exams/${exam_id}`,
          navigable: false,
        },
      ]);
    }
    return () => updateBreadcrumbs([]);
  }, [examData?.data?.name, t]);

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

  const getTypeBadge = () => {
    if (exam.type === "sit-at-home") {
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          {t("exam.type.sitAtHome", { defaultValue: "Sit-at-home" })}
        </Badge>
      );
    }
    if (exam.type === "practical") {
      return (
        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
          {t("exam.type.practical", { defaultValue: "Practical" })}
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-semibold text-dashboard-text dark:text-white">
          {exam.name}
        </h2>
        {getTypeBadge()}
      </div>

      {exam.batch && (
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-dashboard-text dark:text-white">
            {t("exam.table.batch", { defaultValue: "Batch" })}:
          </span>{" "}
          {exam.batch.name}
        </div>
      )}

      {/* Student Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-dashboard-text dark:text-white">
            {t("exam.detail.studentResults", { defaultValue: "Student Results" })}
          </h3>
          <Input
            placeholder={t("exam.searchStudents", { defaultValue: "Search students..." })}
            className="max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6">
                {t("exam.detail.student", { defaultValue: "Student" })}
              </TableHead>
              <TableHead className="text-center">
                {t("exam.detail.score", { defaultValue: "Score" })}
              </TableHead>
              <TableHead className="text-center">
                {t("exam.detail.percentage", { defaultValue: "Percentage" })}
              </TableHead>
              <TableHead className="text-center">
                {t("exam.detail.result", { defaultValue: "Result" })}
              </TableHead>
              <TableHead className="text-center px-6">
                {t("exam.detail.submittedAt", { defaultValue: "Submitted At" })}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={studentsFetching ? "opacity-50 pointer-events-none" : ""}>
            {studentsLoading ? (
              <TableSkeleton rows={rowsPerPage} columns={5} />
            ) : studentsData?.data?.length > 0 ? (
              studentsData.data.map((item) => (
                <TableRow
                  key={item._id}
                  className="transition-colors hover:bg-muted/50"
                >
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium capitalize">
                        {item.student?.last_name}{" "}
                        {item.student?.first_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.student?.uid}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {item.score ?? "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.percentage !== null && item.percentage !== undefined
                      ? `${item.percentage.toFixed(2)}%`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.result ? (
                      <StatusBadge status={item.result} />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {t("exam.detail.notTaken", { defaultValue: "Not taken" })}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground px-6 py-4">
                    {item.submitted_at
                      ? getMoment(item.submitted_at).format("DD-MM-YYYY, HH:mm")
                      : "—"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  {t("common.noResultsFound", {
                    defaultValue: "No students found.",
                  })}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {studentsData?.total_count > 0 && (
          <Pagination
            page={page}
            setPage={setPage}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            totalRows={studentsData?.total_count || 0}
          />
        )}
      </div>
    </div>
  );
};

export default OtherExamDetail;
