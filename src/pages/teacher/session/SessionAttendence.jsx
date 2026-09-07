import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";
import {
  useGetStudentsByComponent,
} from "@/store/useComponentStore";
import { useMarkAttendance } from "@/store/useAttendenceStore";
import { useParams, useSearch } from "@tanstack/react-router";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { getMoment, getNow } from "@/utils/dateUtils";


const SessionAttendence = () => {
  const { t } = useTranslation();
  const params = useParams({ strict: false });
  const search = useSearch({ strict: false });
  const { updateBreadcrumbs } = useBreadcrumb();

  const sessionId = params.id;
  const planningId = search.planning_id;

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchText, setSearchText] = useState("");


  const debouncedSearch = useDebounce(searchText, 500);


  const { data, isLoading, error, refetch, isFetching } =
    useGetStudentsByComponent(planningId, {
      page: page,
      limit: rowsPerPage,
      session_id: sessionId,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    });

  const markAttendanceMutation = useMarkAttendance();

  const students = data?.data?.students || [];
  const sessionDate = data?.data?.session_date;
  const totalRows = data?.total_count || 0;
  const component = data?.data?.component_name;

  const sessionDay = sessionDate
    ? getMoment(sessionDate).format("YYYY-MM-DD")
    : null;
  const markingDeadline = sessionDate
    ? getMoment(sessionDate).add(7, "days").format("YYYY-MM-DD")
    : null;
  const today = getNow().format("YYYY-MM-DD");
  const isSessionFuture = sessionDay ? sessionDay > today : false;
  const isSessionPast = markingDeadline ? today > markingDeadline : false;
  const canMarkAttendance =
    sessionDay && markingDeadline
      ? today >= sessionDay && today <= markingDeadline
      : false;
  const isAttendanceLocked = !canMarkAttendance;

  useEffect(() => {
    if (component) {
      updateBreadcrumbs([
        { label: "Dashboard", path: "/teacher/dashboard" },
        { label: "Modules", path: "/teacher/schedules" },
        { label: component || "Module", path: `/teacher/schedules/module/${planningId}` },
        { label: "Mark Attendance", path: "" },
      ]);
    }

    return () => {
      updateBreadcrumbs([]);
    };
  }, [component, planningId, updateBreadcrumbs]);

  const handleAttendanceUpdate = (applicationId, status) => {
    markAttendanceMutation.mutate({
      session_id: sessionId,
      application_id: applicationId,
      status: status,
    });
  };



  return (
    <div className="space-y-6 mt-4">
      <div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-gray-800">
            Attendance Marking
          </h1>

          {isLoading ? (
            <div className="h-8 w-64 bg-gray-200 animate-pulse rounded" />
          ) : (
            <div className="flex items-center gap-4 flex-wrap">
              <h2 className="text-lg text-gray-700 font-medium">
                {component || "N/A"}
              </h2>
            </div>
          )}

          {isSessionFuture && (
            <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                Attendance marking is not available yet. You can mark attendance
                from the session date through 7 days after.
              </p>
            </div>
          )}

          {isSessionPast && (
            <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">
                Attendance marking is closed. The 7-day window after the session
                has ended.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder={t("planningManagement.search")}
          className="max-w-xs"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student Name</TableHead>
            <TableHead>Enrollment Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody
          className={isFetching ? "opacity-50 pointer-events-none" : ""}
        >
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={3} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center p-8">
                <ErrorMessage
                  message={
                    error?.message ||
                    t("planningManagement.messages.loadFailed")
                  }
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : students?.length > 0 ? (
            students?.map((student) => {
              const currentStatus = student.attendance_status;
              return (
                <TableRow key={student.application_id}>
                  <TableCell className={"capitalize"}>
                    {`${student.last_name || ""} ${student.first_name || ""}`.trim() ||
                      "N/A"}
                  </TableCell>
                  <TableCell>
                    {student.purchased ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Enrolled
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        Not Enrolled
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={
                          currentStatus === "present" ? "default" : "outline"
                        }
                        className={
                          currentStatus === "present"
                            ? "bg-[#49BA6C]! text-white! hover:bg-[#49BA6C]/90!"
                            : "text-muted-foreground bg-[#808080]/10 hover:bg-gray-200 border-gray-300"
                        }
                        style={
                          currentStatus === "present" && (markAttendanceMutation.isPending || isAttendanceLocked || !student.purchased)
                            ? { backgroundColor: "#49BA6C", color: "#ffffff", opacity: 0.7 }
                            : {}
                        }
                        onClick={() =>
                          handleAttendanceUpdate(student.application_id, "present")
                        }
                        disabled={
                          markAttendanceMutation.isPending || isAttendanceLocked || !student.purchased
                        }
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Present
                      </Button>
                      <Button
                        size="sm"
                        variant={
                          currentStatus === "absent" ? "default" : "outline"
                        }
                        className={
                          currentStatus === "absent"
                            ? "bg-[#E7000B]! text-white! hover:bg-[#E7000B]/90!"
                            : "text-muted-foreground bg-[#808080]/10 hover:bg-gray-200 border-gray-300"
                        }
                        style={
                          currentStatus === "absent" && (markAttendanceMutation.isPending || isAttendanceLocked || !student.purchased)
                            ? { backgroundColor: "#E7000B", color: "#ffffff", opacity: 0.7 }
                            : {}
                        }
                        onClick={() =>
                          handleAttendanceUpdate(student.application_id, "absent")
                        }
                        disabled={
                          markAttendanceMutation.isPending || isAttendanceLocked || !student.purchased
                        }
                      >
                        <X className="h-4 w-4 mr-1" />
                        Absent
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center">
                No students found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination
        page={page}
        setPage={setPage}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
        totalRows={totalRows}
      />


    </div>
  );
};

export default SessionAttendence;
