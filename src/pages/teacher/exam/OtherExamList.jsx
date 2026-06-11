import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";
import { useGetTeacherOtherExams } from "@/store/useExamStore";
import { useNavigate } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";

const OtherExamList = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error, refetch, isFetching } = useGetTeacherOtherExams({
    page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const exams = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleRowClick = (exam) => {
    navigate({
      to: "/teacher/other-exams/$exam_id",
      params: {
        exam_id: exam.exam_id || exam._id?.exam_component_id || exam._id,
      },
    });
  };

  const getTypeBadge = (exam) => {
    const type = exam.type || exam.exam_type;
    if (type === "sit-at-home") {
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          {t("exam.type.sitAtHome", { defaultValue: "Sit-at-home" })}
        </Badge>
      );
    }
    if (type === "practical") {
      return (
        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
          {t("exam.type.practical", { defaultValue: "Practical" })}
        </Badge>
      );
    }
    return <span>—</span>;
  };

  return (
    <div className="space-y-6 mt-4">
      <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
        {t("sidebar.teacher.otherExams", { defaultValue: "Other Exams" })}
      </h2>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Input
          placeholder={t("exam.search")}
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("exam.table.name")}</TableHead>
            <TableHead>{t("exam.table.type", { defaultValue: "Type" })}</TableHead>
            <TableHead>{t("exam.table.batch", { defaultValue: "Batch" })}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={3} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center p-8">
                <ErrorMessage
                  message={error?.message || t("exam.messages.loadFailed")}
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : exams?.length > 0 ? (
            exams?.map((exam) => (
              <TableRow
                key={`${exam._id?.exam_component_id || exam.exam_id}-${exam._id?.planning_id || "direct"}`}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(exam)}
              >
                <TableCell className="font-medium">{exam?.name}</TableCell>
                <TableCell>{getTypeBadge(exam)}</TableCell>
                <TableCell>{exam?.batch?.name || exam?.batch_name || "—"}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center">
                {t("exam.table.noExams")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination
        page={page}
        setPage={setPage}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
        totalRows={totalRows}
      />
    </div>
  );
};

export default OtherExamList;
