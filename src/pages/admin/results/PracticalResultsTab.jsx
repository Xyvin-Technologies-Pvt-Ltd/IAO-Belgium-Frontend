import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useGetAdminPracticalExamResults, exportAdminPracticalExamResults } from "@/store/useExamStore";
import ResultsFilterDrawer from "./ResultsFilterDrawer";
import AssignResitDialog from "./AssignResitDialog";
import StatusBadge from "@/components/StatusBadge";
import ErrorMessage from "@/components/common/ErrorMessage";
import moment from "moment";
import { toast } from "sonner";
import { formatInstant } from "@/utils/dateUtils";
import { useNavigate } from "@tanstack/react-router";
import { useCanModify } from "@/hooks/useCanModify";

const PracticalResultsTab = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const canModify = useCanModify("operations");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [selected, setSelected] = useState({});
  const [assignOpen, setAssignOpen] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState({
    program: "all",
    batch: "all",
    academic: "all",
    exam: "all",
    failed: false,
    pending_admin_score: false,
  });

  const [draftFilters, setDraftFilters] = useState({
    program: "all",
    batch: "all",
    academic: "all",
    exam: "all",
    failed: false,
    pending_admin_score: false,
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
  } = useGetAdminPracticalExamResults({
    page,
    limit: rowsPerPage,
    search: debouncedSearch,
    program: appliedFilters.program !== "all" ? appliedFilters.program : undefined,
    batch: appliedFilters.batch !== "all" ? appliedFilters.batch : undefined,
    academic: appliedFilters.academic !== "all" ? appliedFilters.academic : undefined,
    exam: appliedFilters.exam !== "all" ? appliedFilters.exam : undefined,
    failed: appliedFilters.failed ? true : undefined,
    pending_admin_score: appliedFilters.pending_admin_score ? true : undefined,
  });

  const results = resultsData?.data || [];
  const totalRows = resultsData?.total_count || 0;
  const selectedList = Object.values(selected);
  const selectedExamIds = [...new Set(selectedList.map((s) => s.examId))];
  const canAssign = selectedList.length > 0 && selectedExamIds.length === 1;

  const rowKey = (row) => `${row.planned_practical_exam._id}-${row.student._id}`;

  const toggleRow = (row, e) => {
    e?.stopPropagation();
    const key = rowKey(row);
    setSelected((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else {
        next[key] = {
          applicationId: row.student?._id,
          examId: row.exam?._id,
        };
      }
      return next;
    });
  };

  const handleOpenAssign = () => {
    if (!canAssign) {
      toast.error(
        t(
          "resultsManagement.resit.sameExam",
          "Select failed students from the same exam to assign a resit.",
        ),
      );
      return;
    }
    setAssignOpen(true);
  };



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
        pending_admin_score: appliedFilters.pending_admin_score ? true : undefined,
        search: debouncedSearch || undefined,
      };

      const response = await exportAdminPracticalExamResults(params);
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
        "Exam Name",
        "Official Admin Score",
        "Percentage",
        "Result Status",
        "Date Decided",
        "Resit Assigned",
        "Resit Score",
        "Resit Status",
      ];

      const csvRows = [
        headers.join(","),
        ...exportResults.map((row) => {
          const studentName = `${row.student?.first_name || ""} ${row.student?.last_name || ""}`.trim();
          const studentUid = row.student?.uid || "";
          const email = row.student?.email || "";
          const program = row.program?.name || "";
          const batch = row.batch?.name || "";
          const examName = row.exam?.name || "";
          const adminScore = row.admin_score !== undefined && row.admin_score !== null ? row.admin_score : "Pending";
          const percentage = row.percentage !== undefined && row.percentage !== null ? `${Math.round(row.percentage * 100) / 100}%` : "Pending";
          const result = row.result || "Pending";
          const date = row.decided_at ? formatInstant(row.decided_at, "YYYY-MM-DD HH:mm:ss") : "N/A";
          const resitAssigned = row.resit_assigned ? "Yes" : "No";
          const resitScore = row.resit_score !== undefined && row.resit_score !== null ? row.resit_score : "N/A";
          const resitStatus = row.resit_result || "N/A";

          return [
            `"${studentName.replace(/"/g, '""')}"`,
            `"${studentUid.replace(/"/g, '""')}"`,
            `"${email.replace(/"/g, '""')}"`,
            `"${program.replace(/"/g, '""')}"`,
            `"${batch.replace(/"/g, '""')}"`,
            `"${examName.replace(/"/g, '""')}"`,
            `"${String(adminScore).replace(/"/g, '""')}"`,
            `"${percentage.replace(/"/g, '""')}"`,
            `"${result.replace(/"/g, '""')}"`,
            `"${date.replace(/"/g, '""')}"`,
            `"${resitAssigned}"`,
            `"${String(resitScore).replace(/"/g, '""')}"`,
            `"${String(resitStatus).replace(/"/g, '""')}"`,
          ].join(",");
        }),
      ];

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `practical_exam_results_${moment().format("YYYYMMDD_HHmmss")}.csv`);
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
            examType="practical"
            showPendingScoreFilter={true}
          />
        </div>
        <Button onClick={handleExport} className="flex items-center gap-2 bg-[#ff8904] hover:bg-[#ff8904]/90 text-white font-medium">
          <Download className="h-4 w-4" />
          {t("resultsManagement.exportBtn")}
        </Button>
        {canModify && (
          <Button
            variant="outline"
            onClick={handleOpenAssign}
            disabled={selectedList.length === 0}
          >
            {t("resultsManagement.resit.assignBtn", "Assign resit")}
            {selectedList.length > 0 ? ` (${selectedList.length})` : ""}
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead>{t("resultsManagement.table.student")}</TableHead>
            <TableHead>{t("resultsManagement.table.program")}</TableHead>
            <TableHead>{t("resultsManagement.table.batch")}</TableHead>
            <TableHead>{t("resultsManagement.table.exam")}</TableHead>

            <TableHead>{t("resultsManagement.table.adminScore", "Admin Score")}</TableHead>
            <TableHead>{t("resultsManagement.table.status")}</TableHead>
            <TableHead>{t("resultsManagement.table.resit", "Resit")}</TableHead>
            <TableHead>{t("resultsManagement.table.resitScore", "Resit score")}</TableHead>
            <TableHead>{t("resultsManagement.table.date")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {resultsLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={10} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center p-8">
                <ErrorMessage
                  message={error?.message || t("resultsManagement.messages.loadFailed")}
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : results?.length > 0 ? (
            results.map((row) => (
              <TableRow
                key={`${row.planned_practical_exam._id}-${row.student._id}`}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() =>
                  navigate({
                    to: `/admin/results/practical/$plannedId/student/$applicationId`,
                    params: {
                      plannedId: row.planned_practical_exam._id,
                      applicationId: row.student._id,
                    },
                  })
                }
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={!!selected[rowKey(row)]}
                    onCheckedChange={() => toggleRow(row)}
                    disabled={row.result !== "fail" || row.resit_assigned}
                  />
                </TableCell>
                <TableCell className="font-medium text-dashboard-text dark:text-white">
                  <div>
                    <span>{`${row.student?.first_name || ""} ${row.student?.last_name || ""}`.trim() || "N/A"}</span>
                    <span className="text-xs text-muted-foreground block">{row.student?.uid}</span>
                  </div>
                </TableCell>
                <TableCell>{row.program?.name || "N/A"}</TableCell>
                <TableCell>{row.batch?.name || "N/A"}</TableCell>
                <TableCell className="max-w-[150px] truncate font-medium" title={row.exam?.name}>
                  {row.exam?.name || "N/A"}
                </TableCell>

                <TableCell className="font-semibold text-dashboard-text dark:text-white">
                  {row.admin_score !== undefined && row.admin_score !== null ? (
                    <span>
                      {row.admin_score} / {row.exam?.total_marks}
                      {row.percentage !== undefined && row.percentage !== null && (
                        <span className="text-xs text-gray-500 dark:text-white/50 font-normal ml-1">
                          ({Math.round(row.percentage * 100) / 100}%)
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic text-xs">
                      {row.can_set_result ? t("exam.results.pendingAdmin", "Pending entry") : t("exam.results.waitingTeachersShort", "Waiting")}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.result || "pending"} />
                </TableCell>
                <TableCell>
                  {row.resit_assigned
                    ? t("resultsManagement.resit.assigned", "Assigned")
                    : t("resultsManagement.resit.notAssigned", "—")}
                </TableCell>
                <TableCell>
                  {row.resit_result ? (
                    <span>
                      {row.resit_score ?? "—"}{" "}
                      <StatusBadge status={row.resit_result} />
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-gray-500 dark:text-white/60">
                  {row.decided_at ? formatInstant(row.decided_at, "DD-MM-YYYY") : "N/A"}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-gray-400">
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
      <AssignResitDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        parentExamId={selectedExamIds[0]}
        applicationIds={selectedList.map((s) => s.applicationId)}
        onAssigned={() => setSelected({})}
      />
    </div>
  );
};

export default PracticalResultsTab;
