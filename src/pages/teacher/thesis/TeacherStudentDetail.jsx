import { useEffect, useState, useMemo } from "react";
import { useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import moment from "moment";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lock,
  FileText,
  Download,
  Eye,
  Layers,
  Link2,
  ExternalLink,
  Compass,
  ShieldCheck,
  GraduationCap,
  Award,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Loader2,
  Paperclip,
} from "lucide-react";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { useSecureHtml } from "@/hooks/useSecureHtml";
import { openSecureFile, downloadSecureFile } from "@/utils/secureFile";
import { LoadingState, ErrorMessage } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getTeacherThesisStudentDetail,
  respondTeacherThesisApprovalRequest,
} from "@/api/thesisApi";
import { useAuthStore } from "@/store/useAuthStore";

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
  return role
    ? String(role)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "—";
};

const getStepTypeLabel = (type, t) => {
  switch (type) {
    case "document_upload":
      return t("thesis.stepTypeUpload", "Document Upload");
    case "teacher_approval":
      return t("thesis.stepTypeApproval", "Teacher Approval");
    case "information_only":
      return t("thesis.stepTypeInfo", "Information Only");
    default:
      return type || "—";
  }
};

const getDeadlineModeBadge = (mode, t) => {
  switch (mode) {
    case "required":
      return {
        label: t("thesis.deadlineRequired", "Required"),
        className: "bg-primary/15 text-primary border-primary/25 font-semibold",
      };
    case "optional":
      return {
        label: t("thesis.deadlineOptional", "Optional"),
        className: "bg-muted text-muted-foreground border-border font-medium",
      };
    case "event_date":
    case "event":
      return {
        label: t("thesis.eventDate", "Event Date"),
        className:
          "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 font-medium",
      };
    case "none":
    default:
      return {
        label: t("thesis.noDeadline", "No Deadline"),
        className: "bg-muted text-muted-foreground border-border font-medium",
      };
  }
};

const getStatusBadge = (status, t) => {
  switch (status) {
    case "locked":
      return (
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border"
          title={t(
            "thesis.lockedHint",
            "Waiting for the required earlier step"
          )}
        >
          <Lock className="w-3.5 h-3.5" />
          {t("thesis.locked", "Locked")}
        </span>
      );
    case "overdue":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="w-3.5 h-3.5" />
          {t("thesis.overdue", "Overdue")}
        </span>
      );
    case "submitted":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
          <Clock className="w-3.5 h-3.5" />
          {t("thesis.submitted", "Submitted")}
        </span>
      );
    case "approved":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {t("thesis.completed", "Completed")}
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="w-3.5 h-3.5" />
          {t("thesis.rejected", "Rejected")}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground border border-border">
          {t("thesis.pending", "Pending")}
        </span>
      );
  }
};

const TeacherStudentDetail = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const params = useParams({ strict: false });
  const thesisId = params?.thesisId;
  const trajectoryId = params?.trajectoryId;
  const userId = params?.userId;
  const { updateBreadcrumbs } = useBreadcrumb();

  const currentUser = useAuthStore((state) => state.user);
  const currentProfile = useAuthStore((state) => state.profile);
  const currentTeacherId = currentUser?._id || currentProfile?._id || currentProfile?.user?._id;

  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [approvalModalState, setApprovalModalState] = useState(null); // { requestId, stepName, action }
  const [reviewNote, setReviewNote] = useState("");
  const [expandedStepIds, setExpandedStepIds] = useState(() => new Set());

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["teacher-thesis-student-detail", thesisId, trajectoryId, userId],
    queryFn: () =>
      getTeacherThesisStudentDetail(thesisId, trajectoryId, userId),
    enabled: Boolean(thesisId && trajectoryId && userId),
  });

  const respondMutation = useMutation({
    mutationFn: ({ requestId, status, note: teacherNote }) =>
      respondTeacherThesisApprovalRequest(requestId, {
        status,
        note: teacherNote || "",
      }),
    onSuccess: (_, variables) => {
      toast.success(
        variables.status === "approved"
          ? t("thesis.requestApprovedSuccess", "Approval request accepted")
          : t("thesis.requestRejectedSuccess", "Approval request rejected")
      );
      setApprovalModalState(null);
      setReviewNote("");
      queryClient.invalidateQueries({
        queryKey: ["teacher-thesis-student-detail", thesisId, trajectoryId, userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["teacher-thesis-approval-requests"],
      });
    },
    onError: (err) => {
      toast.error(
        err?.message || t("thesis.requestResponseError", "Failed to respond to request")
      );
    },
  });

  const detail = data?.data;
  const student = detail?.student;
  const thesis = detail?.thesis;
  const trajectory = detail?.trajectory;
  const steps = useMemo(() => detail?.steps || [], [detail?.steps]);
  const progress = detail?.progress;
  const myRoles = detail?.my_roles || [];
  const attempt = detail?.attempt;
  const attemptStatus = attempt?.status || "active";
  const supervisor = detail?.supervisor;

  useEffect(() => {
    const studentName = student
      ? `${student.first_name || ""} ${student.last_name || ""}`.trim() ||
        student.email ||
        "Student"
      : "Student";

    updateBreadcrumbs([
      { label: t("thesisManagement.title", "Thesis"), path: "/teacher/thesis", navigable: true },
      { label: t("thesisManagement.students", "Students"), path: "/teacher/thesis", navigable: true },
      { label: studentName, navigable: false },
    ]);

    return () => updateBreadcrumbs([]);
  }, [student, updateBreadcrumbs, t]);

  const toggleStepExpanded = (stepId) => {
    setExpandedStepIds((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  if (isLoading) {
    return <LoadingState text={t("common.loading", "Loading student thesis details...")} fullHeight />;
  }

  if (error || !detail) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={error?.message || t("thesis.loadFailed", "Failed to load student details")}
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

  const handleOpenApprovalModal = (requestId, stepName, action) => {
    setApprovalModalState({ requestId, stepName, action });
    setReviewNote("");
  };

  const handleConfirmApproval = () => {
    if (!approvalModalState) return;
    respondMutation.mutate({
      requestId: approvalModalState.requestId,
      status: approvalModalState.action,
      note: reviewNote.trim(),
    });
  };

  return (
    <div className="space-y-6 mt-4 pb-12">
      {/* 1. Header & Identity Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
            {studentDisplayName}
          </h1>
          <p className="text-xs text-muted-foreground truncate">
            {[student?.uid ? `UID: ${student.uid}` : null, student?.email].filter(Boolean).join(" · ") || "—"}
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

      {/* 2. Main Workspace: 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Steps & Submissions Review */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <div className="flex items-center justify-between pb-1 gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-foreground">
                    {t("thesisManagement.tabs.steps", "Steps & Submissions")}
                  </h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {steps.length} {steps.length === 1 ? t("thesis.step", "step") : t("thesis.steps", "steps")}
                    {progress?.total ? ` • ${progress.completed || 0}/${progress.total} ${t("thesis.completed", "completed")}` : ""}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t(
                    "thesis.stepsReviewSubtitle",
                    "Review student submissions, approval requests, and step guidelines."
                  )}
                </p>
              </div>
            </div>
          </div>

          {steps.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
              {t("thesis.noSteps", "No steps configured for this thesis trajectory.")}
            </div>
          ) : (
            steps.map((step, idx) => {
              const stepId = step._id || String(idx);
              const isExpanded = expandedStepIds.has(stepId);
              const dm = getDeadlineModeBadge(step.deadline_mode, t);
              const documents = step.documents || [];
              const isTeacherApproval = step.type === "teacher_approval";
              const isPendingApproval = isTeacherApproval && step.approval_request?.status === "pending";
              const approverId = step.approval_request?.teacher?._id || step.approval_request?.teacher;
              const isApproved = step.approval_request?.status === "approved" || step.status === "approved";
              const isApprovedByCurrentTeacher =
                isApproved &&
                (!approverId ||
                  !currentTeacherId ||
                  String(approverId) === String(currentTeacherId) ||
                  myRoles.includes("supervisor"));
              const hasStepDetails = Boolean(
                step.instruction ||
                (Array.isArray(step.resources) && step.resources.length > 0) ||
                (Array.isArray(step.attachments) && step.attachments.length > 0)
              );
              const hasBodyContent =
                step.type === "document_upload" ||
                (isTeacherApproval && !isApprovedByCurrentTeacher) ||
                hasStepDetails;

              return (
                <div
                  key={stepId}
                  className="bg-card border border-border rounded-xl p-5 sm:p-6 shadow-2xs space-y-4 transition-shadow hover:shadow-xs"
                >
                  {/* Step Header */}
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      hasBodyContent ? "border-b border-border/50 pb-3.5" : ""
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h3 className="text-base font-bold text-foreground">
                          {step.name}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pl-8.5">
                        <span className="font-medium px-2 py-0.5 rounded bg-muted">
                          {getStepTypeLabel(step.type, t)}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs border ${dm.className}`}
                        >
                          {dm.label}
                        </span>
                        {step.type === "document_upload" && step.student_uploads_document === false && (
                          <span className="font-medium px-2 py-0.5 rounded text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                            {t("thesis.staffUploadOnly", "Staff upload only")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pl-8.5 sm:pl-0 sm:self-center">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/60 bg-muted/30">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-muted-foreground font-medium">
                            {step.deadline_mode === "event_date" || step.deadline_mode === "event"
                              ? t("thesis.eventDate", "Event Date")
                              : t("thesis.deadline", "Deadline")}:
                          </span>
                          <span className="font-semibold text-foreground">
                            {step.deadline_date
                              ? moment(step.deadline_date).format("DD/MM/YYYY")
                              : "—"}
                          </span>
                        </div>
                      </div>

                      <div>{getStatusBadge(step.status, t)}</div>
                    </div>
                  </div>

                  {step.status === "locked" && (
                    <div className="pl-0 sm:pl-8.5">
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {step.lock_prerequisite_name
                            ? t(
                                "thesis.lockedWaitingNamed",
                                "Waiting for “{{step}}” to be completed.",
                                { step: step.lock_prerequisite_name }
                              )
                            : t(
                                "thesis.lockedWaiting",
                                "Waiting for the required earlier step to be completed."
                              )}
                        </span>
                      </div>
                    </div>
                  )}

                  {hasBodyContent && (
                    <div className="pl-0 sm:pl-8.5 space-y-4">
                    {/* 1. INITIAL / ALWAYS VISIBLE: Student Uploaded Data / Submissions */}
                    {step.type === "document_upload" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                            {t("thesis.uploadedDocuments", "Student Submissions")}
                          </span>
                          {documents.length > 0 && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                              {documents.length} {documents.length === 1 ? t("common.file", "file") : t("common.files", "files")}
                            </span>
                          )}
                        </div>

                        {documents.length === 0 ? (
                          <div className="p-3.5 rounded-lg border border-dashed border-border/80 bg-muted/10 text-xs text-muted-foreground flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                            <span>{t("thesis.noSubmissionsYet", "No documents uploaded yet by the student.")}</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {documents.map((doc, docIdx) => {
                              const isLink = doc.kind === "link";
                              const isLatest = docIdx === 0;
                              const title =
                                doc.name || doc.file_name || (isLink ? "Link" : "File");
                              return (
                                <div
                                  key={doc._id}
                                  className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors gap-2"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {isLink ? (
                                      <Link2 className="w-4 h-4 text-primary shrink-0" />
                                    ) : (
                                      <FileText className="w-4 h-4 text-primary shrink-0" />
                                    )}
                                    <div className="min-w-0">
                                      <p
                                        className="text-xs font-medium text-foreground truncate"
                                        title={title}
                                      >
                                        {title}
                                        {isLatest && (
                                          <span className="ml-1.5 text-[10px] font-semibold text-primary px-1.5 py-0.2 rounded bg-primary/10">
                                            {t("thesis.latest", "Latest")}
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-[11px] text-muted-foreground">
                                        {doc.uploaded_at
                                          ? moment(doc.uploaded_at).format(
                                              "DD/MM/YYYY HH:mm"
                                            )
                                          : "—"}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {isLink ? (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-xs gap-1 cursor-pointer"
                                        onClick={() =>
                                          window.open(doc.url, "_blank", "noopener,noreferrer")
                                        }
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        {t("common.open", "Open")}
                                      </Button>
                                    ) : (
                                      <>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 px-2 text-xs gap-1 cursor-pointer"
                                          onClick={() =>
                                            openSecureFile(
                                              doc.url,
                                              doc.name || doc.file_name
                                            )
                                          }
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                          {t("common.view", "View")}
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 px-2 text-xs gap-1 cursor-pointer"
                                          onClick={() =>
                                            downloadSecureFile(
                                              doc.url,
                                              doc.name || doc.file_name
                                            )
                                          }
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                          {t("common.download", "Download")}
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 1b. INITIAL / ALWAYS VISIBLE: Teacher Approval Request */}
                    {isTeacherApproval && !isApprovedByCurrentTeacher && (
                      <div className="space-y-2">
                        {step.approval_request ? (
                          <div className="p-4 rounded-xl bg-muted/30 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-primary" />
                                {t("thesis.supervisorRequestStatus", "Teacher Approval Request")}:
                              </span>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-foreground">
                                  {step.approval_request?.teacher
                                    ? `${step.approval_request.teacher.first_name} ${step.approval_request.teacher.last_name}`
                                    : supervisor
                                    ? `${supervisor.first_name} ${supervisor.last_name}`
                                    : t("thesisManagement.noSupervisorAssigned", "Not assigned yet")}
                                </span>
                                {step.approval_request?.created_at && (
                                  <span className="text-xs text-muted-foreground">
                                    ({moment(step.approval_request.created_at).format("DD/MM/YYYY")})
                                  </span>
                                )}
                              </div>
                              {step.approval_request?.teacher_note && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  <strong className="text-foreground">{t("thesis.feedbackNote", "Feedback Note")}:</strong>{" "}
                                  {step.approval_request.teacher_note}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {step.approval_request?.status === "pending" && (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                  {t("thesis.pendingApproval", "Pending Review")}
                                </span>
                              )}
                              {step.approval_request?.status === "approved" && (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                  {t("thesis.approved", "Approved")}
                                </span>
                              )}
                              {step.approval_request?.status === "rejected" && (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                                  {t("thesis.rejected", "Rejected")}
                                </span>
                              )}

                              {isPendingApproval && (
                                <div className="flex items-center gap-2 ml-1">
                                  <Button
                                    size="sm"
                                    className="h-8 gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                    onClick={() =>
                                      handleOpenApprovalModal(
                                        step.approval_request._id,
                                        step.name,
                                        "approved"
                                      )
                                    }
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{t("thesis.accept", "Accept")}</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 font-semibold cursor-pointer"
                                    onClick={() =>
                                      handleOpenApprovalModal(
                                        step.approval_request._id,
                                        step.name,
                                        "rejected"
                                      )
                                    }
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>{t("thesis.reject", "Reject")}</span>
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-lg border border-border/70 bg-muted/20 text-xs text-muted-foreground flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                            <span>{t("thesis.noApprovalRequestYet", "No approval request submitted yet for this step.")}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. COLLAPSIBLE ACCORDION: Step Details (Instructions, Documents, Resources) shown when expanded via downward arrow */}
                    {hasStepDetails && (
                      <div className="pt-2 border-t border-border/40">
                        <button
                          type="button"
                          onClick={() => toggleStepExpanded(stepId)}
                          className="flex items-center justify-between w-full py-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-primary" />
                            {t("thesis.stepInstructionsAndResources", "Step Details & Guidelines")}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-medium text-primary">
                            {isExpanded ? t("common.hideDetails", "Hide details") : t("common.showDetails", "Show details")}
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="pt-3 space-y-3.5">
                            {/* Instructions */}
                            {step.instruction && (
                              <div className="p-3.5 rounded-lg bg-muted/15 border border-border/50">
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                                  {t("thesis.instructions", "Instructions & Guidelines")}
                                </span>
                                <RichHtml
                                  html={step.instruction}
                                  className="text-xs sm:text-sm text-foreground/90"
                                />
                              </div>
                            )}

                            {/* Reference Resources & Links */}
                            {Array.isArray(step.resources) && step.resources.length > 0 && (
                              <div className="space-y-1.5">
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                  {t("thesis.resources", "Resources & Links")}
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {step.resources.map((res, rIdx) => (
                                    <a
                                      key={rIdx}
                                      href={res.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs text-primary hover:underline inline-flex items-center gap-1.5 bg-primary/5 hover:bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20 transition-colors"
                                    >
                                      <span>{res.label || res.url}</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Reference Step Documents */}
                            {Array.isArray(step.attachments) && step.attachments.length > 0 && (
                              <div className="space-y-1.5">
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                  {t("thesis.documents", "Documents")}
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {step.attachments.map((att, aIdx) => {
                                    const attName =
                                      att.name || att.filename || att.file_name || "Document";
                                    const attUrl = att.file_url || att.url;
                                    return (
                                      <div
                                        key={attUrl || aIdx}
                                        className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors gap-2"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <FileText className="w-4 h-4 text-primary shrink-0" />
                                          <span
                                            className="text-xs font-medium text-foreground truncate"
                                            title={attName}
                                          >
                                            {attName}
                                          </span>
                                        </div>
                                        {attUrl && (
                                          <div className="flex items-center gap-1 shrink-0">
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 px-2 text-xs gap-1 cursor-pointer"
                                              onClick={() => openSecureFile(attUrl, attName)}
                                            >
                                              <Eye className="w-3.5 h-3.5" />
                                              {t("common.view", "View")}
                                            </Button>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 px-2 text-xs gap-1 cursor-pointer"
                                              onClick={() =>
                                                downloadSecureFile(attUrl, attName)
                                              }
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                              {t("common.download", "Download")}
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
                        )}
                      </div>
                    )}
                  </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right Column (4 cols): Context Sidebar */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Card 1: Thesis Overview & Resources */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <GraduationCap className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                {t("thesisManagement.detail.title", "Thesis Overview")}
              </h2>
            </div>

            <div className="space-y-2">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {thesis?.name || "—"}
                </h3>
                {thesis?.uid && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-muted text-muted-foreground border border-border">
                    {thesis.uid}
                  </span>
                )}
              </div>

              {/* Trajectory Details */}
              {(trajectory?.name || trajectory?.start_date) && (
                <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground pb-1 border-b border-border/40">
                    <Compass className="w-3.5 h-3.5 text-primary" />
                    <span>{t("thesisManagement.trajectories.trajectory", "Cohort Trajectory")}</span>
                  </div>
                  {trajectory?.name && (
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-muted-foreground font-medium">
                        {t("thesisManagement.trajectories.trajectoryName", "Trajectory")}:
                      </span>
                      <span className="font-semibold text-foreground text-right truncate">
                        {trajectory.name}
                      </span>
                    </div>
                  )}
                  {trajectory?.start_date && (
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-muted-foreground font-medium">
                        {t("thesisManagement.trajectories.startsOn", "Start Date")}:
                      </span>
                      <span className="font-semibold text-foreground">
                        {moment(trajectory.start_date).format("DD/MM/YYYY")}
                      </span>
                    </div>
                  )}
                  {trajectory?.end_date && (
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-muted-foreground font-medium">
                        {t("thesis.finalDeadline", "Deadline")}:
                      </span>
                      <span className="font-semibold text-foreground">
                        {moment(trajectory.end_date).format("DD/MM/YYYY")}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Metadata chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
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

            {/* Description Preview */}
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
                    className="h-6 px-1.5 text-xs text-primary font-semibold hover:bg-transparent"
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                  >
                    {isDescExpanded ? (
                      <span className="flex items-center gap-1">
                        {t("common.showLess", "Show less")} <ChevronUp className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        {t("common.showMore", "Show more")} <ChevronDown className="w-3 h-3" />
                      </span>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Catalog Reference Documents */}
            {Array.isArray(thesis?.attachments) && thesis.attachments.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-primary" />
                    {t("thesis.documents", "Catalog Documents")}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                    {thesis.attachments.length} {thesis.attachments.length === 1 ? t("common.file", "file") : t("common.files", "files")}
                  </span>
                </div>

                <div className="space-y-2">
                  {thesis.attachments.map((file, idx) => {
                    const fileName =
                      file.name || file.filename || file.file_name || "Document";
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
                              onClick={() => openSecureFile(fileUrl, fileName)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                              title={t("common.download", "Download")}
                              onClick={() => downloadSecureFile(fileUrl, fileName)}
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
        </div>
      </div>

      {/* 4. Teacher Approval / Rejection Modal */}
      <Dialog
        open={Boolean(approvalModalState)}
        onOpenChange={(open) => !open && setApprovalModalState(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {approvalModalState?.action === "approved"
                ? t("thesis.acceptRequestTitle", "Accept Approval Request")
                : t("thesis.rejectRequestTitle", "Reject Approval Request")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {approvalModalState?.action === "approved"
                ? t(
                    "thesis.acceptRequestDesc",
                    "Are you sure you want to approve this milestone request for \"{{step}}\"?",
                    { step: approvalModalState?.stepName }
                  )
                : t(
                    "thesis.rejectRequestDesc",
                    "Are you sure you want to reject this milestone request for \"{{step}}\"? The student will be notified.",
                    { step: approvalModalState?.stepName }
                  )}
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="review-note" className="text-xs font-semibold">
                {t("thesis.feedbackNote", "Feedback Note (Optional)")}
              </Label>
              <Textarea
                id="review-note"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder={t(
                  "thesis.feedbackNotePlaceholder",
                  "Provide comments, guidance, or next steps for the student..."
                )}
                rows={3}
                className="text-xs sm:text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setApprovalModalState(null)}
              disabled={respondMutation.isPending}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={respondMutation.isPending}
              className={
                approvalModalState?.action === "approved"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                  : "bg-destructive hover:bg-destructive/90 text-white font-semibold cursor-pointer"
              }
              onClick={handleConfirmApproval}
            >
              {respondMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : null}
              {approvalModalState?.action === "approved"
                ? t("thesis.accept", "Accept Request")
                : t("thesis.reject", "Reject Request")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherStudentDetail;
