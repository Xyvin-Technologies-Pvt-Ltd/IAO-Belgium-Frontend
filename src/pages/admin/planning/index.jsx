import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { Calendar, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlanningTable from "./PlanningTable";
import CalendarView from "@/components/admin/planning/CalendarView";
import ViewPlanning from "@/components/admin/planning/ViewPlanning";
import { useGetPlanning } from "@/store/usePlanningStore";
import { useGetAllCities } from "@/store/useDropdownStore";
import { getMoment } from "@/utils/dateUtils";

const Planning = () => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState("table");
  const [calendarViewType, setCalendarViewType] = useState("month"); // "month" | "week"
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewPlanning, setViewPlanning] = useState(null);
  const [activeCity, setActiveCity] = useState(() => {
    return localStorage.getItem("planningActiveCity") || "all";
  });
  const [currentMonth, setCurrentMonth] = useState(getMoment().month() + 1);
  const [currentYear, setCurrentYear] = useState(getMoment().year());
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    getMoment().startOf("week")
  );

  const { data: citiesData, isLoading: citiesLoading } = useGetAllCities({});
  const cities = citiesData?.data || [];

  useEffect(() => {
    localStorage.setItem("planningActiveCity", activeCity);
  }, [activeCity]);

  const calendarApiParams = {
    ...(activeCity !== "all" ? { city: activeCity } : {}),
    ...(calendarViewType === "week"
      ? {
          week_start: currentWeekStart.toISOString(),
          week_end: getMoment(currentWeekStart).endOf("week").toISOString(),
        }
      : { month: currentMonth, year: currentYear }),
    is_all: true,
  };

  const { data: calendarData, isLoading: calendarLoading } = useGetPlanning(
    calendarApiParams,
    { enabled: viewMode === "calendar" }
  );

  const handleSessionClick = (session) => {
    setViewPlanning(session.planning);
    setIsViewModalOpen(true);
  };

  const handleMonthChange = (month, year) => {
    setCurrentMonth(month);
    setCurrentYear(year);
  };

  const handleWeekChange = (weekStart) => {
    setCurrentWeekStart(weekStart);
  };

  return (
    <div className="space-y-6 mt-4">
      <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
        {t("planningManagement.title")}
      </h2>

      {/* City Tabs */}
      <div className="border-b border-gray-200 dark:border-white/20">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveCity("all")}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeCity === "all"
                ? "border-[#ff8904] text-[#ff8904]"
                : "border-transparent text-gray-500 dark:text-white/70 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/30"
            }`}
          >
            All Cities
          </button>
          {citiesLoading ? (
            <div className="py-2 px-1 text-sm text-gray-400">
              {t("common.loading") || "Loading..."}
            </div>
          ) : (
            cities.map((city) => (
              <button
                key={city._id}
                onClick={() => setActiveCity(city._id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeCity === city._id
                    ? "border-[#ff8904] text-[#ff8904]"
                    : "border-transparent text-gray-500 dark:text-white/70 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/30"
                }`}
              >
                {city.name}
              </button>
            ))
          )}
        </nav>
      </div>

      <div className="flex items-center justify-between">
        <div></div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            <List className="h-4 w-4 mr-2" />
         
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("calendar")}
          >
            <Calendar className="h-4 w-4 mr-2" />
         
          </Button>
        </div>
      </div>

      {viewMode === "table" ? (
        <PlanningTable activeCity={activeCity} setActiveCity={setActiveCity} />
      ) : (
        <CalendarView
          plannings={calendarData?.data || []}
          isLoading={calendarLoading}
          onSessionClick={handleSessionClick}
          onMonthChange={handleMonthChange}
          viewType={calendarViewType}
          onViewTypeChange={setCalendarViewType}
          currentWeekStart={currentWeekStart}
          onWeekChange={handleWeekChange}
        />
      )}

      <ViewPlanning
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        planningData={viewPlanning}
      />
    </div>
  );
};

export default Planning;
