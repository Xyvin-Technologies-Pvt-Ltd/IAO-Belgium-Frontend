import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { ErrorMessage } from "@/components/common";
import StatusBadge from "@/components/StatusBadge";
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
import { useGetTrajectoryEvaluations } from "@/store/useThesisStore";

const studentDisplayName = (student, t) => {
  if (!student) {
    return t("thesisManagement.trajectories.unknownStudent", "Unknown Student");
  }
  const name =
    `${student.first_name || ""} ${student.last_name || ""}`.trim() ||
    student.email;
  return name || "—";
};

const formatRoleResult = (roleBlock, weightsEnabled) => {
  if (!roleBlock || roleBlock.percentage == null) {
    if (roleBlock?.status === "draft" || roleBlock?.status === "reopened") {
      return { primary: "—", secondary: roleBlock.status };
    }
    return { primary: "—", secondary: null };
  }
  if (weightsEnabled) {
    return {
      primary: `${roleBlock.percentage}%`,
      secondary: roleBlock.status === "submitted" ? null : roleBlock.status,
    };
  }
  const total = roleBlock.total_marks;
  const max = roleBlock.max_marks;
  const marks =
    total != null && max != null ? `${total}/${max}` : null;
  return {
    primary: marks || `${roleBlock.percentage}%`,
    secondary:
      marks != null ? `${roleBlock.percentage}%` : roleBlock.status || null,
  };
};

export default function TrajectoryEvaluationTab({
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
    useGetTrajectoryEvaluations(thesisId, trajectoryId, queryParams, {
      enabled: Boolean(thesisId && trajectoryId),
    });

  const rows = data?.data || [];
  const totalCount = data?.total_count || 0;
  const weightsEnabled = Boolean(data?.weights_enabled);

  const showAdditionalReader = useMemo(
    () => rows.some((row) => row?.additional_reader?.assigned),
    [rows]
  );

  const columnCount = 7 + (showAdditionalReader ? 1 : 0);

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
              "thesisManagement.evaluation.search",
              "Search students..."
            )}
            className="pl-9"
          />
        </div>
      </div>

      {error ? (
        <ErrorMessage
          message={error?.message || "Failed to load evaluations"}
          onRetry={refetch}
        />
      ) : isLoading ? (
        <TableSkeleton rows={rowsPerPage} columns={columnCount} />
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
                      "thesisManagement.evaluation.supervisorResult",
                      "Supervisor"
                    )}
                  </TableHead>
                  <TableHead>
                    {t("thesisManagement.evaluation.readerResult", "Reader")}
                  </TableHead>
                  {showAdditionalReader ? (
                    <TableHead>
                      {t(
                        "thesisManagement.evaluation.additionalReaderResult",
                        "Additional reader"
                      )}
                    </TableHead>
                  ) : null}
                  <TableHead>
                    {t(
                      "thesisManagement.marking.finalPercentage",
                      "Final Percentage"
                    )}
                  </TableHead>
                  <TableHead>
                    {t(
                      "thesisManagement.evaluation.publicationStatus",
                      "Publication"
                    )}
                  </TableHead>
                  <TableHead>
                    {t(
                      "thesisManagement.dissertationPassed.dissertationResult",
                      "Dissertation"
                    )}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columnCount}
                      className="text-center text-muted-foreground py-10"
                    >
                      {t(
                        "thesisManagement.evaluation.empty",
                        "No evaluation results found"
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const supervisor = formatRoleResult(
                      row.supervisor,
                      weightsEnabled
                    );
                    const reader = formatRoleResult(
                      row.reader,
                      weightsEnabled
                    );
                    const additional = formatRoleResult(
                      row.additional_reader,
                      weightsEnabled
                    );
                    return (
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
                            <p className="font-medium">{supervisor.primary}</p>
                            {supervisor.secondary ? (
                              <p className="text-xs text-muted-foreground capitalize">
                                {supervisor.secondary}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="font-medium">{reader.primary}</p>
                            {reader.secondary ? (
                              <p className="text-xs text-muted-foreground capitalize">
                                {reader.secondary}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>
                        {showAdditionalReader ? (
                          <TableCell>
                            <div className="space-y-0.5">
                              <p className="font-medium">
                                {row.additional_reader?.assigned
                                  ? additional.primary
                                  : "—"}
                              </p>
                              {row.additional_reader?.assigned &&
                              additional.secondary ? (
                                <p className="text-xs text-muted-foreground capitalize">
                                  {additional.secondary}
                                </p>
                              ) : null}
                            </div>
                          </TableCell>
                        ) : null}
                        <TableCell>
                          {row.final_percentage != null ? (
                            <span className="font-medium">
                              {row.final_percentage}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              {row.final_percentage_message || "—"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={row.publication?.status || "unpublished"}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="font-medium">
                              {row.publication?.dissertation_class || "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {row.publication?.dissertation_result != null
                                ? `${row.publication.dissertation_result}%`
                                : "—"}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
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
