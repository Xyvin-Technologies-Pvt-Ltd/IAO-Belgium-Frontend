import UserCard from "@/components/admin/UserCard";
import StudentAttendanceTable from "@/components/admin/StudentAttendanceTable";
import ModuleSelectionCard from "@/components/admin/manual-therapy/ModuleSelectionCard";
import { ErrorMessage, LoadingState } from "@/components/common";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { useGetStudentByApplication } from "@/store/useIntakeStore";
import {
  useGetSpecialExceptions,
  useGetStudentAttendance,
  useUpdateStudentSpecialExceptions,
} from "@/store/useStudentStore";
import { getInvoiceHtml } from "@/api/paymentApi";
import { useParams } from "@tanstack/react-router";
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
import { Download } from "lucide-react";
import moment from "moment";
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
  const { updateBreadcrumbs } = useBreadcrumb();

  const [activeTab, setActiveTab] = useState("progress");
  const [filter, setFilter] = useState({ year: 1 });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedExceptions, setSelectedExceptions] = useState([]);

  const { data: allExceptionsData, isLoading: isExceptionsLoading } =
    useGetSpecialExceptions({
      enabled: isEditModalOpen,
    });
  const allExceptions = allExceptionsData?.data || [];
  const updateExceptionsMutation = useUpdateStudentSpecialExceptions();

  const {
    data: student,
    isLoading,
    error,
    refetch,
  } = useGetStudentByApplication(
    id,
    activeTab === "progress" ? { year: filter.year } : {},
  );

  const studentUserId = student?.data?._id;
  const {
    data: attendanceResponse,
    isLoading: attendanceLoading,
    error: attendanceError,
    refetch: refetchAttendance,
    isFetching: attendanceFetching,
  } = useGetStudentAttendance(studentUserId, filter, {
    enabled: !!studentUserId && !student?.data?.is_online,
  });

  useEffect(() => {
    if (student?.data) {
      const isStudentManagement = window.location.pathname.startsWith(
        "/admin/student-management",
      );

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

  const formatPurpose = (purpose) => {
    if (!purpose) return t("common.notAvailable");
    switch (purpose) {
      case "admission-fee":
        return t("finance.purposes.admissionFee");
      case "module-purchase":
        return t("finance.purposes.modulePurchase");
      case "custom-invoice":
        return t("finance.purposes.customInvoice");
      default:
        return purpose
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
    }
  };

  const handleDownloadInvoice = async (payment) => {
    try {
      const html = await getInvoiceHtml(payment._id);
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      document.body.appendChild(iframe);
      iframe.contentDocument.open();
      iframe.contentDocument.write(html);
      iframe.contentDocument.close();
      iframe.contentWindow.focus();
      iframe.contentWindow.onafterprint = () => document.body.removeChild(iframe);
      setTimeout(() => iframe.contentWindow.print(), 500);
    } catch (err) {
      console.error("Failed to download invoice:", err);
    }
  };

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

  const modules = studentData?.assigned_modules || [];
  const exams = studentData?.completed_exams || [];
  const apps = studentData?.assigned_apps || [];
  const payments = studentData?.payments || [];
  const attendanceModules = attendanceResponse?.data || [];

  const getAppStatus = (app) => app.review_status || app.status;

  return (
    <div className="space-y-6 mt-4 bg-sidebar rounded-xl p-5 border border-sidebar-border">
      <UserCard student={studentData} />

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
            onClick={() => setActiveTab("payments")}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
              activeTab === "payments"
                ? "border-[#ff8904] text-[#ff8904]"
                : "border-transparent text-gray-500 dark:text-white/70 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/30"
            }`}
          >
            {t("studentManagement.tabs.payments", "Payments")}
          </button>
          <button
            onClick={() => setActiveTab("attachments")}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
              activeTab === "attachments"
                ? "border-[#ff8904] text-[#ff8904]"
                : "border-transparent text-gray-500 dark:text-white/70 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/30"
            }`}
          >
            {t(
              "studentManagement.tabs.notesAndAttachments",
              "Notes & Attachments",
            )}
          </button>
        </nav>
      </div>

      {activeTab === "progress" && (
        <div className="space-y-6">
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
                  {studentData?.duration_unit &&
                  studentData.duration_unit !== "years"
                    ? `${t("common.level", "Level")} ${y}`
                    : `${t("common.year", "Year")} ${y}`}
                </button>
              ))}
            </nav>
          </div>

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-6">
              <h3 className="font-semibold mb-4">
                {t("studentManagement.details.assignedModules", "Assigned Modules")}
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {t("studentManagement.details.moduleId", "Module ID")}
                    </TableHead>
                    <TableHead>
                      {t("studentManagement.details.moduleName", "Module Name")}
                    </TableHead>
                    <TableHead>
                      {t("studentManagement.table.status", "Status")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.length > 0 ? (
                    modules.map((m) => (
                      <TableRow key={m._id}>
                        <TableCell>{m.uid}</TableCell>
                        <TableCell>{m.name}</TableCell>
                        <TableCell>
                          <StatusBadge status={m.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground"
                      >
                        {t(
                          "studentManagement.details.noAssignedModules",
                          "No modules assigned",
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="col-span-12 lg:col-span-6">
              <h3 className="font-semibold mb-4">
                {t(
                  "studentManagement.details.completedExams",
                  "Completed Exams",
                )}
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.exam", "Exam")}</TableHead>
                    <TableHead>
                      {t("studentManagement.details.scores", "Scores")}
                    </TableHead>
                    <TableHead>
                      {t("studentManagement.table.status", "Status")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.length > 0 ? (
                    exams.map((exam) => (
                      <TableRow key={exam._id}>
                        <TableCell>{exam.exam_name}</TableCell>
                        <TableCell>
                          {exam.percentage?.toFixed(2)}/100
                        </TableCell>
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
                        {t(
                          "studentManagement.details.noExamsCompleted",
                          "No exams completed",
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="col-span-12">
              <h3 className="font-semibold mb-4">
                {t("studentManagement.details.assignedApps", "Assigned APPs")}
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {t("studentManagement.details.app", "APP")}
                    </TableHead>
                    <TableHead>
                      {t("studentManagement.details.type", "Type")}
                    </TableHead>
                    <TableHead>
                      {t("studentManagement.details.scores", "Scores")}
                    </TableHead>
                    <TableHead>
                      {t("studentManagement.table.status", "Status")}
                    </TableHead>
                    <TableHead>
                      {t(
                        "studentManagement.details.submittedDate",
                        "Submitted Date",
                      )}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apps.length > 0 ? (
                    apps.map((app) => (
                      <TableRow key={app._id}>
                        <TableCell>{app.name}</TableCell>
                        <TableCell>
                          {formatSubmissionType(app.submission_type)}
                        </TableCell>
                        <TableCell>{app.score ?? "-"}</TableCell>
                        <TableCell>
                          <StatusBadge status={getAppStatus(app)} />
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
                        {t(
                          "studentManagement.details.noAssignedApps",
                          "No APPs assigned",
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {!studentData?.is_online && (
              <div className="col-span-12">
                <h3 className="font-semibold mb-4">
                  {t("studentManagement.details.attendance", "Attendance")}
                </h3>
                <div className="border border-sidebar-border rounded-lg overflow-hidden">
                  <StudentAttendanceTable
                    modules={attendanceModules}
                    isLoading={attendanceLoading}
                    error={attendanceError}
                    refetch={refetchAttendance}
                    isFetching={attendanceFetching}
                  />
                </div>
              </div>
            )}

            <div className="col-span-12">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {t(
                      "studentManagement.details.specialExceptions",
                      "Special Exceptions",
                    )}
                  </h3>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="text-[#ff8904] hover:text-[#e07b03] font-medium text-sm transition-colors cursor-pointer"
                  >
                    {t(
                      "studentManagement.details.configureExceptions",
                      "Configure",
                    )}
                  </button>
                </div>
                <div className="border border-sidebar-border rounded-lg p-5 bg-card text-card-foreground shadow-sm">
                  {studentData.special_exceptions &&
                  studentData.special_exceptions.length > 0 ? (
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
                      {t(
                        "studentManagement.details.noExceptions",
                        "No exceptions configured. Default exam settings apply.",
                      )}
                    </p>
                  )}
                </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "payments" && (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.paymentId", "Payment ID")}</TableHead>
                <TableHead>{t("common.purpose", "Purpose")}</TableHead>
                <TableHead>{t("common.component", "Component")}</TableHead>
                <TableHead>{t("common.amount", "Amount")}</TableHead>
                <TableHead>
                  {t("studentManagement.details.billingMethod", "Billing")}
                </TableHead>
                <TableHead>
                  {t("studentManagement.table.status", "Status")}
                </TableHead>
                <TableHead>{t("common.date", "Date")}</TableHead>
                <TableHead>{t("common.actions", "Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length > 0 ? (
                payments.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell>{payment.uid || "-"}</TableCell>
                    <TableCell>{formatPurpose(payment.purpose)}</TableCell>
                    <TableCell>
                      {payment.component_name || t("common.notAvailable")}
                    </TableCell>
                    <TableCell>
                      {payment.currency || "EUR"} {payment.amount?.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {payment.billing_method === "company"
                        ? t("studentManagement.billing.company", "Company")
                        : t("studentManagement.billing.personal", "Personal")}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={payment.display_status} />
                    </TableCell>
                    <TableCell>
                      {payment.paid_at
                        ? moment(payment.paid_at).format("DD-MM-YYYY")
                        : moment(payment.createdAt).format("DD-MM-YYYY")}
                    </TableCell>
                    <TableCell>
                      {payment.status === "paid" ? (
                        <button
                          type="button"
                          onClick={() => handleDownloadInvoice(payment)}
                          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                          title={t(
                            "studentManagement.details.downloadInvoice",
                            "Download invoice",
                          )}
                        >
                          <Download size={14} />
                          {t(
                            "studentManagement.details.viewInvoice",
                            "View invoice",
                          )}
                        </button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground"
                  >
                    {t(
                      "studentManagement.details.noPayments",
                      "No payments found",
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {activeTab === "general" &&
        studentData.program_type === "Manual Therapie" && (
          <ModuleSelectionCard applicationId={studentData.application_id} />
        )}

      {activeTab === "attachments" && (
        <StudentAttachments
          studentId={studentData._id}
          attachments={studentData.attachments || []}
        />
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-full max-w-md flex flex-col p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {t(
                "studentManagement.details.configureExceptionsTitle",
                "Configure Special Exceptions",
              )}
            </h3>

            <p className="text-xs text-gray-500 dark:text-white/60">
              {t(
                "studentManagement.details.configureExceptionsHint",
                "Select all special medical conditions or learning difficulties that apply to this student. The system will automatically apply the maximum extra minutes to their exams.",
              )}
            </p>

            {isExceptionsLoading ? (
              <p className="text-sm">{t("common.loading", "Loading...")}</p>
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
                            setSelectedExceptions(
                              selectedExceptions.filter(
                                (exid) => exid !== ex._id,
                              ),
                            );
                          } else {
                            setSelectedExceptions([
                              ...selectedExceptions,
                              ex._id,
                            ]);
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {ex.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-white/60">
                          +{ex.extra_time_min} {t("common.mins", "mins")}{" "}
                          {t("common.extraTime", "extra time")}
                        </p>
                      </div>
                    </label>
                  );
                })}
                {allExceptions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t(
                      "studentManagement.details.noExceptions",
                      "No exceptions configured. Default exam settings apply.",
                    )}
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
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  updateExceptionsMutation.mutate(
                    {
                      id: studentData._id,
                      specialExceptions: selectedExceptions,
                    },
                    {
                      onSuccess: () => {
                        setIsEditModalOpen(false);
                        refetch();
                      },
                    },
                  );
                }}
                disabled={updateExceptionsMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-[#ff8904] rounded-lg hover:bg-[#e07b03] disabled:opacity-50 cursor-pointer"
              >
                {updateExceptionsMutation.isPending
                  ? t("common.saving", "Saving...")
                  : t("common.saveChanges", "Save Changes")}
              </button>
            </div>
          </div>
        </div>
      )}

      {(() => {
        if (
          isEditModalOpen &&
          selectedExceptions.length === 0 &&
          studentData.special_exceptions?.length > 0
        ) {
          setSelectedExceptions(
            studentData.special_exceptions.map((ex) => ex._id || ex),
          );
        }
      })()}
    </div>
  );
};

export default StudentDetails;
