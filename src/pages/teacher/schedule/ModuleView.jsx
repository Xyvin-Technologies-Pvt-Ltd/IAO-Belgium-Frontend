import { useGetPlanningById } from "@/store/usePlanningStore";
import { useParams, useNavigate } from "@tanstack/react-router";
import SessionCard from "@/components/teacher/SessionCard";
import ListCard from "@/components/teacher/ListCard";
import LoadingState from "@/components/common/LoadingState";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { Button } from "@/components/ui/button";
import { MapPin, Languages, Calendar } from "lucide-react";
import { useEffect } from "react";
import { getMoment } from "@/utils/dateUtils";
import moment from "moment";

const ModuleView = () => {
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const id = params.id;
  const { updateBreadcrumbs } = useBreadcrumb();

  const { data: planning, isLoading } = useGetPlanningById(id);

  useEffect(() => {
    if (planning?.data?.component) {
      updateBreadcrumbs([
        { label: "Dashboard", path: "/teacher/dashboard" },
        { label: "Modules", path: "/teacher/schedules" },
        { label: planning.data.component.name || "Module Details", path: "" },
      ]);
    }
    return () => updateBreadcrumbs([]);
  }, [planning]);

  if (isLoading) {
    return <LoadingState text="Loading module details..." fullHeight />;
  }

  if (!planning?.data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 dark:text-gray-400">No Data Found</p>
      </div>
    );
  }

  const data = planning.data;
  const { component, sessions, venue } = data;

  const getSessionDateRange = () => {
    if (!sessions || sessions.length === 0) return "N/A";
    const dates = sessions.map((s) => getMoment(s.session_date));
    const startDate = moment.min(dates);
    const endDate = moment.max(dates);
    if (startDate.isSame(endDate, "day")) return startDate.format("MMMM DD, YYYY");
    if (startDate.isSame(endDate, "month") && startDate.isSame(endDate, "year"))
      return `${startDate.format("MMMM DD")}-${endDate.format("DD, YYYY")}`;
    return `${startDate.format("MMMM DD, YYYY")} - ${endDate.format("MMMM DD, YYYY")}`;
  };

  const handleMarkAttendance = () => {
    navigate({ to: "/teacher/schedules/module/$id", params: { id } });
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-semibold text-dashboard-text dark:text-white break-words">
            {component?.name || "Untitled Module"}
          </h2>
          {component?.program?.name && (
            <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1">
              {component.program.name}
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          <Button onClick={handleMarkAttendance} className="w-full sm:w-auto">
            Mark Attendance
          </Button>
        </div>
      </div>

      {/* Info card */}
      <div className="p-5 border rounded-lg bg-card text-card-foreground shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground font-semibold">Location</p>
              <p className="font-semibold text-card-foreground break-words">{venue || "N/A"}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Languages className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground font-semibold">Language</p>
              <p className="font-semibold text-card-foreground">
                {component?.program?.language?.name || "N/A"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground font-semibold">Date</p>
              <p className="font-semibold text-card-foreground">{getSessionDateRange()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {data.description && (
        <div className="p-5 border rounded-lg bg-card text-card-foreground shadow-sm">
          <p className="text-sm font-bold mb-2">Description:</p>
          <p className="text-sm text-card-foreground/80 whitespace-pre-wrap">{data.description}</p>
        </div>
      )}

      {/* Sessions */}
      <h3 className="text-lg font-semibold text-dashboard-text dark:text-white">Sessions</h3>
      <SessionCard sessions={sessions || []} isLoading={false} />

      {/* Files */}
      {component?.files?.length > 0 && (
        <ListCard
          columns={["File Name", "Size", "Actions"]}
          data={component.files}
          isLoading={false}
        />
      )}
    </div>
  );
};

export default ModuleView;
