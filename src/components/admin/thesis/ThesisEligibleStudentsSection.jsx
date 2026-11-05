import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Plus, Trash2, Download, Users } from "lucide-react";

import { useDebounce } from "@/hooks/useDebounce";
import { ErrorMessage } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table/table";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import AddEligibleStudentsModal from "@/components/admin/thesis/AddEligibleStudentsModal";
import DeleteConfirm from "@/components/DeleteConfirm";
import {
  useGetThesisEligibleStudents,
  useRemoveThesisEligibleStudent,
  useExportThesisEligibleStudentsCsv,
} from "@/store/useThesisStore";

export default function ThesisEligibleStudentsSection({
  thesisId,
  canModify = false,
}) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState(null);
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);

  const params = {
    page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  const {
    data: response,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetThesisEligibleStudents(thesisId, params, {
    enabled: !!thesisId,
  });

  const removeMutation = useRemoveThesisEligibleStudent();
  const exportCsvMutation = useExportThesisEligibleStudentsCsv();

  const students = response?.data?.students || [];
  const totalRows = response?.total_count ?? response?.data?.total_count ?? 0;

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleExportCsv = () => {
    const { page: _page, limit: _limit, ...exportParams } = params;
    exportCsvMutation.mutate({ thesisId, params: exportParams });
  };

  const handleConfirmRemove = async () => {
    if (!studentToRemove?._id) return;
    try {
      await removeMutation.mutateAsync({
        thesisId,
        userId: studentToRemove._id,
      });
      setIsRemoveConfirmOpen(false);
      setStudentToRemove(null);
    } catch {
      // Error toast from hook
    }
  };

  return (
    <div className="space-y-4 pt-6 border-t border-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            {t(
              "thesisManagement.trajectories.eligibleStudents",
              "Eligible students"
            )}
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {canModify && (
            <Button
              size="sm"
              className="gap-2 h-9"
              onClick={() => setIsAddOpen(true)}
            >
              <Plus className="w-4 h-4" />
              {t(
                "thesisManagement.trajectories.addEligibleStudents",
                "Add students"
              )}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={exportCsvMutation.isPending}
            className="gap-2 h-9"
          >
            <Download className="w-4 h-4" />
            {exportCsvMutation.isPending
              ? t("common.exporting", "Exporting...")
              : t("common.exportCsv", "Export CSV")}
          </Button>
        </div>
      </div>

      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t(
            "common.search",
            "Search by student name or UID..."
          )}
          value={search}
          onChange={handleSearchChange}
          className="pl-9 h-9 text-xs sm:text-sm"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              {t("thesisManagement.table.studentUid", "Student UID")}
            </TableHead>
            <TableHead>
              {t("thesisManagement.table.studentName", "Student Name")}
            </TableHead>
            <TableHead>{t("common.email", "Email")}</TableHead>
            <TableHead>
              {t("thesisManagement.table.group", "Group")}
            </TableHead>
            <TableHead>
              {t("thesisManagement.table.purchase", "Purchase")}
            </TableHead>
            <TableHead>
              {t(
                "thesisManagement.table.enrolledTrajectory",
                "Enrolled trajectory"
              )}
            </TableHead>
            <TableHead>
              {t("thesisManagement.table.source", "Source")}
            </TableHead>
            {canModify && (
              <TableHead className="text-right">
                {t("common.actions", "Actions")}
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody
          className={isFetching ? "opacity-50 pointer-events-none" : ""}
        >
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={canModify ? 8 : 7} />
          ) : error ? (
            <TableRow>
              <TableCell
                colSpan={canModify ? 8 : 7}
                className="text-center p-8"
              >
                <ErrorMessage
                  message={
                    error?.message ||
                    t("common.failedToLoad", "Failed to load data")
                  }
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : students?.length > 0 ? (
            students.map((row) => {
              const student = row.student;
              const studentName = student
                ? `${student.first_name || ""} ${student.last_name || ""}`.trim() ||
                  student.email
                : t(
                    "thesisManagement.trajectories.unknownStudent",
                    "Unknown Student"
                  );
              const isManual = row.source === "manual";

              return (
                <TableRow key={row.application?._id || student?._id}>
                  <TableCell>{student?.uid || "-"}</TableCell>
                  <TableCell>{studentName}</TableCell>
                  <TableCell>{student?.email || "-"}</TableCell>
                  <TableCell>{row.batch?.name || "-"}</TableCell>
                  <TableCell>
                    <span
                      className={`text-xs font-medium ${
                        row.purchased
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {row.purchased
                        ? t(
                            "thesisManagement.trajectories.purchased",
                            "Purchased"
                          )
                        : t(
                            "thesisManagement.trajectories.notPurchased",
                            "Not purchased"
                          )}
                    </span>
                  </TableCell>
                  <TableCell>
                    {row.enrolled_trajectory?.name || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium text-muted-foreground">
                      {isManual
                        ? t(
                            "thesisManagement.trajectories.sourceManual",
                            "Manual"
                          )
                        : row.source === "enrolled"
                          ? t(
                              "thesisManagement.trajectories.sourceEnrolled",
                              "Enrolled"
                            )
                          : t(
                              "thesisManagement.trajectories.sourceRules",
                              "Rules"
                            )}
                    </span>
                  </TableCell>
                  {canModify && (
                    <TableCell className="text-right">
                      {isManual ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => {
                            setStudentToRemove(student);
                            setIsRemoveConfirmOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={canModify ? 8 : 7}
                className="text-center py-6 text-muted-foreground"
              >
                {search
                  ? t(
                      "common.noResultsFound",
                      "No students match your search query."
                    )
                  : t(
                      "thesisManagement.trajectories.noEligibleStudents",
                      "No eligible students found for this thesis."
                    )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {totalRows > 0 && (
        <Pagination
          page={page}
          setPage={setPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          totalRows={totalRows}
        />
      )}

      {canModify && isAddOpen && (
        <AddEligibleStudentsModal
          open={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          thesisId={thesisId}
        />
      )}

      <DeleteConfirm
        open={isRemoveConfirmOpen}
        onClose={() => {
          setIsRemoveConfirmOpen(false);
          setStudentToRemove(null);
        }}
        onConfirm={handleConfirmRemove}
        count={1}
        data={
          studentToRemove
            ? `${studentToRemove.first_name || ""} ${studentToRemove.last_name || ""}`.trim() ||
              studentToRemove.email ||
              studentToRemove.uid
            : ""
        }
        isLoading={removeMutation.isPending}
      />
    </div>
  );
}
