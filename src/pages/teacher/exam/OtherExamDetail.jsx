import { Fragment, useEffect, useState } from "react";
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
import AnswerSheetModal from "@/components/teacher/exam/AnswerSheetModal";
import StatusBadge from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/table/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { getMoment, formatInstant } from "@/utils/dateUtils";
import { ChevronDown, ChevronRight } from "lucide-react";

const OtherExamDetail = () => {
  const { t } = useTranslation();
  const params = useParams({ strict: false });
  const exam_id = params.exam_id;
  const { updateBreadcrumbs } = useBreadcrumb();

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [expandedRows, setExpandedRows] = useState({});
  const [answerSheetAttemptId, setAnswerSheetAttemptId] = useState(null);

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

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
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

  const getTypeBadge = () => {
    if (exam.type === "practical") {
      return (
        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
          {t("exam.type.practical", { defaultValue: "Practical" })}
        </Badge>
      );
    }
    return null;
  };

  const totalColumns = 6;

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
              <TableHead className="w-10 px-3"></TableHead>
              <TableHead className="px-4">
                {t("exam.detail.student", { defaultValue: "Student" })}
              </TableHead>
              <TableHead className="text-center">
                {t("exam.detail.attempts", { defaultValue: "Attempts" })}
              </TableHead>
              <TableHead className="text-center">
                {t("exam.detail.bestScore", { defaultValue: "Best Score" })}
              </TableHead>
              <TableHead className="text-center">
                {t("exam.detail.result", { defaultValue: "Result" })}
              </TableHead>
              <TableHead className="text-center px-6">
                {t("exam.detail.lastSubmitted", { defaultValue: "Last Submitted" })}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={studentsFetching ? "opacity-50 pointer-events-none" : ""}>
            {studentsLoading ? (
              <TableSkeleton rows={rowsPerPage} columns={totalColumns} />
            ) : studentsData?.data?.length > 0 ? (
              studentsData.data.map((item) => {
                const hasAttempts = item.attempts && item.attempts.length > 0;
                const isExpanded = expandedRows[item._id];

                return (
                  <Fragment key={item._id}>
                    {/* Main student row */}
                    <TableRow
                      className={`transition-colors ${hasAttempts ? "cursor-pointer hover:bg-muted/50" : ""}`}
                      onClick={() => hasAttempts && toggleRow(item._id)}
                    >
                      <TableCell className="px-3 py-4 w-10">
                        {hasAttempts ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 text-muted-foreground">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="px-4 py-4">
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
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-medium">
                          {item.attempts_count ?? 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {item.score !== null && item.score !== undefined
                          ? item.score
                          : "—"}
                        {item.percentage !== null && item.percentage !== undefined && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({item.percentage.toFixed(1)}%)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.result ? (
                          <StatusBadge status={item.result} />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {t("exam.detail.notTaken", { defaultValue: "Not taken" })}
                          </span>
                        )}
                      </TableCell>                      <TableCell className="text-center text-muted-foreground px-6 py-4">
                        {item.submitted_at
                          ? formatInstant(item.submitted_at)
                          : "—"}
                      </TableCell>
                    </TableRow>
 
                    {/* Expanded attempts rows */}
                    {isExpanded && hasAttempts && item.attempts.map((attempt) => (
                      <TableRow
                        key={attempt._id}
                        className="bg-muted/30 dark:bg-muted/10 cursor-pointer hover:bg-muted/50"
                        onClick={() => setAnswerSheetAttemptId(attempt._id)}
                      >
                        <TableCell className="px-3 py-2"></TableCell>
                        <TableCell className="px-4 py-2">
                          <span className="text-sm text-muted-foreground pl-4">
                            {t("exam.detail.attemptLabel", {
                              defaultValue: "Attempt",
                            })}{" "}
                            #{attempt.attempt_number}
                          </span>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <StatusBadge status={attempt.status} />
                        </TableCell>
                        <TableCell className="text-center font-medium py-2">
                          {attempt.score !== null && attempt.score !== undefined
                            ? attempt.score
                            : "—"}
                          {attempt.percentage !== null && attempt.percentage !== undefined && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({attempt.percentage.toFixed(1)}%)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center py-2">
                          {attempt.result ? (
                            <StatusBadge status={attempt.result} />
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground px-6 py-2">
                          {attempt.submitted_at
                            ? formatInstant(attempt.submitted_at)
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={totalColumns}
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

      <AnswerSheetModal
        open={!!answerSheetAttemptId}
        attemptId={answerSheetAttemptId}
        onClose={() => setAnswerSheetAttemptId(null)}
      />
    </div>
  );
};

export default OtherExamDetail;

