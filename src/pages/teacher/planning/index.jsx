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
import { useState, useMemo, Fragment } from "react";
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

  const rawSessions = data?.data || [];
  const totalRows = data?.total_count || 0;

  // Group flat session array by planning_id into the structure the table expects
  const plannings = useMemo(() => {
    if (!rawSessions?.length) return [];

    // If data is already grouped (has sessions sub-array), return as-is
    if (rawSessions[0]?.sessions) return rawSessions;

    const grouped = new Map();
    for (const session of rawSessions) {
      const key = session.planning_id || session._id;
      if (!grouped.has(key)) {
        grouped.set(key, {
          _id: key,
          program_name: session.program_name || "N/A",
          component_name: session.module_name || "N/A",
          venue: session.venue || "N/A",
          language: session.language || "N/A",
          location: session.location || "N/A",
          batch_name: session.batch_name || "N/A",
          sessions: [],
        });
      }
      grouped.get(key).sessions.push({
        session_id: session._id,
        name: session.name,
        session_date: session.session_date,
        start_time: session.start_time,
        end_time: session.end_time,
        status: session.teacher_status || "pending",
      });
    }
    return Array.from(grouped.values());
  }, [rawSessions]);

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
              const hasPending = planning.sessions?.some(
                (s) => s.status === "pending" || !s.status
              );
              const mainStatus = hasPending ? "pending" : (planning.sessions?.[0]?.status || "pending");
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
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 rounded text-muted-foreground hover:text-primary dark:text-zinc-400 dark:hover:text-primary transition-all duration-200 cursor-pointer"
                          >
                            <ChevronRight
                              className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90 text-primary" : ""}`}
                            />
                          </button>
                        ) : (
                          <div className="w-6" /> // Placeholder for alignment
                        )}
                        {planning.program_name}
                      </div>
                    </TableCell>
                    <TableCell
                      className="max-w-37.5 overflow-hidden text-ellipsis whitespace-nowrap font-bold text-gray-900 dark:text-gray-100"
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
                          {formatTZ(planning.sessions?.[0]?.session_date, "MMM DD, YYYY") || "N/A"}
                        </TableCell>
                        <TableCell>
                          {formatTZ(planning.sessions?.[0]?.start_time, "HH:mm") || "N/A"}
                        </TableCell>
                        <TableCell>
                          {formatTZ(planning.sessions?.[0]?.end_time, "HH:mm") || "N/A"}
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
                                planning.sessions?.[0]?.session_id,
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
                                planning.sessions?.[0]?.session_id,
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
                        className="bg-muted/65 dark:bg-muted/50 border-l-4 border-l-primary hover:bg-muted/85 dark:hover:bg-muted/70 transition-colors"
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
                        <TableCell>
                          {(session.status === "pending" || !session.status) && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-[#49BA6C] bg-[#49BA6C]/10 hover:bg-[#49BA6C]/20 border-none"
                                onClick={() =>
                                  handleStatusUpdate(
                                    session.session_id,
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
                                    session.session_id,
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
