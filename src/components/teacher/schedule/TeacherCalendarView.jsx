import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, FileText, ClipboardCheck, BookOpen } from "lucide-react";
import { getMoment } from "@/utils/dateUtils";
import { useTranslation } from "react-i18next";

const TeacherCalendarView = ({
  sessions = [],
  isLoading,
  onSessionClick,
  onMonthChange,
  viewType = "month",
  onViewTypeChange,
  currentWeekStart,
  onWeekChange,
}) => {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(getMoment());

  const daysInMonth = currentDate.daysInMonth();
  const firstDayOfMonth = getMoment(currentDate).startOf("month").day();

  const weekStart = currentWeekStart || getMoment().startOf("week");
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    getMoment(weekStart).add(i, "day")
  );

  const headerTitle =
    viewType === "week"
      ? (() => {
          const s = weekDays[0];
          const e = weekDays[6];
          return s.month() === e.month()
            ? `${s.format("MMM D")} – ${e.format("D, YYYY")}`
            : `${s.format("MMM D")} – ${e.format("MMM D, YYYY")}`;
        })()
      : currentDate.format("MMMM YYYY");

  const sessionsByDate = useMemo(() => {
    const map = {};
    const addToMap = (dateVal, item) => {
      if (!dateVal) return;
      const dateKey = getMoment(dateVal).format("YYYY-MM-DD");
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(item);
    };

    sessions.forEach((item) => {
      // Grouped session structure
      if (item.sessions && Array.isArray(item.sessions)) {
        item.sessions.forEach((s) => {
          addToMap(s.session_date, {
            ...s,
            item_type: "session",
            component_name: s.name || item.component_name,
            batch_name: item.batch_name,
            planning_id: item.planning_id || s.planning_id,
            venue: item.venue,
            status: s.status || item.teacher_status || "accepted",
          });
        });
      } 
      // Flat Exam item
      else if (item.item_type === "exam" || item.total_questions !== undefined || item.planned_exam_id) {
        const examDate = item.exam_date || item.session_date || item.start_time || item.date || item.createdAt || item.created_at;
        addToMap(examDate, {
          ...item,
          item_type: "exam",
          component_name: item.name || item.module_name || "Online Exam",
          batch_name: item.batch_name || item.batch?.name || "N/A",
          planning_id: item.planning_id,
          status: item.teacher_status || item.status || "accepted",
        });
      }
      // Flat Practical Exam item
      else if (item.item_type === "practical" || (item.module_name && (item.exam_date || item.createdAt))) {
        const practicalDate = item.exam_date || item.session_date || item.start_time || item.date || item.createdAt || item.created_at;
        addToMap(practicalDate, {
          ...item,
          item_type: "practical",
          component_name: item.name || item.module_name || "Practical Exam",
          batch_name: item.batch?.name || item.batch_name || "N/A",
          status: item.status || item.teacher_status || "accepted",
        });
      }
      // General fallback session item
      else {
        const sessionDate = item.session_date || item.date || item.exam_date;
        addToMap(sessionDate, {
          ...item,
          item_type: item.item_type || "session",
          component_name: item.component_name || item.name || item.module_name || "Session",
          batch_name: item.batch_name || item.batch?.name || "N/A",
          status: item.status || item.teacher_status || "accepted",
        });
      }
    });

    return map;
  }, [sessions]);

  const handlePrev = () => {
    if (viewType === "week") {
      const newStart = getMoment(weekStart).subtract(1, "week");
      onWeekChange?.(newStart);
    } else {
      const newDate = getMoment(currentDate).subtract(1, "month");
      setCurrentDate(newDate);
      onMonthChange?.(newDate.month() + 1, newDate.year());
    }
  };

  const handleNext = () => {
    if (viewType === "week") {
      const newStart = getMoment(weekStart).add(1, "week");
      onWeekChange?.(newStart);
    } else {
      const newDate = getMoment(currentDate).add(1, "month");
      setCurrentDate(newDate);
      onMonthChange?.(newDate.month() + 1, newDate.year());
    }
  };

  const handleToday = () => {
    if (viewType === "week") {
      const newStart = getMoment().startOf("week");
      onWeekChange?.(newStart);
    } else {
      const newDate = getMoment();
      setCurrentDate(newDate);
      onMonthChange?.(newDate.month() + 1, newDate.year());
    }
  };

  const getItemStyle = (session) => {
    if (session.item_type === "exam") {
      return {
        bg: "bg-purple-100 dark:bg-purple-900/30",
        text: "text-purple-700 dark:text-purple-300",
        label: "Exam",
        icon: FileText,
      };
    }
    if (session.item_type === "practical") {
      return {
        bg: "bg-amber-100 dark:bg-amber-900/30",
        text: "text-amber-700 dark:text-amber-300",
        label: "Practical",
        icon: ClipboardCheck,
      };
    }
    
    // Status check for sessions
    switch (session.status?.toLowerCase()) {
      case "rejected":
        return { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400", label: "Session", icon: BookOpen };
      case "pending":
        return { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-600 dark:text-yellow-400", label: "Session", icon: BookOpen };
      case "accepted":
      default:
        return { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", label: "Session", icon: BookOpen };
    }
  };

  const SessionCard = ({ session, idx }) => {
    const style = getItemStyle(session);
    const Icon = style.icon;
    const time = session.start_time ? getMoment(session.start_time).format("h:mma") : null;
    const displayName = session.item_type && session.item_type !== "session"
      ? `[${style.label}] ${session.component_name}`
      : session.component_name;

    return (
      <div
        key={idx}
        onClick={() => onSessionClick?.(session)}
        className={`flex items-center gap-1 rounded cursor-pointer hover:opacity-80 transition-opacity px-1.5 py-0.5 ${style.bg}`}
        title={`${displayName} - ${session.batch_name || ""}`}
      >
        <Icon className={`shrink-0 w-3 h-3 ${style.text}`} />
        <span className={`text-xs truncate font-medium ${style.text}`}>
          {time && <span className="opacity-75 font-normal">{time} </span>}
          {displayName}
        </span>
      </div>
    );
  };

  const AgendaSessionRow = ({ session }) => {
    const style = getItemStyle(session);
    const Icon = style.icon;
    const hasTime =
      session.start_time &&
      !getMoment(session.start_time).isSame(getMoment(session.start_time).startOf("day"));
    const startTime = hasTime ? getMoment(session.start_time).format("h:mmA") : null;
    const endTime = hasTime && session.end_time ? getMoment(session.end_time).format("h:mmA") : null;

    return (
      <div
        onClick={() => onSessionClick?.(session)}
        className={`w-full rounded-lg px-4 py-3 cursor-pointer hover:opacity-90 transition-opacity ${style.bg}`}
      >
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5">
            <Icon className={`w-4 h-4 ${style.text}`} />
            <span className={`text-xs font-semibold uppercase tracking-wider ${style.text}`}>
              {style.label}
            </span>
          </div>
          {startTime && (
            <span className={`text-xs font-medium ${style.text}`}>
              {startTime}{endTime ? ` – ${endTime}` : ""}
            </span>
          )}
        </div>
        <p className={`text-sm font-semibold leading-tight ${style.text}`}>
          {session.component_name || t("calendar.session")}
        </p>
        {session.batch_name && (
          <p className={`text-xs mt-0.5 ${style.text} opacity-70`}>{session.batch_name}</p>
        )}
        {session.venue && (
          <p className={`text-xs mt-0.5 ${style.text} opacity-60`}>{session.venue}</p>
        )}
      </div>
    );
  };

  const renderMonthDays = () => {
    const days = [];
    const today = getMoment().format("YYYY-MM-DD");
    const prevMonthDays = getMoment(currentDate).subtract(1, "month").daysInMonth();

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`prev-${i}`} className="min-h-[120px] p-2 bg-gray-50 dark:bg-sidebar/60">
          <span className="text-sm text-gray-300 dark:text-sidebar-foreground/20">
            {prevMonthDays - firstDayOfMonth + 1 + i}
          </span>
        </div>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = getMoment(currentDate).date(day).format("YYYY-MM-DD");
      const daySessions = sessionsByDate[dateKey] || [];
      const isToday = dateKey === today;

      days.push(
        <div key={day} className="min-h-[120px] p-2 bg-white dark:bg-sidebar border-t border-r border-gray-100 dark:border-sidebar-border">
          <div className="mb-1.5">
            {isToday ? (
              <span className="inline-flex items-center justify-center w-[26px] h-[26px] text-sm font-semibold rounded-full bg-gray-900 dark:bg-sidebar-foreground text-white dark:text-sidebar">
                {day}
              </span>
            ) : (
              <span className="text-sm text-gray-700 dark:text-sidebar-foreground/70 font-normal">{day}</span>
            )}
          </div>
          <div className="space-y-1">
            {daySessions.slice(0, 3).map((session, idx) => (
              <SessionCard key={idx} session={session} idx={idx} />
            ))}
            {daySessions.length > 3 && (
              <p className="text-xs pl-1 text-gray-400 dark:text-sidebar-foreground/40">
                +{daySessions.length - 3} {t("calendar.more")}
              </p>
            )}
          </div>
        </div>
      );
    }

    const remainder = days.length % 7;
    if (remainder !== 0) {
      for (let i = 1; i <= 7 - remainder; i++) {
        days.push(
          <div key={`trailing-${i}`} className="min-h-[120px] p-2 bg-gray-50 dark:bg-sidebar/60 border-t border-gray-100 dark:border-sidebar-border">
            <span className="text-sm text-gray-300 dark:text-sidebar-foreground/20">{i}</span>
          </div>
        );
      }
    }

    return days;
  };

  const renderWeekDays = () => {
    const today = getMoment().format("YYYY-MM-DD");

    return (
      <div className="divide-y divide-gray-100 dark:divide-sidebar-border">
        {weekDays.map((day) => {
          const dateKey = day.format("YYYY-MM-DD");
          const daySessions = sessionsByDate[dateKey] || [];
          const isToday = dateKey === today;

          return (
            <div key={dateKey} className="flex gap-4 px-4 py-3 bg-white dark:bg-sidebar">
              <div className="w-28 shrink-0 pt-0.5">
                <p className={`text-xs font-semibold uppercase tracking-widest ${
                  isToday
                    ? "text-gray-900 dark:text-sidebar-foreground"
                    : "text-gray-400 dark:text-sidebar-foreground/40"
                }`}>
                  {day.format("D MMM, dddd")}
                </p>
              </div>
              <div className="flex-1 space-y-2 min-h-[40px]">
                {daySessions.length > 0 ? (
                  daySessions.map((session, idx) => (
                    <AgendaSessionRow key={idx} session={session} />
                  ))
                ) : (
                  <p className="text-xs text-gray-300 dark:text-sidebar-foreground/20 pt-2">—</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-sidebar rounded-xl border border-gray-200 dark:border-sidebar-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-sidebar border-b border-gray-100 dark:border-sidebar-border">
        <button
          onClick={handleToday}
          className="px-3.5 py-1 rounded-md border border-gray-300 dark:border-sidebar-border text-sm font-medium text-gray-700 dark:text-sidebar-foreground/70 bg-white dark:bg-sidebar hover:bg-gray-50 dark:hover:bg-sidebar-border/20 transition-colors"
        >
          {t("common.today")}
        </button>
        <button
          onClick={handlePrev}
          disabled={isLoading}
          className="flex items-center justify-center w-[26px] h-[26px] rounded hover:bg-gray-100 dark:hover:bg-sidebar-border/30 transition-colors disabled:opacity-40 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4 text-gray-500 dark:text-sidebar-foreground/50" />
        </button>
        <button
          onClick={handleNext}
          disabled={isLoading}
          className="flex items-center justify-center w-[26px] h-[26px] rounded hover:bg-gray-100 dark:hover:bg-sidebar-border/30 transition-colors disabled:opacity-40 cursor-pointer"
        >
          <ChevronRight className="h-4 w-4 text-gray-500 dark:text-sidebar-foreground/50" />
        </button>
        <h3 className="text-base font-bold text-gray-900 dark:text-sidebar-foreground flex-1">
          {headerTitle}
        </h3>

        {/* Legend */}
        <div className="hidden md:flex items-center gap-3 text-xs mr-2">
          <span className="flex items-center gap-1 text-green-700 dark:text-green-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500" /> Session
          </span>
          <span className="flex items-center gap-1 text-purple-700 dark:text-purple-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-purple-500" /> Exam
          </span>
          <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Practical
          </span>
        </div>

        {onViewTypeChange && (
          <div className="flex rounded-md border border-gray-200 dark:border-sidebar-border overflow-hidden">
            {["month", "week"].map((type) => (
              <button
                key={type}
                onClick={() => onViewTypeChange(type)}
                className={`px-3 py-1 text-sm font-medium transition-colors capitalize ${
                  viewType === type
                    ? "bg-gray-900 dark:bg-sidebar-foreground text-white dark:text-sidebar"
                    : "bg-white dark:bg-sidebar text-gray-600 dark:text-sidebar-foreground/60 hover:bg-gray-50 dark:hover:bg-sidebar-border/20"
                }`}
              >
                {t(`calendar.viewType.${type}`)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={`transition-opacity duration-200 ${isLoading ? "opacity-50" : "opacity-100"}`}>
        {viewType === "week" ? (
          renderWeekDays()
        ) : (
          <>
            <div className="grid grid-cols-7 bg-gray-50 dark:bg-sidebar/60 border-b border-gray-100 dark:border-sidebar-border">
              {["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map((d) => (
                <div
                  key={d}
                  className="py-2.5 text-center text-xs font-medium tracking-wide uppercase text-gray-400 dark:text-sidebar-foreground/40"
                >
                  {t(`calendar.days.${d}`)}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">{renderMonthDays()}</div>
          </>
        )}
      </div>

      {isLoading && (
        <p className="text-center text-sm text-gray-400 dark:text-sidebar-foreground/40 py-2">
          {t("calendar.loading")}
        </p>
      )}
    </div>
  );
};

export default TeacherCalendarView;
