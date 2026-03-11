import { useGetPlanningById } from "@/store/usePlanningStore";
import { useParams, useNavigate } from "@tanstack/react-router";
import SessionCard from "@/components/teacher/SessionCard";
import ListCard from "@/components/teacher/ListCard";
import LoadingState from "@/components/common/LoadingState";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { Button } from "@/components/ui/button";
import { MapPin, Languages, Calendar } from "lucide-react";
import { useEffect } from "react";
import { getKolkataMoment } from "@/utils/dateUtils";
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

    return () => {
      updateBreadcrumbs([]);
    };
  }, [planning]);

  if (isLoading) {
    return <LoadingState text="Loading module details..." fullHeight />;
  }

  if (!planning?.data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No Data Found</p>
      </div>
    );
  }

  const data = planning.data;
  const { component, sessions, venue } = data;

  // Calculate session date range
  const getSessionDateRange = () => {
    if (!sessions || sessions.length === 0) return "N/A";

    const dates = sessions.map((s) => getKolkataMoment(s.session_date));
    const startDate = moment.min(dates);
    const endDate = moment.max(dates);

    // Check if start and end are the same day
    if (startDate.isSame(endDate, 'day')) {
      return startDate.format("MMMM DD, YYYY");
    }
    
    // Check if start and end are in the same month and year
    if (startDate.isSame(endDate, 'month') && startDate.isSame(endDate, 'year')) {
      return `${startDate.format("MMMM DD")}-${endDate.format("DD, YYYY")}`;
    }
    
    // Different months or years
    return `${startDate.format("MMMM DD, YYYY")} - ${endDate.format("MMMM DD, YYYY")}`;
  };

  const sessionDateRange = getSessionDateRange();

  const handleMarkAttendance = () => {
    navigate({
      to: "/teacher/schedules/module/$id",
      params: { id: id },
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold break-words">
            {component?.name || "Untitled Module"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {component?.program?.name && component.program.name}
          </p>
        </div>
        <div className="flex-shrink-0">
          <Button
            onClick={handleMarkAttendance}
            className="w-full sm:w-auto"
          >
            Mark Attendance
          </Button>
        </div>
      </div>
      <div className="bg-white/60 rounded-[6px] border border-[#EFEFEF] p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-base">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500 font-semibold">Location</p>
              <p className="font-semibold break-words">{venue || "N/A"}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Languages className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500 font-semibold">Language</p>
              <p className="font-semibold">
                {component?.program?.language?.name || "N/A"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500 font-semibold">Date</p>
              <p className="font-semibold">{sessionDateRange}</p>
            </div>
          </div>
        </div>
      </div>

      <h1 className="text-xl break-words">Sessions</h1>
      <SessionCard sessions={sessions || []} isLoading={false} />

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
