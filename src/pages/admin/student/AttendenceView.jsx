import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import ErrorMessage from "@/components/common/ErrorMessage";
import {
  useGetStudentAttendance,
  useGetStudentById,
} from "@/store/useStudentStore";
import { Check, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import moment from "moment";

const AttendenceView = () => {
  const params = useParams({ strict: false });
  const id = params.id;
  const navigate = useNavigate();
  const { updateBreadcrumbs } = useBreadcrumb();
  const [filter, setFilter] = useState({ year: 1 });

  // Student info is year-independent — fetch once without filter
  const { data: studentData } = useGetStudentById(id);

  const { data, isLoading, error, refetch, isFetching } =
    useGetStudentAttendance(id, filter);

  const studentInfo = studentData?.data;
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
          label: `${studentInfo.first_name} ${studentInfo.last_name}`,
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
  }, [studentInfo, id]);

  const getAttendanceIcon = (status) => {
    if (status === "present") {
      return (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="w-2 h-2 text-white stroke-[3]" />
          </div>
        </div>
      );
    } else if (status === "absent") {
      return (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
            <X className="w-2 h-2 text-white stroke-[3]" />
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center">
        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
      </div>
    );
  };

  return (
    <div className="space-y-6 mt-4 bg-sidebar rounded-xl p-6 border border-sidebar-border">
      <div className="flex items-center gap-4">
        {studentInfo && (
          <div className="flex items-center gap-4 flex-1">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-[#ff8904] flex items-center justify-center text-white font-semibold text-lg shrink-0">
              {studentInfo.first_name?.charAt(0).toUpperCase() || "?"}
            </div>

            {/* Info */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold text-foreground">
                  {studentInfo.first_name} {studentInfo.last_name}
                </span>
                {studentInfo.uid && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-muted text-muted-foreground">
                    {studentInfo.uid}
                  </span>
                )}
                {studentInfo.year && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-muted text-muted-foreground">
                    Year {filter.year}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                {studentInfo.program_name && (
                  <span>{studentInfo.program_name}</span>
                )}
                {studentInfo.batch_name && (
                  <>
                    <span className="text-muted-foreground/40">•</span>
                    <span>{studentInfo.batch_name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-white/20">
        <nav className="-mb-px flex space-x-8">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setFilter({ ...filter, year: y })}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                filter.year === y
                  ? "border-[#ff8904] text-[#ff8904]"
                  : "border-transparent text-gray-500 dark:text-white/70 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/30"
              }`}
            >
              Year {y}
            </button>
          ))}
        </nav>
      </div>

      <div>
        <Table className="border-collapse">
          <TableHeader>
            <TableRow className="bg-muted/50 border-b">
              <TableHead className="w-[120px] font-semibold text-foreground uppercase text-[11px] tracking-wider py-4 px-4 text-left">
                Module
              </TableHead>
              <TableHead className="w-[300px] font-semibold text-foreground uppercase text-[11px] tracking-wider py-4 px-4 text-left">
                Module Name
              </TableHead>
              <TableHead className="w-[200px] font-semibold text-foreground uppercase text-[11px] tracking-wider py-4 px-4 text-left">
                Sessions
              </TableHead>
              <TableHead className="w-[180px] font-semibold text-foreground uppercase text-[11px] tracking-wider py-4 px-4 text-left">
                Date
              </TableHead>
              <TableHead className="font-semibold text-foreground uppercase text-[11px] tracking-wider py-4 px-4 text-center">
                Attendance
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody
            className={isFetching ? "opacity-50 pointer-events-none" : ""}
          >
            {isLoading ? (
              <TableSkeleton rows={5} columns={5} />
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center p-8">
                  <ErrorMessage
                    message={error?.message || "Failed to load attendance"}
                    onRetry={refetch}
                    variant="inline"
                  />
                </TableCell>
              </TableRow>
            ) : modules?.length > 0 ? (
              modules.map((module, mIdx) => (
                <React.Fragment key={mIdx}>
                  {module.sessions.length > 0 ? (
                    module.sessions.map((session, sIdx) => (
                      <TableRow
                        key={`${mIdx}-${sIdx}`}
                        className="hover:bg-muted/10 border-b transition-colors"
                      >
                        {sIdx === 0 && (
                          <>
                            <TableCell
                              rowSpan={module.sessions.length}
                              className="align-top py-4 px-4 font-medium text-sm text-foreground/80"
                            >
                              <div className="mt-1">{module.uid}</div>
                            </TableCell>
                            <TableCell
                              rowSpan={module.sessions.length}
                              className="align-top py-4 px-4 font-bold text-sm text-foreground/90 max-w-[300px]"
                            >
                              <div className="mt-1 leading-tight whitespace-normal break-words">
                                {module.name}
                              </div>
                            </TableCell>
                          </>
                        )}
                        <TableCell className="py-4 px-4 text-sm text-foreground/70 align-middle">
                          {session.name}
                        </TableCell>
                        <TableCell className="py-4 px-4 text-sm text-foreground/70 align-middle">
                          {session.date ? moment(session.date).format("DD MMMM, YYYY") : "-"}
                        </TableCell>
                        <TableCell className="py-4 px-4 text-center align-middle">
                          {getAttendanceIcon(session.attendance)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow
                      key={mIdx}
                      className="hover:bg-muted/10  transition-colors"
                    >
                      <TableCell className="py-4 px-4 font-medium text-sm text-foreground/80 align-middle">
                        {module.uid}
                      </TableCell>
                      <TableCell className="py-4 px-4 font-bold text-sm text-foreground/90 max-w-[300px] align-middle whitespace-normal break-words">
                        {module.name}
                      </TableCell>
                      <TableCell className="py-4 px-4 text-sm text-muted-foreground italic align-middle">
                        No sessions planned
                      </TableCell>
                      <TableCell className="py-4 px-4 text-sm text-muted-foreground italic text-center align-middle">
                        -
                      </TableCell>
                      <TableCell className="py-4 px-4 text-center align-middle">
                        {getAttendanceIcon("pending")}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center p-8 text-muted-foreground italic text-sm"
                >
                  No attendance records found for this year.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AttendenceView;
