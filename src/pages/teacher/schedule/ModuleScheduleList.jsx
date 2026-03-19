import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useGetPlanningByModule } from "@/store/usePlanningStore";
import { useNavigate } from "@tanstack/react-router";
import { List, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TeacherCalendarView from "@/components/teacher/schedule/TeacherCalendarView";
import ModuleScheduleFilterDrawer from "./ModuleScheduleFilterDrawer";
import { useDebounce } from "@/hooks/useDebounce";
import { getMoment } from "@/utils/dateUtils";

const ModuleScheduleList = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [view, setView] = useState("list");
  const [search, setSearch] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ program: "all", batch: "all", city: "all" });
  const [draftFilters, setDraftFilters] = useState({ program: "all", batch: "all", city: "all" });

  // Calendar state
  const [calendarViewType, setCalendarViewType] = useState("month");
  const [calendarMonth, setCalendarMonth] = useState(getMoment().month() + 1);
  const [calendarYear, setCalendarYear] = useState(getMoment().year());
  const [weekStart, setWeekStart] = useState(getMoment().startOf("week"));

  const debouncedSearch = useDebounce(search, 500);

  // Shared filter params (no pagination, no date)
  const baseParams = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(appliedFilters.batch !== "all" ? { batch_id: appliedFilters.batch } : {}),
    ...(appliedFilters.city !== "all" ? { city: appliedFilters.city } : {}),
  };

  // List query — paginated, only active when in list view
  const { data, isLoading, error, refetch, isFetching } =
    useGetPlanningByModule(
      { ...baseParams, page, limit: rowsPerPage },
      { enabled: view === "list" }
    );

  // Calendar query — no pagination, is_all, date-filtered, only active when in calendar view
  const calendarDateParams =
    calendarViewType === "week"
      ? {
          week_start: weekStart.toISOString(),
          week_end: getMoment(weekStart).endOf("week").toISOString(),
        }
      : { month: calendarMonth, year: calendarYear };

  const {
    data: calendarData,
    isLoading: calendarLoading,
    error: calendarError,
    refetch: calendarRefetch,
  } = useGetPlanningByModule(
    { ...baseParams, is_all: true, ...calendarDateParams },
    { enabled: view === "calendar" }
  );

  const sessions = data?.data || [];
  const totalRows = data?.total_count || 0;
  const calendarSessions = calendarData?.data || [];

  const handleView = (id) => {
    navigate({ to: "/teacher/schedules/$id", params: { id } });
  };

  const handleMonthChange = (month, year) => {
    setCalendarMonth(month);
    setCalendarYear(year);
  };

  const handleWeekChange = (newWeekStart) => {
    setWeekStart(newWeekStart);
  };

  const handleViewTypeChange = (type) => {
    setCalendarViewType(type);
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder="Search modules and batches"
            className="max-w-xs"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <ModuleScheduleFilterDrawer
            draftFilters={draftFilters}
            setDraftFilters={setDraftFilters}
            appliedFilters={appliedFilters}
            setAppliedFilters={setAppliedFilters}
            setPage={setPage}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("calendar")}
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {(view === "list" ? error : calendarError) ? (
        <div className="p-8 text-center">
          <ErrorMessage
            message={(view === "list" ? error : calendarError)?.message || "Failed to load schedules"}
            onRetry={view === "list" ? refetch : calendarRefetch}
            variant="inline"
          />
        </div>
      ) : view === "calendar" ? (
        <TeacherCalendarView
          sessions={calendarSessions}
          isLoading={calendarLoading}
          onSessionClick={(session) => handleView(session.planning_id)}
          onMonthChange={handleMonthChange}
          viewType={calendarViewType}
          onViewTypeChange={handleViewTypeChange}
          currentWeekStart={weekStart}
          onWeekChange={handleWeekChange}
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Module Name</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
              {isLoading ? (
                <TableSkeleton rows={rowsPerPage} columns={4} />
              ) : sessions?.length > 0 ? (
                sessions.map((session) => (
                  <TableRow
                    key={session._id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleView(session?.planning_id)}
                  >
                    <TableCell>{session?.batch_name || "N/A"}</TableCell>
                    <TableCell>{session?.program_name || "N/A"}</TableCell>
                    <TableCell>{session?.component_name || "N/A"}</TableCell>
                    <TableCell>{session?.venue || "N/A"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No accepted sessions found
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
        </>
      )}
    </div>
  );
};

export default ModuleScheduleList;
