import { Skeleton } from "@/components/ui/skeleton";
import { formatTZ, getMoment } from "@/utils/dateUtils";
import { useTranslation } from "react-i18next";

const SessionCard = ({ sessions = [], isLoading = false }) => {
  const { t } = useTranslation();
  const formatDate = (dateString) => formatTZ(dateString, "MMMM DD, YYYY");

  const formatTime = (startTime, endTime) => {
    const start = getMoment(startTime);
    const end = getMoment(endTime);
    return `${start.format("HH:mm")} - ${end.format("HH:mm")}`;
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg bg-card text-card-foreground shadow-sm p-6">
        <div className="grid grid-cols-4 text-base font-semibold pb-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-24" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="grid grid-cols-4 items-center gap-4">
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

  if (sessions.length === 0) {
    return (
      <div className="border rounded-lg bg-card text-card-foreground shadow-sm p-8 text-center">
        <p className="text-muted-foreground">{t("sessionCard.noSessions")}</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-card text-card-foreground shadow-sm p-6">
      <div className="grid grid-cols-4 text-base font-semibold pb-4 gap-4 border-b border-border">
        <span>{t("sessionCard.sessionName")}</span>
        <span>{t("sessionCard.date")}</span>
        <span>{t("sessionCard.time")}</span>
        <span>{t("sessionCard.teachers")}</span>
      </div>
      <div className="space-y-4 mt-4">
        {sessions.map((session, index) => {
          const teachers = [
            ...(session.teachers?.map(
              (t) =>
                `${t.teacher?.last_name || ""} ${t.teacher?.first_name || ""}`.trim(),
            ) || []),
            ...(session.assistants?.map(
              (a) =>
                `${a.assistant?.last_name || ""} ${a.assistant?.first_name || ""}`.trim(),
            ) || []),
            ...(session.trainees?.map(
              (t) =>
                `${t.trainee?.last_name || ""} ${t.trainee?.first_name || ""}`.trim(),
            ) || []),
          ].filter(Boolean);

          return (
            <div
              key={session._id || index}
              className="grid grid-cols-4 items-center gap-4 text-base text-card-foreground"
            >
              <span>
                {session.name || `${t("sessionCard.sessionPrefix")} ${index + 1}`}
              </span>
              <span>{formatDate(session.session_date)}</span>
              <span>{formatTime(session.start_time, session.end_time)}</span>
              <span className="text-muted-foreground line-clamp-2 capitalize">
                {teachers.length > 0 ? teachers.join(", ") : t("common.tba")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SessionCard;
