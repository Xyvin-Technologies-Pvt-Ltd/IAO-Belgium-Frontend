import UserCard from "@/components/admin/UserCard";
import ModuleSelectionCard from "@/components/admin/manual-therapy/ModuleSelectionCard";
import { ErrorMessage, LoadingState } from "@/components/common";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { useGetStudentByApplication } from "@/store/useIntakeStore";
import { useGetSpecialExceptions, useUpdateStudentSpecialExceptions } from "@/store/useStudentStore";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatTZ } from "@/utils/dateUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import StatusBadge from "@/components/StatusBadge";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import StudentAttachments from "./StudentAttachments";

const formatSubmissionType = (type) =>
  type
    ? type
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "-";

const StudentDetails = () => {
  const { t } = useTranslation();
  const params = useParams({ strict: false });
  const id = params.id;
  const navigate = useNavigate();
  const { updateBreadcrumbs } = useBreadcrumb();
  
  const [activeTab, setActiveTab] = useState("progress");
  const [filter, setFilter] = useState({ year: 1 });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedExceptions, setSelectedExceptions] = useState([]);

  const { data: allExceptionsData, isLoading: isExceptionsLoading } = useGetSpecialExceptions({
    enabled: isEditModalOpen,
  });
  const allExceptions = allExceptionsData?.data || [];
  const updateExceptionsMutation = useUpdateStudentSpecialExceptions();

  const {
    data: student,
    isLoading,
    error,
    refetch,
  } = useGetStudentByApplication(id);

  useEffect(() => {
    if (student?.data) {
      const isStudentManagement = window.location.pathname.startsWith("/admin/student-management");
      
      if (isStudentManagement) {
        updateBreadcrumbs([
          {
            label: t("sidebar.admin.studentManagement", "Student Management"),
            path: "/admin/student-management",
            navigable: true,
          },
          {
            label: t("common.studentDetails", "Student Details"),
            path: `/admin/student-management/${id}`,
            navigable: false,
          },
        ]);
      } else {
        updateBreadcrumbs([
          {
            label: t("common.admissionAdministration"),
            path: "/admin/admission-administration",
            navigable: false,
          },
          {
            label: t("common.academics"),
            path: "/admin/admission-administration/academics",
            navigable: true,
          },
          {
            label: t("common.intakes"),
            path: `/admin/admission-administration/academics/${student?.data?.academic}`,
            navigable: true,
          },
          {
            label: t("common.intakeDetails"),
            path: `/admin/admission-administration/academics/intakes/${student?.data?.intake_id}`,
            navigable: true,
          },
          {
            label: t("common.batchDetails"),
            path: `/admin/admission-administration/academics/intakes/batch/${student?.data?.batch_id}`,
            navigable: true,
          },
          {
            label: t("common.studentDetails"),
            path: `/admin/admission-administration/academics/intakes/batch/student/${id}`,
            navigable: false,
          },
        ]);
      }
    }
    return () => {
      updateBreadcrumbs([]);
    };
  }, [student?.data, id]);

  if (isLoading) {
    return (
      <LoadingState text={t("intakeManagement.details.loading")} fullHeight />
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={error?.message || t("intakeManagement.details.loadFailed")}
          onRetry={refetch}
          variant="card"
        />
      </div>
    );
  }

  const studentData = student?.data;
  if (!studentData) return null;

  const totalYears = studentData?.year || 1;
  const years = Array.from({ length: totalYears }, (_, i) => i + 1);

  const modules = studentData?.completed_modules || [];
  const exams = studentData?.completed_exams || [];
  const apps = studentData?.completed_submissions || [];
  const attendance = studentData?.attendance_percentage || 0;

  const attendanceData = [
    { name: "Present", value: attendance, color: "#FFCD71" },
    { name: "Absent", value: 100 - attendance, color: "#FFF7E8" },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6 mt-4 bg-sidebar rounded-xl p-5 border border-sidebar-border">
      <UserCard student={studentData} />

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-white/20">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("progress")}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
              activeTab === "progress"
                ? "border-[#ff8904] text-[#ff8904]"
                : "border-transparent text-gray-500 dark:text-white/70 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/30"
            }`}
          >
            {t("studentManagement.tabs.progress", "Academic Progress")}
          </button>
          {studentData.program_type === "Manual Therapie" && (
            <button
              onClick={() => setActiveTab("general")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                activeTab === "general"
                  ? "border-[#ff8904] text-[#ff8904]"
                  : "border-transparent text-gray-500 dark:text-white/70 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/30"
              }`}
            >
              {t("studentManagement.tabs.general", "Module Selection")}
            </button>
          )}
          <button
            onClick={() => setActiveTab("attachments")}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
              activeTab === "attachments"
                ? "border-[#ff8904] text-[#ff8904]"
                : "border-transparent text-gray-500 dark:text-white/70 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/30"
            }`}
          >
            {t("studentManagement.tabs.notesAndAttachments", "Notes & Attachments")}
          </button>
        </nav>
      </div>

      {activeTab === "progress" && (
        <div className="space-y-6">
          {/* Year level filter inside Progress tab */}
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
                  {studentData?.duration_unit && studentData.duration_unit !== "years"
                    ? `${t("common.level", "Level")} ${y}`
                    : `${t("common.year", "Year")} ${y}`}
                </button>
              ))}
            </nav>
          </div>

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-6">
              <h3 className="font-semibold mb-4">Completed Modules</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module ID</TableHead>
                    <TableHead>Module Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.length > 0 ? (
                    modules.map((m) => (
                      <TableRow key={m._id}>
                        <TableCell>{m.uid}</TableCell>
                        <TableCell>{m.name}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="text-center text-muted-foreground"
                      >
                        No modules completed
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="col-span-12 lg:col-span-6">
              <h3 className="font-semibold mb-4">Completed Exams</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam</TableHead>
                    <TableHead>Scores</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.length > 0 ? (
                    exams.map((exam) => (
                      <TableRow key={exam._id}>
                        <TableCell>{exam.exam_name}</TableCell>
                        <TableCell>{exam.percentage?.toFixed(2)}/100</TableCell>
                        <TableCell>
                          <StatusBadge status={exam.result} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground"
                      >
                        No exams completed
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="col-span-12 lg:col-span-8">
              <h3 className="font-semibold mb-4">Completed APPs</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>APP</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Scores</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apps.length > 0 ? (
                    apps.map((app) => (
                      <TableRow key={app._id}>
                        <TableCell>{app.component_name}</TableCell>
                        <TableCell>{formatSubmissionType(app.submission_type)}</TableCell>
                        <TableCell>{app.score ?? "-"}</TableCell>
                        <TableCell>
                          <StatusBadge status={app.status} />
                        </TableCell>
                        <TableCell>
                          {formatTZ(app.submitted_at, "DD MMM YYYY") || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground"
                      >
                        No APP submissions
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="col-span-12 lg:col-span-4">
              {!studentData?.is_online && (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold">Attendance</h3>
                    <button 
                      onClick={() => navigate({ to: `/admin/student-management/${studentData._id}/attendence` })}
                      className="text-blue-500 hover:text-blue-700 font-medium text-sm transition-colors cursor-pointer"
                    >
                      See more
                    </button>
                  </div>
                  <div className="border border-sidebar-border rounded-lg p-6 flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={attendanceData}
                          dataKey="value"
                          startAngle={180}
                          endAngle={0}
                          cx="50%"
                          cy="90%"
                          innerRadius={80}
                          outerRadius={100}
                          stroke="none"
                        >
                          {attendanceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute text-3xl font-semibold text-black">
                      {attendance}%
                    </div>
                  </div>
                </>
              )}

              {/* Medical / Special Exceptions Section */}
              <div className="mt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Special Exceptions</h3>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="text-[#ff8904] hover:text-[#e07b03] font-medium text-sm transition-colors cursor-pointer"
                  >
                    Configure
                  </button>
                </div>
                <div className="border border-sidebar-border rounded-lg p-5 bg-card text-card-foreground shadow-sm">
                  {studentData.special_exceptions && studentData.special_exceptions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {studentData.special_exceptions.map((ex) => (
                        <span
                          key={ex._id}
                          className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300 border border-orange-200 dark:border-orange-900/50"
                        >
                          {ex.name} (+{ex.extra_time_min} min)
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">
                      No exceptions configured. Default exam settings apply.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "general" && studentData.program_type === "Manual Therapie" && (
        <ModuleSelectionCard applicationId={studentData.application_id} />
      )}

      {activeTab === "attachments" && (
        <StudentAttachments studentId={studentData._id} attachments={studentData.attachments || []} />
      )}

      {/* Edit Special Exceptions Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-full max-w-md flex flex-col p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Configure Special Exceptions
            </h3>
            
            <p className="text-xs text-gray-500 dark:text-white/60">
              Select all special medical conditions or learning difficulties that apply to this student. The system will automatically apply the maximum extra minutes to their exams.
            </p>

            {isExceptionsLoading ? (
              <p className="text-sm">Loading conditions...</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {allExceptions.map((ex) => {
                  const isChecked = selectedExceptions.includes(ex._id);
                  return (
                    <label
                      key={ex._id}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedExceptions(selectedExceptions.filter(exid => exid !== ex._id));
                          } else {
                            setSelectedExceptions([...selectedExceptions, ex._id]);
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {ex.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-white/60">
                          +{ex.extra_time_min} min extra time
                        </p>
                      </div>
                    </label>
                  );
                })}
                {allExceptions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No exceptions configured in system yet.
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-white bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  updateExceptionsMutation.mutate(
                    { id: studentData._id, specialExceptions: selectedExceptions },
                    {
                      onSuccess: () => {
                        setIsEditModalOpen(false);
                        refetch();
                      },
                    }
                  );
                }}
                disabled={updateExceptionsMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-[#ff8904] rounded-lg hover:bg-[#e07b03] disabled:opacity-50 cursor-pointer"
              >
                {updateExceptionsMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Initialize state when modal is opened */}
      {(() => {
        if (isEditModalOpen && selectedExceptions.length === 0 && studentData.special_exceptions?.length > 0) {
          setSelectedExceptions(studentData.special_exceptions.map(ex => ex._id || ex));
        }
      })()}
    </div>
  );
};

export default StudentDetails;
