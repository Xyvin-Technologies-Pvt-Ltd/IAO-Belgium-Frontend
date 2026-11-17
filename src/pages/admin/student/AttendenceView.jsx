import React, { useState, useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import { useGetStudentAttendance } from "@/store/useStudentStore";
import { useGetStudentByApplication } from "@/store/useIntakeStore";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { useTranslation } from "react-i18next";
import StudentAttendanceTable from "@/components/admin/StudentAttendanceTable";

const getDurationUnitLabel = (durationUnit, t) => {
  if (!durationUnit) return t("common.year", "Year");
  const unit = durationUnit.toLowerCase();
  if (unit.startsWith("year")) {
    const trans = t("common.durationUnits.year", "Year");
    return trans.charAt(0).toUpperCase() + trans.slice(1);
  }
  if (unit.startsWith("month")) {
    const trans = t("common.durationUnits.month", "Month");
    return trans.charAt(0).toUpperCase() + trans.slice(1);
  }
  if (unit.startsWith("week")) {
    const trans = t("common.durationUnits.week", "Week");
    return trans.charAt(0).toUpperCase() + trans.slice(1);
  }
  if (unit.startsWith("day")) {
    const trans = t("common.durationUnits.day", "Day");
    return trans.charAt(0).toUpperCase() + trans.slice(1);
  }
  return t("common.year", "Year");
};

const AttendenceView = () => {
  const { t } = useTranslation();
  const params = useParams({ strict: false });
  //* Route id is application id (same as student-management detail)
  const id = params.id;
  const { updateBreadcrumbs } = useBreadcrumb();
  const [filter, setFilter] = useState({ year: 1 });

  const { data: studentData } = useGetStudentByApplication(id, {
    year: filter.year,
  });

  const studentInfo = studentData?.data;
  const studentUserId = studentInfo?._id;

  const { data, isLoading, error, refetch, isFetching } =
    useGetStudentAttendance(
      studentUserId,
      { ...filter, application_id: id },
      {
        enabled: !!studentUserId && !!id,
      },
    );

  const totalYears = studentInfo?.year || 1;
  const years = Array.from({ length: totalYears }, (_, i) => i + 1);

  const modules = data?.data || [];

  useEffect(() => {
    if (studentInfo) {
      updateBreadcrumbs([
        {
          label: "Student Management",
          path: "/admin/student-management",
          navigable: true,
        },
        {
          label: `${studentInfo.last_name} ${studentInfo.first_name}`,
          path: `/admin/student-management/${id}`,
          navigable: true,
        },
        {
          label: "Attendance",
          path: `/admin/student-management/${id}/attendence`,
          navigable: false,
        },
      ]);
    }
    return () => updateBreadcrumbs([]);
  }, [studentInfo, id, updateBreadcrumbs]);

  return (
    <div className="space-y-6 mt-4 bg-sidebar rounded-xl p-6 border border-sidebar-border">
      <div className="flex items-center gap-4">
        {studentInfo && (
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-full bg-[#ff8904] flex items-center justify-center text-white font-semibold text-lg shrink-0">
              {studentInfo.first_name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-dashboard-text dark:text-white capitalize">
                {studentInfo.last_name} {studentInfo.first_name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {studentInfo.email}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="border-b border-gray-150 dark:border-white/10 pb-2">
        <nav className="flex space-x-6">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setFilter({ ...filter, year: y })}
              className={`py-1.5 px-1 border-b-2 font-semibold text-xs transition-colors cursor-pointer ${
                filter.year === y
                  ? "border-[#ff8904] text-[#ff8904]"
                  : "border-transparent text-gray-400 dark:text-white/50 hover:text-gray-600 dark:hover:text-white hover:border-gray-200"
              }`}
            >
              {`${getDurationUnitLabel(studentInfo?.duration_unit, t)} ${y}`}
            </button>
          ))}
        </nav>
      </div>

      <StudentAttendanceTable
        modules={modules}
        isLoading={isLoading || isFetching}
        error={error}
        onRetry={refetch}
        emptyMessage={t(
          "studentManagement.attendance.empty",
          "No attendance records found",
        )}
      />
    </div>
  );
};

export default AttendenceView;
