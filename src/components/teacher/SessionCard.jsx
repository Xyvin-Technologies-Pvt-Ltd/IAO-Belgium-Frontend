import { Skeleton } from "@/components/ui/skeleton";
import { formatTZ, getMoment } from "@/utils/dateUtils";

const SessionCard = ({ sessions = [], isLoading = false }) => {
  // Helper function to format date
  const formatDate = (dateString) => {
    return formatTZ(dateString, "MMMM DD, YYYY");
  };

  // Helper function to format time
  const formatTime = (startTime, endTime) => {
    const start = getMoment(startTime);
    const end = getMoment(endTime);

    return `${start.format("HH:mm")} - ${end.format("HH:mm")}`;
  };

  // Skeleton loading state
  if (isLoading) {
    return (
      <div className="bg-white/60 rounded-[6px] border border-[#EFEFEF] p-6">
        <div className="grid grid-cols-4 text-base font-semibold pb-4 gap-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="grid grid-cols-4 items-center gap-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (sessions.length === 0) {
    return (
      <div className="bg-white/60 rounded-[6px] border border-[#EFEFEF] p-8 text-center">
        <p className="text-gray-500">No sessions scheduled</p>
      </div>
    );
  }

  return (
    <div className="bg-white/60 rounded-[6px] border border-[#EFEFEF] p-6">
      <div className="grid grid-cols-4 text-base font-semibold pb-4 gap-4">
        <span>Session Name</span>
        <span>Date</span>
        <span>Time</span>
        <span>Teachers</span>
      </div>
      <div className="space-y-4">
        {sessions.map((session, index) => {
          // Extract teachers from different roles
          const teachers = [
            ...(session.teachers?.map((t) =>
              `${t.teacher?.first_name || ""} ${t.teacher?.last_name || ""}`.trim(),
            ) || []),
            ...(session.assistants?.map((a) =>
              `${a.assistant?.first_name || ""} ${a.assistant?.last_name || ""}`.trim(),
            ) || []),
            ...(session.trainees?.map((t) =>
              `${t.trainee?.first_name || ""} ${t.trainee?.last_name || ""}`.trim(),
            ) || []),
          ].filter(Boolean);

          return (
            <div
              key={session._id || index}
              className="grid grid-cols-4 items-center gap-4 text-base"
            >
              <div className="flex items-center gap-2">
                <span>{session.name || `Session ${index + 1}`}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>{formatDate(session.session_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>{formatTime(session.start_time, session.end_time)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="truncate">
                  {teachers.length > 0 ? teachers.join(", ") : "TBA"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SessionCard;
