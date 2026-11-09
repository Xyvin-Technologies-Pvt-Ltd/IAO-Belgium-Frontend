import { useEffect, useState, useMemo } from "react";
import { useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import moment from "moment";
import {
  FileText,
  Download,
  Eye,
  Compass,
  ShieldCheck,
  GraduationCap,
  Award,
  ChevronDown,
  ChevronUp,
  Paperclip,
  UserCheck,
  Users,
} from "lucide-react";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { useSecureHtml } from "@/hooks/useSecureHtml";
import { openSecureFile, downloadSecureFile } from "@/utils/secureFile";
import { LoadingState, ErrorMessage } from "@/components/common";
import { Button } from "@/components/ui/button";
import { getTeacherThesisStudentDetail } from "@/api/thesisApi";
import { useThesisTeacherKind } from "@/hooks/useThesisTeacherKind";
import TeacherMarkingPanel from "@/components/teacher/thesis/TeacherMarkingPanel";
import TeacherStudentDocumentsCard from "@/components/teacher/thesis/TeacherStudentDocumentsCard";

const RichHtml = ({ html, className = "" }) => {
  const secureHtml = useSecureHtml(html);
  if (!html || !html.trim() || html === "<p></p>" || html === "<p><br></p>") {
    return null;
  }

  return (
    <div
      className={`rich-html-content prose dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: secureHtml }}
    />
  );
};

const formatRoleLabel = (role) => {
  if (role === "supervisor") return "Supervisor";
  if (role === "reader") return "Reader";
  if (role === "additional_reader") return "Additional Reader";
  return role
    ? String(role)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "—";
};

const TeacherStudentDetail = () => {
  const { t } = useTranslation();
  const params = useParams({ strict: false });
  const thesisId = params?.thesisId;
  const trajectoryId = params?.trajectoryId;
  const userId = params?.userId;
  const { updateBreadcrumbs } = useBreadcrumb();
  const { type, basePath, label: kindLabel, isMaster } = useThesisTeacherKind();

  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      "teacher-thesis-student-detail",
      type,
      thesisId,
      trajectoryId,
      userId,
    ],
    queryFn: () =>
      getTeacherThesisStudentDetail(thesisId, trajectoryId, userId, { type }),
    enabled: Boolean(thesisId && trajectoryId && userId),
  });

  const detail = data?.data;
  const student = detail?.student;
  const thesis = detail?.thesis;
  const trajectory = detail?.trajectory;
  const steps = useMemo(() => detail?.steps || [], [detail?.steps]);
  const myRoles = detail?.my_roles || [];
  const attempt = detail?.attempt;
  const attemptStatus = attempt?.status || "active";
  const supervisor = detail?.supervisor;
  const reader = detail?.reader;
  const additionalReader = detail?.additional_reader;

  const staffName = (person) => {
    if (!person) return null;
    const name = `${person.first_name || ""} ${person.last_name || ""}`.trim();
    return name || person.email || null;
  };

  useEffect(() => {
    const studentName = student
      ? `${student.first_name || ""} ${student.last_name || ""}`.trim() ||
        student.email ||
        "Student"
      : "Student";

    updateBreadcrumbs([
      { label: kindLabel, path: basePath, navigable: true },
      {
        label: t("thesisManagement.students", "Students"),
        path: basePath,
        navigable: true,
      },
      { label: studentName, navigable: false },
    ]);

    return () => updateBreadcrumbs([]);
  }, [student, updateBreadcrumbs, t, kindLabel, basePath]);

  if (isLoading) {
    return (
      <LoadingState
        text={t("common.loading", "Loading student thesis details...")}
        fullHeight
      />
    );
  }

  if (error || !detail) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={
            error?.message ||
            t("thesis.loadFailed", "Failed to load student details")
          }
          onRetry={refetch}
          variant="card"
        />
      </div>
    );
  }

  const studentDisplayName =
    `${student?.first_name || ""} ${student?.last_name || ""}`.trim() ||
    student?.email ||
    "—";

  return (
    <div className="space-y-6 mt-4 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
            {studentDisplayName}
          </h1>
          <p className="text-xs text-muted-foreground truncate">
            {[student?.uid ? `UID: ${student.uid}` : null, student?.email]
              .filter(Boolean)
              .join(" · ") || "—"}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {attempt && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize border ${
                attemptStatus === "passed"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                  : attemptStatus === "failed"
                    ? "bg-destructive/10 text-destructive border-destructive/20"
                    : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
              }`}
            >
              {t("thesisManagement.attempt.attemptNum", "Attempt #{{num}}", {
                num: attempt.attempt_number || 1,
              })}{" "}
              • {attemptStatus}
            </span>
          )}
          {myRoles.map((role) => (
            <span
              key={role}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
            >
              {formatRoleLabel(role)}
            </span>
          ))}
        </div>
      </div>

      {/* Thesis Overview Card (Top) */}
      <div className="bg-card border border-border rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
              {t("thesis.thesisOverview", "Thesis Overview")}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {Array.isArray(thesis?.academic) &&
              thesis.academic.map((a) => (
                <span
                  key={a._id || a.name || a}
                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted border border-border text-muted-foreground"
                >
                  {a.name || a}
                </span>
              ))}
            {!Array.isArray(thesis?.academic) && thesis?.academic?.name && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
                {thesis.academic.name}
              </span>
            )}
            {thesis?.current_year != null && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                <Award className="w-3 h-3" />
                {Array.isArray(thesis.current_year)
                  ? `Year ${thesis.current_year.join(", ")}`
                  : `Year ${thesis.current_year}`}
              </span>
            )}
            {Array.isArray(thesis?.program) &&
              thesis.program.map((p) => (
                <span
                  key={p._id || p.name || p}
                  className="text-xs font-medium text-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/50"
                >
                  {p.name || p}
                </span>
              ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              {t("thesis.thesis", "Thesis")}
            </span>
            <p className="text-sm font-semibold text-foreground">
              {thesis?.name || "—"}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              {t(
                "thesisManagement.trajectories.trajectory",
                "Cohort Trajectory"
              )}
            </span>
            <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              {trajectory?.name || "—"}
            </p>
          </div>

          {(trajectory?.start_date || trajectory?.end_date) && (
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                {t("thesis.timeline", "Timeline")}
              </span>
              <div className="flex flex-wrap items-center gap-3 text-xs pt-0.5">
                {trajectory?.start_date && (
                  <span className="text-muted-foreground">
                    {t("thesis.startDate", "Start")}:{" "}
                    <strong className="text-foreground font-semibold">
                      {moment(trajectory.start_date).format("DD/MM/YYYY")}
                    </strong>
                  </span>
                )}
                {trajectory?.end_date && (
                  <span className="text-muted-foreground">
                    {t("thesis.finalDeadline", "Deadline")}:{" "}
                    <strong className="text-foreground font-semibold">
                      {moment(trajectory.end_date).format("DD/MM/YYYY")}
                    </strong>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {thesis?.description && (
          <div className="space-y-1.5 pt-2 border-t border-border/50">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              {t("thesisManagement.detail.description", "Description")}
            </span>
            <div className={!isDescExpanded ? "line-clamp-3" : ""}>
              <RichHtml
                html={thesis.description}
                className="text-xs text-foreground/90 leading-relaxed"
              />
            </div>
            {thesis.description.length > 180 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-xs text-primary font-semibold hover:bg-transparent cursor-pointer"
                onClick={() => setIsDescExpanded(!isDescExpanded)}
              >
                {isDescExpanded ? (
                  <span className="flex items-center gap-1">
                    {t("common.showLess", "Show less")}{" "}
                    <ChevronUp className="w-3 h-3" />
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    {t("common.showMore", "Show more")}{" "}
                    <ChevronDown className="w-3 h-3" />
                  </span>
                )}
              </Button>
            )}
          </div>
        )}

        {Array.isArray(thesis?.attachments) &&
          thesis.attachments.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-primary" />
                  {t("thesis.documents", "Catalog Documents")}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                  {thesis.attachments.length}{" "}
                  {thesis.attachments.length === 1
                    ? t("common.file", "file")
                    : t("common.files", "files")}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {thesis.attachments.map((file, idx) => {
                  const fileName =
                    file.name ||
                    file.filename ||
                    file.file_name ||
                    "Document";
                  const fileUrl = file.file_url || file.url;
                  return (
                    <div
                      key={fileUrl || idx}
                      className="flex items-center justify-between p-2 rounded-lg border border-border bg-card/60 hover:bg-muted/40 transition-colors gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                        <p
                          className="text-xs font-medium text-foreground truncate"
                          title={fileName}
                        >
                          {fileName}
                        </p>
                      </div>
                      {fileUrl && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                            title={t("common.view", "View")}
                            onClick={() =>
                              openSecureFile(fileUrl, fileName)
                            }
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                            title={t("common.download", "Download")}
                            onClick={() =>
                              downloadSecureFile(fileUrl, fileName)
                            }
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
      </div>

      {/* Assigned Staff (if isMaster) */}
      {isMaster &&
        (myRoles.includes("supervisor") ||
          myRoles.includes("reader") ||
          myRoles.includes("additional_reader")) && (
          <div className="bg-card border border-border rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Users className="w-4 h-4 text-primary" />
              <div>
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                  {t(
                    "thesisManagement.assignedStaff",
                    "Assigned Staff"
                  )}
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {t(
                    "thesisManagement.assignedByBackoffice",
                    "Assigned by the backoffice"
                  )}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {myRoles.includes("supervisor") && (
                <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    {t(
                      "thesisManagement.assignedSupervisor",
                      "Assigned Supervisor"
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {staffName(supervisor) ||
                      t(
                        "thesisManagement.noSupervisorAssigned",
                        "Not assigned yet"
                      )}
                  </p>
                </div>
              )}
              {myRoles.includes("reader") && (
                <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <UserCheck className="w-3.5 h-3.5 text-primary" />
                    {t(
                      "thesisManagement.assignedReader",
                      "Assigned Reader"
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {staffName(reader) ||
                      t(
                        "thesisManagement.noReaderAssigned",
                        "— No Reader Assigned —"
                      )}
                  </p>
                </div>
              )}
              {myRoles.includes("additional_reader") && (
                <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <UserCheck className="w-3.5 h-3.5 text-primary" />
                    {t(
                      "thesisManagement.assignedAdditionalReader",
                      "Additional Reader"
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {staffName(additionalReader) ||
                      t(
                        "thesisManagement.noAdditionalReaderAssigned",
                        "— No Additional Reader —"
                      )}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Steps & Submissions */}
      <TeacherStudentDocumentsCard steps={steps} />

      {/* Marking Panel */}
      <TeacherMarkingPanel
        thesisId={thesisId}
        trajectoryId={trajectoryId}
        userId={userId}
      />
    </div>
  );
};

export default TeacherStudentDetail;
