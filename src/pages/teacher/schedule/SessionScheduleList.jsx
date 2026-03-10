import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/table/Pagination";
import LoadingState from "@/components/common/LoadingState";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, FileText } from "lucide-react";
import { useGetPlanningByTeacher } from "@/store/usePlanningStore";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import moment from "moment";
import { useNavigate, useParams } from "@tanstack/react-router";

const SessionScheduleList = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const params = useParams({ strict: false });
  const id = params.id;
  const navigate = useNavigate();
  const { updateBreadcrumbs } = useBreadcrumb();

  const { data, isLoading, error, refetch } = useGetPlanningByTeacher({
    page: page,
    limit: rowsPerPage,
    status: "accepted",
    planning_id: id,
  });

  const sessions = data?.data || [];
  const totalRows = data?.total_count || 0;

  useEffect(() => {
    if (sessions.length > 0) {
      const firstSession = sessions[0];
      updateBreadcrumbs([
        { label: "Dashboard", path: "/teacher/dashboard" },
        { label: "Modules", path: "/teacher/schedules" },
        { label: firstSession.module_name || "Module", path: "/teacher/schedules/$id" },
        { label: "Sessions", path: "" },
      ]);
    } else {
      updateBreadcrumbs([
        { label: "Dashboard", path: "/teacher/dashboard" },
        { label: "Modules", path: "/teacher/schedules" },
        { label: "Sessions", path: "" },
      ]);
    }

    return () => {
      updateBreadcrumbs([]);
    };
  }, [sessions]);

  if (isLoading) {
    return <LoadingState text="Loading schedules..." fullHeight />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error?.message || "Failed to load schedules"}
        onRetry={refetch}
        variant="card"
      />
    );
  }

  const handleAttendence = (sessionId, componentId) => {
    navigate({
      to: "/teacher/mark-attendance/$id",
      params: { id: sessionId },
      search: { component_id: componentId },
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold ">Schedules</h2>
      <div className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session._id}
            className="bg-sidebar rounded-2xl border border-sidebar-border p-4 sm:p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex gap-3">
                <div className="h-11 w-11 shrink-0 rounded-[6px] bg-sidebar-accent flex items-center justify-center">
                  <FileText className="h-5 w-5 text-[#418FFF]" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-sidebar-foreground break-words">
                    {session.name}
                  </h3>

                  <div className="flex items-center gap-2 mt-1 text-sm sm:text-base text-sidebar-foreground/70 flex-wrap">
                    <span className="break-words">{session.module_name}</span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-sidebar-accent text-sidebar-foreground whitespace-nowrap">
                      {session.program_uid}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:shrink-0">
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto text-sm"
                >
                  View
                </Button>
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto text-sm whitespace-nowrap"
                >
                  Add to Calendar
                </Button>
                <Button
                  onClick={() =>
                    handleAttendence(session?._id, session?.component_id)
                  }
                  className="w-full sm:w-auto text-sm whitespace-nowrap"
                >
                  Mark attendance
                </Button>
              </div>
            </div>

            <div className="my-4 h-px bg-sidebar-border" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <Detail
                icon={<Calendar className="h-4 w-4 text-primary" />}
                label="Date"
                value={
                  session.session_date
                    ? moment.utc(session.session_date).format("MMM DD, YYYY")
                    : "N/A"
                }
              />
              <Detail
                icon={<Clock className="h-4 w-4 text-primary" />}
                label="Time"
                value={
                  session.start_time && session.end_time
                    ? `${moment.utc(session.start_time).format("HH:mm")} - ${moment.utc(session.end_time).format("HH:mm")}`
                    : "N/A"
                }
              />
              <Detail
                icon={<MapPin className="h-4 w-4 text-primary" />}
                label="Location"
                value={session.venue || "N/A"}
              />
            </div>
          </div>
        ))}
      </div>
      {sessions.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No accepted sessions found</p>
        </div>
      )}
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

export default SessionScheduleList;

const Detail = ({ icon, label, value }) => (
  <div className="flex items-start gap-2">
    <div className="shrink-0">{icon}</div>
    <div className="min-w-0 flex-1">
      <p className="text-sm text-sidebar-foreground/70 font-semibold">
        {label}
      </p>
      <p className="font-semibold text-base text-sidebar-foreground break-words">
        {value}
      </p>
    </div>
  </div>
);
