import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/table/Pagination";
import LoadingState from "@/components/common/LoadingState";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useState } from "react";
import { Calendar, Clock, MapPin, FileText } from "lucide-react";
import { useGetPlanningByTeacher } from "@/store/usePlanningStore";
import moment from "moment";

const GridView = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(3);

  const { data, isLoading, error, refetch } = useGetPlanningByTeacher({
    page: page,
    limit: rowsPerPage,
    status: "accepted",
  });

  const sessions = data?.data || [];
  const totalRows = data?.total_count || 0;

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

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session._id}
            className="bg-sidebar rounded-2xl border border-sidebar-border p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="h-11 w-11 rounded-[6px] bg-sidebar-accent flex items-center justify-center">
                  <FileText className="h-5 w-5 text-[#418FFF]" />
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-sidebar-foreground">
                    {session.name}
                  </h3>

                  <div className="flex items-center gap-2 mt-1 text-base text-sidebar-foreground/70">
                    <span>{session.module_name}</span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-sidebar-accent text-sidebar-foreground">
                      {session.program_uid}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary">View</Button>
                <Button variant="secondary">Add to Calendar</Button>
                <Button>Mark attendance</Button>
              </div>
            </div>

            <div className="my-4 h-px bg-sidebar-border" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <Detail
                icon={<Calendar className="h-4 w-4 text-primary" />}
                label="Date"
                value={
                  session.session_date
                    ? moment(session.session_date).format("MMM DD, YYYY")
                    : "N/A"
                }
              />
              <Detail
                icon={<Clock className="h-4 w-4 text-primary" />}
                label="Time"
                value={
                  session.start_time && session.end_time
                    ? `${moment(session.start_time).format("HH:mm")} - ${moment(session.end_time).format("HH:mm")}`
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

export default GridView;

const Detail = ({ icon, label, value }) => (
  <div className="flex items-start gap-2">
    {icon}
    <div>
      <p className="text-sm text-sidebar-foreground/70 font-semibold">
        {label}
      </p>
      <p className="font-semibold text-base text-sidebar-foreground">{value}</p>
    </div>
  </div>
);
