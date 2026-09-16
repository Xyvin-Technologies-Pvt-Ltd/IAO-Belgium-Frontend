import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { useState, useEffect, useMemo } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useGetPlanningByModule } from "@/store/usePlanningStore";
import { useGetTeacherExams, useGetTeacherPracticalExams } from "@/store/useExamStore";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { List, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TeacherCalendarView from "@/components/teacher/schedule/TeacherCalendarView";
import ModuleScheduleFilterDrawer from "./ModuleScheduleFilterDrawer";
import { useDebounce } from "@/hooks/useDebounce";
import { getMoment } from "@/utils/dateUtils";
import { useTranslation } from "react-i18next";
import ExamList from "@/pages/teacher/exam";
import PracticalExamList from "@/pages/teacher/exam/PracticalExamList";

const SessionsScheduleView = () => {
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

  // Calendar queries — only active when in calendar view
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

  const { data: calendarExamsData, isLoading: examsLoading } = useGetTeacherExams(
    { limit: 1000, is_all: true, teacher_status: "accepted" },
    { enabled: view === "calendar" }
  );

  const { data: calendarPracticalData, isLoading: practicalLoading } = useGetTeacherPracticalExams(
    { limit: 1000, is_all: true, teacher_status: "accepted" },
    { enabled: view === "calendar" }
  );

  const sessions = data?.data || [];
  const totalRows = data?.total_count || 0;

  const combinedCalendarEvents = useMemo(() => {
    const sessionList = calendarData?.data || [];
    const examList = (calendarExamsData?.data || [])
      .filter((e) => (e.teacher_status || e.status || "accepted") === "accepted")
      .map((e) => ({ ...e, item_type: "exam" }));
    const practicalList = (calendarPracticalData?.data || [])
      .filter((p) => (p.status || p.teacher_status || "accepted") === "accepted")
      .map((p) => ({ ...p, item_type: "practical" }));

    return [...sessionList, ...examList, ...practicalList];
  }, [calendarData, calendarExamsData, calendarPracticalData]);

  const handleView = (id) => {
    if (id) {
      navigate({ to: "/teacher/schedules/$id", params: { id } });
    }
  };

  const handleCalendarItemClick = (item) => {
    if (item.item_type === "exam") {
      navigate({
        to: "/teacher/exams/$exam_id/$planning_id",
        params: {
          exam_id: String(item.exam_id?._id || item.exam_id || item._id),
          planning_id: String(item.planning_id || item._id),
        },
      });
    } else if (item.item_type === "practical") {
      navigate({
        to: "/teacher/practical-exams/$id",
        params: { id: String(item._id) },
      });
    } else {
      const pid = item.planning_id || item._id;
      if (pid) {
        navigate({ to: "/teacher/schedules/$id", params: { id: String(pid) } });
      }
    }
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

  const isCalendarLoading = calendarLoading || examsLoading || practicalLoading;

  return (
    <div className="space-y-6">
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
          sessions={combinedCalendarEvents}
          isLoading={isCalendarLoading}
          onSessionClick={handleCalendarItemClick}
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

const ModuleScheduleList = () => {
  const { t } = useTranslation();
  const searchParams = useSearch({ strict: false });
  const initialTab = searchParams?.tab || localStorage.getItem("teacherScheduleActiveTab") || "sessions";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (searchParams?.tab) {
      setActiveTab(searchParams.tab);
    }
  }, [searchParams?.tab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    localStorage.setItem("teacherScheduleActiveTab", tabId);
  };

  const tabs = [
    { id: "sessions", label: t("sidebar.teacher.schedules", { defaultValue: "Sessions Schedule" }) },
    { id: "exams", label: t("sidebar.teacher.exams", { defaultValue: "Exams Schedule" }) },
    { id: "practical", label: t("sidebar.teacher.practicalExams", { defaultValue: "Practical Exams Schedule" }) },
  ];

  return (
    <div className="space-y-6 mt-4">
      <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
        {t("sidebar.teacher.schedules", { defaultValue: "My Schedules" })}
      </h2>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-white/20">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "border-[#ff8904] text-[#ff8904]"
                  : "border-transparent text-gray-500 dark:text-white/70 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/30"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === "sessions" && <SessionsScheduleView />}
        {activeTab === "exams" && <ExamList showHeader={false} statusFilter="accepted" />}
        {activeTab === "practical" && <PracticalExamList showHeader={false} statusFilter="accepted" />}
      </div>
    </div>
  );
};

export default ModuleScheduleList;
