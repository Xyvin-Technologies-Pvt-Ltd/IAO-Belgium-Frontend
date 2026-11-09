import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Download, Search } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { ErrorMessage } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import TrajectoryFormDataFilterDrawer from "@/components/admin/thesis/TrajectoryFormDataFilterDrawer";
import {
  useGetTrajectoryFormData,
  useExportTrajectoryFormDataCsv,
} from "@/store/useThesisStore";
import {
  formatFormAnswer,
  isFilterableFormQuestion,
} from "@/utils/thesisFormAnswers";

const emptyFilters = (questions = []) => {
  const next = { submission: "all" };
  for (const question of questions.filter(isFilterableFormQuestion)) {
    next[question.id] = "all";
  }
  return next;
};

const studentDisplayName = (student, t) => {
  if (!student) {
    return t("thesisManagement.trajectories.unknownStudent", "Unknown Student");
  }
  const name =
    `${student.first_name || ""} ${student.last_name || ""}`.trim() ||
    student.email;
  return name || "—";
};

export default function TrajectoryFormDataTab({
  thesisId,
  trajectoryId,
  basePath,
  formSteps = [],
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [selectedStepId, setSelectedStepId] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [appliedFilters, setAppliedFilters] = useState({ submission: "all" });
  const [draftFilters, setDraftFilters] = useState({ submission: "all" });

  useEffect(() => {
    if (!formSteps.length) {
      setSelectedStepId("");
      return;
    }
    setSelectedStepId((prev) => {
      if (prev && formSteps.some((s) => String(s._id) === String(prev))) {
        return prev;
      }
      return String(formSteps[0]._id);
    });
  }, [formSteps]);

  useEffect(() => {
    setPage(1);
    const reset = { submission: "all" };
    setAppliedFilters(reset);
    setDraftFilters(reset);
  }, [selectedStepId]);

  const answersPayload = useMemo(() => {
    const cleaned = {};
    for (const [qid, val] of Object.entries(appliedFilters || {})) {
      if (qid === "submission") continue;
      if (val !== undefined && val !== null && val !== "" && val !== "all") {
        cleaned[qid] = val;
      }
    }
    return Object.keys(cleaned).length ? JSON.stringify(cleaned) : undefined;
  }, [appliedFilters]);

  const submission = appliedFilters.submission || "all";

  const queryParams = {
    page,
    limit: rowsPerPage,
    ...(selectedStepId ? { step: selectedStepId } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(submission !== "all" ? { submission } : {}),
    ...(answersPayload ? { answers: answersPayload } : {}),
  };

  const { data, isLoading, isFetching, error, refetch } =
    useGetTrajectoryFormData(thesisId, trajectoryId, queryParams, {
      enabled: Boolean(thesisId && trajectoryId && selectedStepId),
    });

  const exportCsvMutation = useExportTrajectoryFormDataCsv();
  const exportCsvPending = exportCsvMutation.isPending;

  const handleExportCsv = () => {
    if (!selectedStepId) return;
    const { page: _page, limit: _limit, ...exportParams } = queryParams;
    exportCsvMutation.mutate({
      thesisId,
      trajectoryId,
      params: exportParams,
    });
  };

  const payload = data?.data;
  const students = payload?.students || [];
  const questions = payload?.questions || [];
  const totalCount = data?.total_count || 0;

  useEffect(() => {
    if (!questions.length) return;
    setAppliedFilters((prev) => {
      const next = emptyFilters(questions);
      for (const key of Object.keys(next)) {
        if (prev[key] !== undefined) next[key] = prev[key];
      }
      return next;
    });
    setDraftFilters((prev) => {
      const next = emptyFilters(questions);
      for (const key of Object.keys(next)) {
        if (prev[key] !== undefined) next[key] = prev[key];
      }
      return next;
    });
  }, [questions.map((q) => q.id).join("|")]);

  const openStudent = (userId) => {
    if (!userId) return;
    navigate({
      to: `${basePath}/$id/trajectories/$trajectoryId/students/$userId`,
      params: {
        id: thesisId,
        trajectoryId,
        userId,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="space-y-1.5 min-w-[220px]">
            <Label className="text-xs font-semibold text-muted-foreground">
              {t("thesisManagement.formData.formStep", "Form step")}
            </Label>
            <Select
              value={selectedStepId || undefined}
              onValueChange={(value) => {
                setSelectedStepId(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue
                  placeholder={t(
                    "thesisManagement.formData.selectFormStep",
                    "Select form step"
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                {formSteps.map((step) => (
                  <SelectItem
                    key={step._id}
                    value={String(step._id)}
                    className="text-xs"
                  >
                    {step.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative w-full sm:w-72 sm:self-end">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t(
                "thesisManagement.formData.searchPlaceholder",
                "Search students or answers..."
              )}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-9 text-xs sm:text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <TrajectoryFormDataFilterDrawer
            questions={questions}
            draftFilters={draftFilters}
            setDraftFilters={setDraftFilters}
            appliedFilters={appliedFilters}
            setAppliedFilters={setAppliedFilters}
            setPage={setPage}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={exportCsvPending || !selectedStepId}
            className="gap-2 h-9"
          >
            <Download className="w-4 h-4" />
            {exportCsvPending
              ? t("common.exporting", "Exporting...")
              : t("common.exportCsv", "Export CSV")}
          </Button>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-10 bg-background min-w-[180px]">
                {t("thesisManagement.table.studentName", "Student")}
              </TableHead>
              {questions.map((question) => (
                <TableHead
                  key={question.id}
                  className="min-w-[160px] max-w-[220px]"
                  title={question.label}
                >
                  <span className="line-clamp-2">{question.label}</span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody
            className={isFetching ? "opacity-50 pointer-events-none" : ""}
          >
            {isLoading ? (
              <TableSkeleton
                rows={rowsPerPage}
                columns={Math.max(2, questions.length + 1)}
              />
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={Math.max(2, questions.length + 1)}
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
            ) : students.length > 0 ? (
              students.map((row) => {
                const student = row.student;
                const studentName = studentDisplayName(student, t);
                const meta = [student?.uid, row.application?.uid]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <TableRow
                    key={`${row.application?._id || student?._id}`}
                    className="hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => openStudent(student?._id)}
                  >
                    <TableCell className="sticky left-0 z-10 bg-background">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-foreground">
                          {studentName}
                        </div>
                        {meta ? (
                          <div className="text-[11px] text-muted-foreground">
                            {meta}
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    {questions.map((question) => {
                      const raw = row.answers?.[question.id];
                      const display = formatFormAnswer(question, raw, t);
                      return (
                        <TableCell
                          key={question.id}
                          className="max-w-[220px] truncate text-sm"
                          title={display}
                        >
                          {display}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={Math.max(2, questions.length + 1)}
                  className="text-center p-8 text-muted-foreground text-sm"
                >
                  {t(
                    "thesisManagement.formData.empty",
                    "No form responses match your filters."
                  )}
                </TableCell>
              </TableRow>
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
    </div>
  );
}
