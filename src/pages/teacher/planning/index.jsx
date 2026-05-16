import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, Fragment } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";
import {
  useGetPlanningByTeacher,
  useUpdateTeacherStatus,
} from "@/store/usePlanningStore";
import StatusBadge from "@/components/StatusBadge";
import { Check, X, ChevronDown, ChevronRight } from "lucide-react";
import { formatTZ } from "@/utils/dateUtils";
import ModuleScheduleFilterDrawer from "@/pages/teacher/schedule/ModuleScheduleFilterDrawer";

const defaultFilters = { program: "all", batch: "all" };

const Plannings = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedModules, setExpandedModules] = useState(new Set());
  const [search, setSearch] = useState("");
  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error, refetch, isFetching } =
    useGetPlanningByTeacher({
      page,
      limit: rowsPerPage,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(appliedFilters.batch !== "all" ? { batch_id: appliedFilters.batch } : {}),
    });

  const updateStatusMutation = useUpdateTeacherStatus();

  const plannings = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleStatusUpdate = async (sessionId, status) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: sessionId,
        data: { status },
      });
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const toggleModule = (moduleId) => {
    const newSet = new Set(expandedModules);
    if (newSet.has(moduleId)) {
      newSet.delete(moduleId);
    } else {
      newSet.add(moduleId);
    }
    setExpandedModules(newSet);
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex  flex-1 items-center gap-2">
        <Input
          placeholder={t("planningManagement.search")}
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ModuleScheduleFilterDrawer
          draftFilters={draftFilters}
          setDraftFilters={setDraftFilters}
          appliedFilters={appliedFilters}
          setAppliedFilters={setAppliedFilters}
          setPage={setPage}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("planningManagement.table.program")}</TableHead>
            <TableHead>{t("planningManagement.view.moduleLabel")}</TableHead>
            <TableHead>
              {t("planningManagement.view.sessionNameLabel")}
            </TableHead>
            <TableHead>{t("planningManagement.view.dateLabel")}</TableHead>
            <TableHead>{t("planningManagement.view.timeFromLabel")}</TableHead>
            <TableHead>{t("planningManagement.view.timeTillLabel")}</TableHead>
            <TableHead>{t("planningManagement.view.venueLabel")}</TableHead>
            <TableHead>{t("planningManagement.teacher.language")}</TableHead>
            <TableHead>{t("planningManagement.teacher.location")}</TableHead>
            <TableHead>{t("planningManagement.table.status")}</TableHead>
            <TableHead>{t("planningManagement.teacher.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody
          className={isFetching ? "opacity-50 pointer-events-none" : ""}
        >
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={11} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center p-8">
                <ErrorMessage
                  message={
                    error?.message ||
                    t("planningManagement.messages.loadFailed")
                  }
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : plannings?.length > 0 ? (
            plannings?.map((planning) => {
              const mainStatus = planning.sessions?.[0]?.status || "pending";
              const isExpanded = expandedModules.has(planning._id);
              const hasMultipleSessions = planning.sessions?.length > 1;

              return (
                <Fragment key={planning._id}>
                  <TableRow className="font-semibold bg-secondary/5">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {hasMultipleSessions ? (
                          <button
                            onClick={() => toggleModule(planning._id)}
                            className="p-1 hover:bg-gray-100 rounded transition-transform"
                          >
                            <ChevronRight
                              className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                            />
                          </button>
                        ) : (
                          <div className="w-6" /> // Placeholder for alignment
                        )}
                        {planning.program_name}
                      </div>
                    </TableCell>
                    <TableCell
                      className="max-w-37.5 overflow-hidden text-ellipsis whitespace-nowrap"
                      title={planning.component_name}
                    >
                      {planning.component_name}
                    </TableCell>
                    <TableCell>
                      {hasMultipleSessions
                        ? `${planning.sessions?.length} ${t("planningManagement.view.sessionsLabel")}`
                        : planning.sessions?.[0]?.name || "N/A"}
                    </TableCell>
                    {hasMultipleSessions ? (
                      <TableCell colSpan={3} className="text-muted-foreground italic text-[10px]">
                        {/* Optionally show date range here */}
                      </TableCell>
                    ) : (
                      <>
                        <TableCell>
                          {formatTZ(planning.sessions[0]?.session_date, "MMM DD, YYYY") || "N/A"}
                        </TableCell>
                        <TableCell>
                          {formatTZ(planning.sessions[0]?.start_time, "HH:mm") || "N/A"}
                        </TableCell>
                        <TableCell>
                          {formatTZ(planning.sessions[0]?.end_time, "HH:mm") || "N/A"}
                        </TableCell>
                      </>
                    )}
                    <TableCell>{planning.venue || "N/A"}</TableCell>
                    <TableCell>{planning.language || "N/A"}</TableCell>
                    <TableCell>{planning.location || "N/A"}</TableCell>
                    <TableCell>
                      <StatusBadge status={mainStatus} />
                    </TableCell>
                    <TableCell>
                      {(mainStatus === "pending" || !mainStatus) && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[#49BA6C] bg-[#49BA6C]/10 hover:bg-[#49BA6C]/20 border-none"
                            onClick={() =>
                              handleStatusUpdate(
                                planning.sessions[0].session_id,
                                "accepted"
                              )
                            }
                            disabled={updateStatusMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            {t("planningManagement.teacher.accept")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[#E7000B] border-none bg-[#E7000B]/10 dark:bg-[#E7000B] hover:bg-[#E7000B]/20"
                            onClick={() =>
                              handleStatusUpdate(
                                planning.sessions[0].session_id,
                                "rejected"
                              )
                            }
                            disabled={updateStatusMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-1" />
                            {t("planningManagement.teacher.reject")}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>

                  {isExpanded &&
                    planning.sessions?.map((session) => (
                      <TableRow
                        key={session.session_id}
                        className="bg-muted/30 border-l-4 border-l-primary/20"
                      >
                        <TableCell className="pl-12" colSpan={2}></TableCell>
                        <TableCell
                          className="max-w-37.5 overflow-hidden text-ellipsis whitespace-nowrap"
                          title={session.name}
                        >
                          {session.name}
                        </TableCell>
                        <TableCell>
                          {formatTZ(session.session_date, "MMM DD, YYYY") || "N/A"}
                        </TableCell>
                        <TableCell>
                          {formatTZ(session.start_time, "HH:mm") || "N/A"}
                        </TableCell>
                        <TableCell>
                          {formatTZ(session.end_time, "HH:mm") || "N/A"}
                        </TableCell>
                        <TableCell>{planning.venue || "N/A"}</TableCell>
                        <TableCell>{planning.language || "N/A"}</TableCell>
                        <TableCell>{planning.location || "N/A"}</TableCell>
                        <TableCell>
                          <StatusBadge status={session.status || "pending"} />
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    ))}
                </Fragment>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={11} className="text-center">
                {t("planningManagement.table.noPlannings")}
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

export default Plannings;
