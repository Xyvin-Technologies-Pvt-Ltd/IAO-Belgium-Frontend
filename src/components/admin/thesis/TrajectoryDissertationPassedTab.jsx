import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import moment from "moment";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { ErrorMessage } from "@/components/common";
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
import { useGetTrajectoryDissertationPassed } from "@/store/useThesisStore";

const studentDisplayName = (student, t) => {
  if (!student) {
    return t("thesisManagement.trajectories.unknownStudent", "Unknown Student");
  }
  const name =
    `${student.first_name || ""} ${student.last_name || ""}`.trim() ||
    student.email;
  return name || "—";
};

export default function TrajectoryDissertationPassedTab({
  thesisId,
  trajectoryId,
  basePath,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const queryParams = {
    page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  const { data, isLoading, isFetching, error, refetch } =
    useGetTrajectoryDissertationPassed(thesisId, trajectoryId, queryParams, {
      enabled: Boolean(thesisId && trajectoryId),
    });

  const rows = data?.data || [];
  const totalCount = data?.total_count || 0;

  const handleRowClick = (row) => {
    if (!row?.user_id) return;
    navigate({
      to: `${basePath}/$id/trajectories/$trajectoryId/students/$userId`,
      params: {
        id: thesisId,
        trajectoryId,
        userId: String(row.user_id),
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(
              "thesisManagement.oralDefence.search",
              "Search students..."
            )}
            className="pl-9"
          />
        </div>
      </div>

      {error ? (
        <ErrorMessage
          message={error?.message || "Failed to load students"}
          onRetry={refetch}
        />
      ) : isLoading ? (
        <TableSkeleton rows={rowsPerPage} columns={6} />
      ) : (
        <>
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {t("thesisManagement.trajectories.student", "Student")}
                  </TableHead>
                  <TableHead>
                    {t("thesisManagement.trajectories.batch", "Batch")}
                  </TableHead>
                  <TableHead>
                    {t(
                      "thesisManagement.dissertationPassed.dissertationResult",
                      "Dissertation"
                    )}
                  </TableHead>
                  <TableHead>
                    {t(
                      "thesisManagement.dissertationPassed.oralSchedule",
                      "Oral schedule"
                    )}
                  </TableHead>
                  <TableHead>
                    {t(
                      "thesisManagement.dissertationPassed.oralResult",
                      "Oral result"
                    )}
                  </TableHead>
                  <TableHead>
                    {t(
                      "thesisManagement.dissertationPassed.attemptStatus",
                      "Attempt"
                    )}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-10"
                    >
                      {t(
                        "thesisManagement.oralDefence.empty",
                        "No oral defence candidates found"
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow
                      key={String(row.user_id || row.attempt_id)}
                      className={`cursor-pointer hover:bg-muted/40 ${
                        isFetching ? "opacity-70" : ""
                      }`}
                      onClick={() => handleRowClick(row)}
                    >
                      <TableCell>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {studentDisplayName(row.student, t)}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {row.student?.email || "—"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{row.batch?.name || "—"}</TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-medium">
                            {row.dissertation_class || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {row.dissertation_result != null
                              ? `${row.dissertation_result}%`
                              : "—"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {row.oral_defence_schedule?.scheduled_at
                          ? moment(
                              row.oral_defence_schedule.scheduled_at
                            ).format("DD/MM/YYYY HH:mm")
                          : t(
                              "thesis.oralDefence.statusNotScheduled",
                              "Not scheduled"
                            )}
                      </TableCell>
                      <TableCell>
                        {row.oral_defence_result?.class ||
                        row.oral_defence_result?.result != null ? (
                          <div className="space-y-0.5">
                            <p className="font-medium">
                              {row.oral_defence_result.class || "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {row.oral_defence_result.result != null
                                ? `${row.oral_defence_result.result}%`
                                : "—"}
                            </p>
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="capitalize">
                        {row.attempt_status || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalCount > 0 ? (
            <Pagination
              page={page}
              setPage={setPage}
              rowsPerPage={rowsPerPage}
              setRowsPerPage={(value) => {
                setRowsPerPage(value);
                setPage(1);
              }}
              totalRows={totalCount}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
