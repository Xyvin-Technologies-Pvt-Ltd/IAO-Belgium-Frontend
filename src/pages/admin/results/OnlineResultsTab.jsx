import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useGetAdminExamResults, exportAdminExamResults } from "@/store/useExamStore";
import ResultsFilterDrawer from "./ResultsFilterDrawer";
import StatusBadge from "@/components/StatusBadge";
import ErrorMessage from "@/components/common/ErrorMessage";
import moment from "moment";
import { toast } from "sonner";
import { formatInstant } from "@/utils/dateUtils";

const OnlineResultsTab = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const [appliedFilters, setAppliedFilters] = useState({
    program: "all",
    batch: "all",
    academic: "all",
    exam: "all",
    failed: false,
  });

  const [draftFilters, setDraftFilters] = useState({
    program: "all",
    batch: "all",
    academic: "all",
    exam: "all",
    failed: false,
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, appliedFilters]);

  const {
    data: resultsData,
    isLoading: resultsLoading,
    isFetching,
    error,
    refetch,
  } = useGetAdminExamResults({
    page,
    limit: rowsPerPage,
    search: debouncedSearch,
    program: appliedFilters.program !== "all" ? appliedFilters.program : undefined,
    batch: appliedFilters.batch !== "all" ? appliedFilters.batch : undefined,
    academic: appliedFilters.academic !== "all" ? appliedFilters.academic : undefined,
    exam: appliedFilters.exam !== "all" ? appliedFilters.exam : undefined,
    failed: appliedFilters.failed ? true : undefined,
  });

  const results = resultsData?.data || [];
  const totalRows = resultsData?.total_count || 0;

  const handleExport = async () => {
    const toastId = toast.loading("Preparing CSV export...");
    try {
      const params = {
        export: true,
        program: appliedFilters.program !== "all" ? appliedFilters.program : undefined,
        batch: appliedFilters.batch !== "all" ? appliedFilters.batch : undefined,
        academic: appliedFilters.academic !== "all" ? appliedFilters.academic : undefined,
        exam: appliedFilters.exam !== "all" ? appliedFilters.exam : undefined,
        failed: appliedFilters.failed ? true : undefined,
        search: debouncedSearch || undefined,
      };

      const response = await exportAdminExamResults(params);
      const exportResults = response?.data || [];

      if (exportResults.length === 0) {
        toast.error("No results to export matching applied filters.", { id: toastId });
        return;
      }

      const headers = [
        "Student Name",
        "Student UID",
        "Email",
        "Program",
        "Batch",
        "Academic Year",
        "Exam Name",
        "Score",
        "Percentage",
        "Status",
        "Submitted Date"
      ];

      const csvRows = [
        headers.join(","),
        ...exportResults.map((row) => {
          const studentName = `${row.student?.first_name || ""} ${row.student?.last_name || ""}`.trim();
          const studentUid = row.student?.uid || "";
          const email = row.student?.email || "";
          const program = row.program?.name || "";
          const batch = row.batch?.name || "";
          const academicYear = row.academic?.name || "";
          const examName = row.exam?.name || "";
          const score = row.score !== undefined && row.score !== null ? row.score : "N/A";
          const percentage = row.percentage !== undefined && row.percentage !== null ? `${Math.round(row.percentage * 100) / 100}%` : "N/A";
          const status = row.result || row.status || "N/A";
          const date = row.submitted_at ? formatInstant(row.submitted_at, "YYYY-MM-DD HH:mm:ss") : "N/A";

          return [
            `"${studentName.replace(/"/g, '""')}"`,
            `"${studentUid.replace(/"/g, '""')}"`,
            `"${email.replace(/"/g, '""')}"`,
            `"${program.replace(/"/g, '""')}"`,
            `"${batch.replace(/"/g, '""')}"`,
            `"${academicYear.replace(/"/g, '""')}"`,
            `"${examName.replace(/"/g, '""')}"`,
            `"${String(score).replace(/"/g, '""')}"`,
            `"${percentage.replace(/"/g, '""')}"`,
            `"${status.replace(/"/g, '""')}"`,
            `"${date.replace(/"/g, '""')}"`
          ].join(",");
        }),
      ];

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `online_exam_results_${moment().format("YYYYMMDD_HHmmss")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Results exported successfully!", { id: toastId });
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export exam results.", { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 flex items-center gap-2">
          <Input
            placeholder={t("resultsManagement.searchPlaceholder")}
            className="pl-9 bg-sidebar border-sidebar-border max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ResultsFilterDrawer
            draftFilters={draftFilters}
            setDraftFilters={setDraftFilters}
            appliedFilters={appliedFilters}
            setAppliedFilters={setAppliedFilters}
            setPage={setPage}
          />
        </div>
        <Button onClick={handleExport} className="flex items-center gap-2 bg-[#ff8904] hover:bg-[#ff8904]/90 text-white font-medium">
          <Download className="h-4 w-4" />
          {t("resultsManagement.exportBtn")}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("resultsManagement.table.student")}</TableHead>
            <TableHead>{t("resultsManagement.table.uid")}</TableHead>
            <TableHead>{t("resultsManagement.table.program")}</TableHead>
            <TableHead>{t("resultsManagement.table.batch")}</TableHead>
            <TableHead>{t("resultsManagement.table.academic")}</TableHead>
            <TableHead>{t("resultsManagement.table.exam")}</TableHead>
            <TableHead>{t("resultsManagement.table.score")}</TableHead>
            <TableHead>{t("resultsManagement.table.status")}</TableHead>
            <TableHead>{t("resultsManagement.table.date")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {resultsLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={9} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center p-8">
                <ErrorMessage
                  message={error?.message || t("resultsManagement.messages.loadFailed")}
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : results?.length > 0 ? (
            results.map((row) => (
              <TableRow key={row._id} className="hover:bg-muted/50">
                <TableCell className="font-medium text-dashboard-text dark:text-white">
                  {`${row.student?.first_name || ""} ${row.student?.last_name || ""}`.trim() || "N/A"}
                </TableCell>
                <TableCell className="text-gray-500 dark:text-white/60">{row.student?.uid || "N/A"}</TableCell>
                <TableCell>{row.program?.name || "N/A"}</TableCell>
                <TableCell>{row.batch?.name || "N/A"}</TableCell>
                <TableCell>{row.academic?.name || "N/A"}</TableCell>
                <TableCell className="max-w-[200px] truncate font-medium" title={row.exam?.name}>
                  {row.exam?.name || "N/A"}
                </TableCell>
                <TableCell className="font-semibold text-dashboard-text dark:text-white">
                  {row.score !== undefined && row.score !== null ? (
                    <span>
                      {row.score}
                      {row.percentage !== undefined && row.percentage !== null && (
                        <span className="text-xs text-gray-500 dark:text-white/50 font-normal ml-1">
                          ({Math.round(row.percentage * 100) / 100}%)
                        </span>
                      )}
                    </span>
                  ) : (
                    "N/A"
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.result || row.status || "N/A"} />
                </TableCell>
                <TableCell className="text-gray-500 dark:text-white/60">
                  {row.submitted_at ? formatInstant(row.submitted_at, "DD-MM-YYYY HH:mm") : "N/A"}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-gray-400">
                {t("resultsManagement.table.noResults")}
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

export default OnlineResultsTab;
