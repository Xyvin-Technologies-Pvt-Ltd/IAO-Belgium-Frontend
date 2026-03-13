import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMoment } from "@/utils/dateUtils";

const CalendarView = ({
  plannings = [],
  isLoading,
  onSessionClick,
  onMonthChange,
}) => {
  const [currentDate, setCurrentDate] = useState(getMoment());

  const daysInMonth = currentDate.daysInMonth();
  const firstDayOfMonth = getMoment(currentDate).startOf("month").day();
  const monthName = currentDate.format("MMMM YYYY");

  const sessionsByDate = useMemo(() => {
    const sessions = {};
    plannings.forEach((planning) => {
      if (planning.sessions && planning.sessions.length > 0) {
        planning.sessions.forEach((session) => {
          const dateKey = getMoment(session.session_date).format("YYYY-MM-DD");
          if (!sessions[dateKey]) sessions[dateKey] = [];
          sessions[dateKey].push({
            ...session,
            planning,
            module_name: planning.component?.name,
            batch_name: planning.batch?.name,
          });
        });
      }
    });
    return sessions;
  }, [plannings]);

  const handlePrevMonth = () => {
    const newDate = getMoment(currentDate).subtract(1, "month");
    setCurrentDate(newDate);
    if (onMonthChange) onMonthChange(newDate.month() + 1, newDate.year());
  };

  const handleNextMonth = () => {
    const newDate = getMoment(currentDate).add(1, "month");
    setCurrentDate(newDate);
    if (onMonthChange) onMonthChange(newDate.month() + 1, newDate.year());
  };

  const handleToday = () => {
    const newDate = getMoment();
    setCurrentDate(newDate);
    if (onMonthChange) onMonthChange(newDate.month() + 1, newDate.year());
  };

  const getStatusColor = (session) => {
    const hasTeachers = session.teachers && session.teachers.length > 0;
    if (!hasTeachers) return { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-500 dark:text-gray-400", dot: null }; 

    const firstTeacher = session.teachers[0];
    const status = firstTeacher?.status || "pending";

    switch (status.toLowerCase()) {
      case "accepted":
        return { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-600 dark:text-green-400", dot: null };
      case "rejected":
        return { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400", dot: null };
      case "pending":
      default:
        return { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-600 dark:text-yellow-400", dot: "bg-yellow-500 dark:bg-yellow-400" };
    }
  };

  const renderCalendarDays = () => {
    const days = [];
    const today = getMoment().format("YYYY-MM-DD");

    // Leading empty cells (previous month overflow)
    const prevMonth = getMoment(currentDate).subtract(1, "month");
    const prevMonthDays = prevMonth.daysInMonth();
    for (let i = 0; i < firstDayOfMonth; i++) {
      const prevDay = prevMonthDays - firstDayOfMonth + 1 + i;
      days.push(
        <div
          key={`empty-${i}`}
          className="min-h-[120px] p-2 bg-gray-50 dark:bg-gray-900"
        >
          <span className="text-sm text-gray-300 dark:text-gray-700">
            {prevDay}
          </span>
        </div>,
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = getMoment(currentDate).date(day).format("YYYY-MM-DD");
      const sessionsForDay = sessionsByDate[dateKey] || [];
      const isToday = dateKey === today;

      days.push(
        <div
          key={day}
          className="min-h-[120px] p-2 bg-white dark:bg-gray-950 border-t border-r border-gray-100 dark:border-gray-800"
        >
          {/* Day number */}
          <div className="mb-1.5">
            {isToday ? (
              <span
                className="inline-flex items-center justify-center w-[26px] h-[26px] text-sm font-semibold rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900"
              >
                {day}
              </span>
            ) : (
              <span className="text-sm text-gray-700 dark:text-gray-300 font-normal">
                {day}
              </span>
            )}
          </div>
          <div className="space-y-1">
            {sessionsForDay.slice(0, 3).map((session, idx) => {
              const startTime = getMoment(session.start_time).format("h:mma");
              const colors = getStatusColor(session);

              return (
                <div
                  key={idx}
                  onClick={() => onSessionClick && onSessionClick(session)}
                  className={`flex items-center gap-1 rounded cursor-pointer hover:opacity-80 transition-opacity px-1.5 py-0.5 ${colors.bg}`}
                  title={`${session.module_name} - ${session.batch_name}`}
                >
                  {colors.dot && (
                    <span
                      className={`shrink-0 w-1.5 h-1.5 rounded-full ${colors.dot}`}
                    />
                  )}
                  <span className={`text-xs truncate font-medium ${colors.text}`}>
                    <span className="opacity-75 font-normal">
                      {startTime}{" "}
                    </span>
                    {session.module_name}
                  </span>
                </div>
              );
            })}

            {sessionsForDay.length > 3 && (
              <p className="text-xs pl-1 text-gray-400 dark:text-gray-500">
                + {sessionsForDay.length - 3} more
              </p>
            )}
          </div>
        </div>,
      );
    }

    const totalCells = days.length;
    const remainder = totalCells % 7;
    if (remainder !== 0) {
      const trailingCount = 7 - remainder;
      for (let i = 1; i <= trailingCount; i++) {
        days.push(
          <div
            key={`trailing-${i}`}
            className="min-h-[120px] p-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800"
          >
            <span className="text-sm text-gray-300 dark:text-gray-700">
              {i}
            </span>
          </div>,
        );
      }
    }

    return days;
  };

  return (
    <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={handleToday}
          className="px-3.5 py-1 rounded-md border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Today
        </button>

        <button
          onClick={handlePrevMonth}
          disabled={isLoading}
          className="flex items-center justify-center w-[26px] h-[26px] rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </button>
        <button
          onClick={handleNextMonth}
          disabled={isLoading}
          className="flex items-center justify-center w-[26px] h-[26px] rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 cursor-pointer"
        >
          <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </button>
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
          {monthName}
        </h3>
      </div>
      <div className={`transition-opacity duration-200 ${isLoading ? "opacity-50" : "opacity-100"}`}>
        <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="py-2.5 text-center text-xs font-medium tracking-wide uppercase text-gray-400 dark:text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">{renderCalendarDays()}</div>
      </div>

      {isLoading && (
        <p className="text-center text-sm text-gray-400 dark:text-gray-500">
          Loading…
        </p>
      )}
    </div>
  );
};

export default CalendarView;
