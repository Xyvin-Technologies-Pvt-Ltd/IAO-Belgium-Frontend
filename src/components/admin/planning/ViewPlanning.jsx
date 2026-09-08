import { useEffect, useState } from "react";
import { Check, MapPin, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useTranslation } from "react-i18next";
import { formatTZ } from "@/utils/dateUtils";
import { useDebounce } from "@/hooks/useDebounce";
import { useGetPlanningStudents } from "@/store/usePlanningStore";
import { useMarkAttendance } from "@/store/useAttendenceStore";
import { useAuthStore } from "@/store/useAuthStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ViewPlanning = ({ open, onClose, planningData }) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const profile = useAuthStore((state) => state.profile);
  const canMarkAttendance = profile?.role === "admin" || profile?.role === "teacher";
  const markAttendanceMutation = useMarkAttendance();
  const [pendingCell, setPendingCell] = useState(null);

  const planningId = planningData?._id;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, planningId]);

  const { data, isLoading, error, refetch, isFetching } = useGetPlanningStudents(
    planningId,
    {
      page,
      limit: rowsPerPage,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    },
    { enabled: open && !!planningId },
  );

  if (!open || !planningData) return null;

  const students = data?.data?.students || [];
  const attendanceSessions = data?.data?.sessions || [];
  const totalRows = data?.total_count || 0;

  const handleMarkAttendance = (applicationId, sessionId, status) => {
    setPendingCell({ applicationId, sessionId });
    markAttendanceMutation.mutate(
      {
        session_id: sessionId,
        application_id: applicationId,
        status,
      },
      {
        onSettled: () => {
          setPendingCell(null);
        },
      }
    );
  };

  const getBadgeStyles = (status) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return "bg-green-100 text-green-800 hover:bg-green-200 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
      case "rejected":
        return "bg-red-100 text-red-800 hover:bg-red-200 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
      case "pending":
      default:
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
    }
  };

  const getAttendanceIcon = (status) => {
    if (status === "present") {
      return (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="w-2 h-2 text-white stroke-3" />
          </div>
        </div>
      );
    }
    if (status === "absent") {
      return (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
            <X className="w-2 h-2 text-white stroke-3" />
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center">
        <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600" />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-black w-full max-w-5xl rounded-xl shadow-lg overflow-hidden border dark:border-white/20 max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between p-6 border-b dark:border-white/20">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t("planningManagement.view.moduleLabel")}:{" "}
              {planningData?.component?.name || "N/A"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground dark:text-white/70 hover:text-gray-700 dark:hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <InfoItem
              label={t("planningManagement.view.programLabel")}
              value={planningData?.component?.program?.name || "N/A"}
            />
            <InfoItem
              label={t("planningManagement.view.batchLabel")}
              value={planningData?.batch?.name || "N/A"}
            />
            <InfoItem
              label={t("planningManagement.view.studentsLabel")}
              value={planningData?.student_count || 0}
            />
            {planningData?.description && (
              <InfoItem
                label={t("planningManagement.view.descriptionLabel")}
                value={planningData.description}
              />
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("planningManagement.view.studentListTitle")}
              </h3>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("planningManagement.view.searchStudents")}
                className="sm:max-w-xs"
              />
            </div>

            {error ? (
              <ErrorMessage
                message={
                  error?.message ||
                  t("planningManagement.view.studentsLoadFailed")
                }
                onRetry={refetch}
              />
            ) : isLoading ? (
              <div className="overflow-x-auto rounded-md border dark:border-white/20">
                <Table>
                  <TableBody>
                    <TableSkeleton
                      columns={3 + Math.max(attendanceSessions.length, 1)}
                      rows={5}
                    />
                  </TableBody>
                </Table>
              </div>
            ) : students.length === 0 ? (
              <p className="text-sm text-muted-foreground dark:text-white/60">
                {t("planningManagement.view.noStudents")}
              </p>
            ) : (
              <div className="overflow-x-auto rounded-md border dark:border-white/20">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {t("planningManagement.view.studentNameColumn")}
                      </TableHead>
                      <TableHead>
                        {t("planningManagement.view.locationColumn")}
                      </TableHead>
                      {attendanceSessions.map((session) => (
                        <TableHead
                          key={session._id}
                          className="text-center whitespace-nowrap"
                        >
                          <div>
                            {session.name ||
                              t("planningManagement.view.sessionLabel")}
                          </div>
                          <div className="text-xs font-normal text-muted-foreground">
                            {formatTZ(session.session_date, "YYYY-MM-DD") || ""}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody
                    className={
                      isFetching ? "opacity-50 pointer-events-none" : ""
                    }
                  >
                    {students.map((student) => {
                      const name =
                        `${student.last_name || ""} ${student.first_name || ""}`.trim() ||
                        "—";
                      const locationTitle = student.home_batch?.name
                        ? t("planningManagement.view.locationChangedFrom", {
                            batch: student.home_batch.name,
                          })
                        : t("planningManagement.view.locationChanged");

                      return (
                        <TableRow key={student.application_id}>
                          <TableCell className="font-medium">{name}</TableCell>
                          <TableCell>
                            {student.location_override ? (
                              <div
                                className="flex items-center gap-2"
                                title={locationTitle}
                              >
                                <div className="w-4 h-4 rounded-full bg-orange-400 flex items-center justify-center shrink-0">
                                  <MapPin className="w-2 h-2 text-white stroke-3" />
                                </div>
                                <span className="text-sm text-muted-foreground dark:text-white/70">
                                  {student.home_batch?.name ||
                                    t(
                                      "planningManagement.view.locationChanged",
                                    )}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                —
                              </span>
                            )}
                          </TableCell>
                          {attendanceSessions.map((session) => {
                            const currentStatus = student.attendance?.[session._id] ?? null;
                            const detail = student.attendance_details?.[session._id];
                            const markedBy = detail?.marked_by;
                            const markedByName = markedBy
                              ? `${markedBy.last_name || ""} ${markedBy.first_name || ""}`.trim() || markedBy.email
                              : null;
                            const markedByRole = markedBy?.role;
                            const isPendingThisCell =
                              pendingCell?.applicationId === student.application_id &&
                              pendingCell?.sessionId === session._id;

                            const tooltipTitle = markedByName
                              ? `Status: ${currentStatus || "Not marked"}\nMarked by: ${markedByName} (${markedByRole})`
                              : currentStatus
                              ? `Status: ${currentStatus}`
                              : "Not marked";

                            const cellContent = (
                              <div
                                className={`flex flex-col items-center justify-center p-1.5 rounded transition-all ${
                                  canMarkAttendance
                                    ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800/80"
                                    : ""
                                }`}
                                title={tooltipTitle}
                              >
                                {isPendingThisCell ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                ) : (
                                  getAttendanceIcon(currentStatus)
                                )}
                                {markedByName && (
                                  <span className="text-[10px] leading-tight text-muted-foreground dark:text-white/60 mt-1 max-w-[80px] truncate text-center">
                                    {markedByName} ({markedByRole})
                                  </span>
                                )}
                              </div>
                            );

                            return (
                              <TableCell key={session._id} className="text-center">
                                {canMarkAttendance ? (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      {cellContent}
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="center">
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleMarkAttendance(
                                            student.application_id,
                                            session._id,
                                            "present"
                                          )
                                        }
                                        className="cursor-pointer text-green-600 focus:text-green-700 font-medium"
                                      >
                                        <Check className="w-4 h-4 mr-2" />
                                        Mark Present
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleMarkAttendance(
                                            student.application_id,
                                            session._id,
                                            "absent"
                                          )
                                        }
                                        className="cursor-pointer text-red-600 focus:text-red-700 font-medium"
                                      >
                                        <X className="w-4 h-4 mr-2" />
                                        Mark Absent
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                ) : (
                                  cellContent
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {totalRows > 0 && (
              <Pagination
                page={page}
                setPage={setPage}
                rowsPerPage={rowsPerPage}
                setRowsPerPage={setRowsPerPage}
                totalRows={totalRows}
              />
            )}
          </div>

          {planningData?.sessions && planningData.sessions.length > 0 && (
            <div className="space-y-6">
              {planningData.sessions.map((session, index) => (
                <div key={session._id || index}>
                  {index > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>
                  )}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t("planningManagement.view.sessionLabel")} {index + 1}
                    </h3>

                    <InfoItem
                      label={t("planningManagement.view.sessionNameLabel")}
                      value={session.name || "N/A"}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <InfoItem
                        label={t("planningManagement.view.dateLabel")}
                        value={
                          formatTZ(session.session_date, "YYYY-MM-DD") || "N/A"
                        }
                      />
                      <InfoItem
                        label={t("planningManagement.view.timeFromLabel")}
                        value={formatTZ(session.start_time, "HH:mm") || "N/A"}
                      />
                      <InfoItem
                        label={t("planningManagement.view.timeTillLabel")}
                        value={formatTZ(session.end_time, "HH:mm") || "N/A"}
                      />
                    </div>

                    {session.teachers && session.teachers.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                          {t("planningManagement.view.teachersLabel")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {session.teachers.map((teacherObj, teacherIndex) => {
                            const teacher = teacherObj.teacher || teacherObj;
                            const teacherName =
                              teacher.first_name && teacher.last_name
                                ? `${teacher.last_name} ${teacher.first_name}`.trim()
                                : teacher.name || "Unknown Teacher";
                            const status = teacherObj.status || "pending";

                            return (
                              <Badge
                                key={teacher._id || teacherIndex}
                                variant="outline"
                                className={`text-xs  capitalize ${getBadgeStyles(status)}`}
                              >
                                {teacherName}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {session.assistants && session.assistants.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                          {t("planningManagement.modal.assistantsLabel")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {session.assistants.map(
                            (assistantObj, assistantIndex) => {
                              const assistant =
                                assistantObj.assistant || assistantObj;
                              const assistantName =
                                assistant.first_name && assistant.last_name
                                  ? `${assistant.last_name} ${assistant.first_name}`.trim()
                                  : assistant.name || "Unknown Assistant";
                              const status = assistantObj.status || "pending";

                              return (
                                <Badge
                                  key={assistant._id || assistantIndex}
                                  variant="outline"
                                  className={`text-xs capitalize ${getBadgeStyles(status)}`}
                                >
                                  {assistantName}
                                </Badge>
                              );
                            },
                          )}
                        </div>
                      </div>
                    )}

                    {session.trainees && session.trainees.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                          {t("planningManagement.modal.traineesLabel")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {session.trainees.map((traineeObj, traineeIndex) => {
                            const trainee = traineeObj.trainee || traineeObj;
                            const traineeName =
                              trainee.first_name && trainee.last_name
                                ? `${trainee.last_name} ${trainee.first_name}`.trim()
                                : trainee.name || "Unknown Trainee";
                            const status = traineeObj.status || "pending";

                            return (
                              <Badge
                                key={trainee._id || traineeIndex}
                                variant="outline"
                                className={`text-xs capitalize ${getBadgeStyles(status)}`}
                              >
                                {traineeName}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {planningData?.exams && planningData.exams.length > 0 && (
            <div className="space-y-6">
              <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("planningManagement.view.examsLabel", "Linked Exams")}
              </h3>
              <div className="grid grid-cols-1 gap-6">
                {planningData.exams.map((exam, index) => {
                  const examName =
                    exam.exam?.name ||
                    exam.exam_component?.name ||
                    "Unnamed Exam";
                  const teacherName = exam.teacher
                    ? `${exam.teacher.last_name || ""} ${exam.teacher.first_name || ""}`.trim()
                    : "N/A";

                  return (
                    <div
                      key={exam._id || index}
                      className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-4 space-y-4 border dark:border-zinc-800"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-900 dark:text-white">
                          {examName}
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <InfoItem
                          label={t(
                            "planningManagement.view.examTeacherLabel",
                            "Supervisor / Teacher",
                          )}
                          value={teacherName}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {planningData?.venue && (
            <div>
              <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>
              <InfoItem
                label={t("planningManagement.view.venueLabel")}
                value={planningData.venue}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-sm font-medium text-gray-700 dark:text-white/70">
      {label}
    </p>
    <p className="text-base text-gray-900 dark:text-white">{value}</p>
  </div>
);

export default ViewPlanning;
