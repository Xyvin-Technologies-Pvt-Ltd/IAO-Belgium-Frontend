import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMoment } from "@/utils/dateUtils";

const TeacherCalendarView = ({ sessions = [], isLoading, onSessionClick, onMonthChange }) => {
  const [currentDate, setCurrentDate] = useState(getMoment());

  const daysInMonth = currentDate.daysInMonth();
  const firstDayOfMonth = getMoment(currentDate).startOf("month").day();
  const monthName = currentDate.format("MMMM YYYY");

  const sessionsByDate = useMemo(() => {
    const map = {};
    // Each item in `sessions` is a module with a nested sessions array
    sessions.forEach((module) => {
      (module.sessions || []).forEach((s) => {
        if (!s.session_date) return;
        const dateKey = getMoment(s.session_date).format("YYYY-MM-DD");
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push({
          ...s,
          component_name: module.component_name,
          batch_name: module.batch_name,
          planning_id: module.planning_id,
          venue: module.venue,
        });
      });
    });
    return map;
  }, [sessions]);

  const handlePrevMonth = () => {
    const newDate = getMoment(currentDate).subtract(1, "month");
    setCurrentDate(newDate);
    onMonthChange?.(newDate.month() + 1, newDate.year());
  };

  const handleNextMonth = () => {
    const newDate = getMoment(currentDate).add(1, "month");
    setCurrentDate(newDate);
    onMonthChange?.(newDate.month() + 1, newDate.year());
  };

  const handleToday = () => {
    const newDate = getMoment();
    setCurrentDate(newDate);
    onMonthChange?.(newDate.month() + 1, newDate.year());
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-600 dark:text-green-400", dot: null };
      case "rejected":
        return { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400", dot: null };
      case "pending":
      default:
        return { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-600 dark:text-yellow-400", dot: "bg-yellow-500 dark:bg-yellow-400" };
    }
  };

  const renderDays = () => {
    const days = [];
    const today = getMoment().format("YYYY-MM-DD");

    // Leading cells
    const prevMonthDays = getMoment(currentDate).subtract(1, "month").daysInMonth();
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`prev-${i}`} className="min-h-[120px] p-2 bg-gray-50 dark:bg-gray-900">
          <span className="text-sm text-gray-300 dark:text-gray-700">
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
        <div key={day} className="min-h-[120px] p-2 bg-white dark:bg-gray-950 border-t border-r border-gray-100 dark:border-gray-800">
          <div className="mb-1.5">
            {isToday ? (
              <span className="inline-flex items-center justify-center w-[26px] h-[26px] text-sm font-semibold rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900">
                {day}
              </span>
            ) : (
              <span className="text-sm text-gray-700 dark:text-gray-300 font-normal">{day}</span>
            )}
          </div>
          <div className="space-y-1">
            {daySessions.slice(0, 3).map((session, idx) => {
              const colors = getStatusColor(session.status);
              const time = session.start_time ? getMoment(session.start_time).format("h:mma") : null;
              return (
                <div
                  key={idx}
                  onClick={() => onSessionClick?.(session)}
                  className={`flex items-center gap-1 rounded cursor-pointer hover:opacity-80 transition-opacity px-1.5 py-0.5 ${colors.bg}`}
                  title={`${session.component_name} - ${session.batch_name}`}
                >
                  {colors.dot && <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${colors.dot}`} />}
                  <span className={`text-xs truncate font-medium ${colors.text}`}>
                    {time && <span className="opacity-75 font-normal">{time} </span>}
                    {session.component_name}
                  </span>
                </div>
              );
            })}
            {daySessions.length > 3 && (
              <p className="text-xs pl-1 text-gray-400 dark:text-gray-500">
                +{daySessions.length - 3} more
              </p>
            )}
          </div>
        </div>
      );
    }

    // Trailing cells
    const remainder = days.length % 7;
    if (remainder !== 0) {
      for (let i = 1; i <= 7 - remainder; i++) {
        days.push(
          <div key={`next-${i}`} className="min-h-[120px] p-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
            <span className="text-sm text-gray-300 dark:text-gray-700">{i}</span>
          </div>
        );
      }
    }

    return days;
  };

  return (
    <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={handleToday}
          className="px-3.5 py-1 rounded-md border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Today
        </button>
        <button
          onClick={handlePrevMonth}
          disabled={isLoading}
          className="flex items-center justify-center w-[26px] h-[26px] rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </button>
        <button
          onClick={handleNextMonth}
          disabled={isLoading}
          className="flex items-center justify-center w-[26px] h-[26px] rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </button>
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{monthName}</h3>
      </div>

      <div className={`transition-opacity duration-200 ${isLoading ? "opacity-50" : "opacity-100"}`}>
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2.5 text-center text-xs font-medium tracking-wide uppercase text-gray-400 dark:text-gray-500">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">{renderDays()}</div>
      </div>

      {isLoading && (
        <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-2">Loading…</p>
      )}
    </div>
  );
};

export default TeacherCalendarView;
