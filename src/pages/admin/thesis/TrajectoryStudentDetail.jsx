import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import moment from "moment";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/table/Pagination";
import {
  Compass,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lock,
  FileText,
  Upload,
  Download,
  Eye,
  Pencil,
  Trash2,
  UserCheck,
  History,
  Loader2,
  User,
  ShieldCheck,
  Layers,
  GraduationCap,
  Search,
  ChevronDown,
  Link2,
  ExternalLink,
} from "lucide-react";

import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { useCanModify } from "@/hooks/useCanModify";
import { useSecureHtml } from "@/hooks/useSecureHtml";
import { openSecureFile, downloadSecureFile } from "@/utils/secureFile";
import { uploadFile } from "@/api/uploadApi";
import { LoadingState, ErrorMessage } from "@/components/common";
import DocumentUploadArea from "@/components/common/DocumentUploadArea";
import DashboardCard from "@/components/admin/dashboard/DashboardCard";
import StudentPersonalNotesCard from "@/components/admin/thesis/StudentPersonalNotesCard";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useGetTrajectoryStudentDetail,
  useUpdateTrajectoryStudentReader,
  useUpdateTrajectoryStudentSupervisor,
  useUpdateTrajectoryStudentAttemptStatus,
  useReenrollTrajectoryStudent,
  useUpdateTrajectoryStudentStepDeadline,
  useUploadStaffThesisDocument,
  useRenameStaffThesisDocument,
  useDeleteStaffThesisDocument,
  useGetThesisTrajectories,
} from "@/store/useThesisStore";

const RichHtml = ({ html, className = "" }) => {
  const secureHtml = useSecureHtml(html);
  if (!html || !html.trim() || html === "<p></p>" || html === "<p><br></p>") return null;

  return (
    <>
      <style>{`
        .rich-html-content p {
          margin: 0.375rem 0;
          line-height: 1.6;
        }
        .rich-html-content p:first-child {
          margin-top: 0;
        }
        .rich-html-content p:last-child {
          margin-bottom: 0;
        }
        .rich-html-content ul {
          margin: 0.5rem 0;
          padding-left: 1.5rem !important;
          list-style-type: disc !important;
        }
        .rich-html-content ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem !important;
          list-style-type: decimal !important;
        }
        .rich-html-content li {
          margin: 0.25rem 0;
          line-height: 1.6;
          display: list-item !important;
        }
        .rich-html-content a {
          color: #ff8904;
          text-decoration: underline;
        }
        .rich-html-content strong, .rich-html-content b {
          font-weight: 600;
        }
        .rich-html-content img {
          max-width: 100%;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
        }
      `}</style>
      <div
        className={`rich-html-content ${className}`}
        dangerouslySetInnerHTML={{ __html: secureHtml }}
      />
    </>
  );
};

const formatActionLabel = (action) => {
  if (!action) return "Activity";
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getActionMeta = (action) => {
  if (action?.includes("document_deleted") || action?.includes("link_deleted")) {
    return {
      icon: Trash2,
      colorClass: "bg-red-500/10 text-red-600 border-red-500/20",
      badgeClass: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
    };
  }
  if (action?.includes("link")) {
    return {
      icon: Link2,
      colorClass: "bg-sky-500/10 text-sky-600 border-sky-500/20",
      badgeClass: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
    };
  }
  if (action?.includes("document")) {
    return {
      icon: FileText,
      colorClass: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    };
  }
  if (action?.includes("supervisor")) {
    return {
      icon: ShieldCheck,
      colorClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    };
  }
  if (action?.includes("reader")) {
    return {
      icon: GraduationCap,
      colorClass: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      badgeClass: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
    };
  }
  return {
    icon: History,
    colorClass: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    badgeClass: "bg-muted text-foreground border-border",
  };
};

export default function TrajectoryStudentDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const canModify = useCanModify("operations");
  const params = useParams({ strict: false });

  const thesisId = params.id;
  const trajectoryId = params.trajectoryId;
  const userId = params.userId;

  const { updateBreadcrumbs } = useBreadcrumb();

  // Staff document dialog states
  const [uploadDraft, setUploadDraft] = useState(null); // { stepId, name, file }
  const [linkDraft, setLinkDraft] = useState(null); // { stepId, name, url }
  const [renameDraft, setRenameDraft] = useState(null); // { stepId, documentId, name, kind }
  const [deleteDraft, setDeleteDraft] = useState(null); // { stepId, documentId, name, kind }
  const [isUploading, setIsUploading] = useState(false);

  // Supervisor editor modal state
  const [supervisorModalOpen, setSupervisorModalOpen] = useState(false);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");
  const [selectedSupervisorStatus, setSelectedSupervisorStatus] = useState("approved");

  // Attempt status decision modal
  const [statusDraft, setStatusDraft] = useState(null); // { status: 'passed'|'failed', reason: '' }
  const [deadlineDraft, setDeadlineDraft] = useState(null); // { stepId, date: 'YYYY-MM-DD' }
  const [reenrollOpen, setReenrollOpen] = useState(false);
  const [reenrollTrajectoryId, setReenrollTrajectoryId] = useState("");

  // Queries & Mutations
  const {
    data: detailResponse,
    isLoading,
    error,
    refetch,
  } = useGetTrajectoryStudentDetail(thesisId, trajectoryId, userId);
  const { data: trajectoriesResponse } = useGetThesisTrajectories(thesisId, {
    enabled: Boolean(thesisId) && reenrollOpen,
  });

  const updateReaderMutation = useUpdateTrajectoryStudentReader();
  const updateSupervisorMutation = useUpdateTrajectoryStudentSupervisor();
  const updateAttemptStatusMutation = useUpdateTrajectoryStudentAttemptStatus();
  const reenrollMutation = useReenrollTrajectoryStudent();
  const updateStepDeadlineMutation = useUpdateTrajectoryStudentStepDeadline();
  const uploadDocMutation = useUploadStaffThesisDocument();
  const renameDocMutation = useRenameStaffThesisDocument();
  const deleteDocMutation = useDeleteStaffThesisDocument();

  const detail = detailResponse?.data;
  const student = detail?.student;
  const thesis = detail?.thesis;
  const trajectory = detail?.trajectory;
  const reader = detail?.reader;
  const supervisor = detail?.supervisor;
  const supervisorRequest = detail?.supervisor_request;
  const eligibleReaders = detail?.eligible_readers || [];
  const eligibleSupervisors = detail?.supervisors || [];
  const steps = useMemo(() => detail?.steps || [], [detail?.steps]);
  const progress = detail?.progress || { total: 0, completed: 0, percentage: 0 };
  const allLogs = useMemo(() => detail?.logs || [], [detail?.logs]);
  const personalNotes = useMemo(
    () => detail?.personal_notes || detail?.notes || [],
    [detail?.personal_notes, detail?.notes]
  );
  const attempt = detail?.attempt;
  const attemptStatus = attempt?.status || "active";
  const failReasons = detail?.fail_reasons || [];
  const suggestPass = detail?.suggest_pass;
  const suggestFail = detail?.suggest_fail;
  const reenrollTargets = useMemo(() => {
    const list = trajectoriesResponse?.data || trajectoriesResponse || [];
    const rows = Array.isArray(list) ? list : list?.trajectories || [];
    return rows.filter(
      (traj) =>
        traj &&
        !traj.removed &&
        String(traj._id) !== String(trajectoryId)
    );
  }, [trajectoriesResponse, trajectoryId]);

  // Activity log timeline state
  const [logSearch, setLogSearch] = useState("");
  const [logPage, setLogPage] = useState(1);
  const [logRowsPerPage, setLogRowsPerPage] = useState(10);

  const filteredLogs = useMemo(() => {
    if (!logSearch.trim()) return allLogs;
    const q = logSearch.toLowerCase().trim();
    return allLogs.filter((log) => {
      const actionMatch = log.action?.toLowerCase().includes(q);
      const detailMatch = log.detail?.toLowerCase().includes(q);
      const actorName = log.actor
        ? `${log.actor.first_name || ""} ${log.actor.last_name || ""} ${log.actor.email || ""}`.toLowerCase()
        : "system";
      const actorMatch = actorName.includes(q);
      const stepObj = steps.find((s) => String(s._id) === String(log.step));
      const stepMatch = stepObj?.name?.toLowerCase().includes(q);

      return actionMatch || detailMatch || actorMatch || stepMatch;
    });
  }, [allLogs, logSearch, steps]);

  const paginatedLogs = useMemo(() => {
    const start = (logPage - 1) * logRowsPerPage;
    return filteredLogs.slice(start, start + logRowsPerPage);
  }, [filteredLogs, logPage, logRowsPerPage]);

  const studentName = student
    ? `${student.first_name || ""} ${student.last_name || ""}`.trim() || student.email
    : "Student";

  // Breadcrumbs (no back button needed)
  useEffect(() => {
    updateBreadcrumbs([
      {
        label: t("thesisManagement.title", "Theses"),
        path: "/admin/thesis",
        navigable: true,
      },
      {
        label: thesis?.name || t("thesisManagement.title", "Thesis"),
        path: `/admin/thesis/${thesisId}`,
        navigable: true,
      },
      {
        label: trajectory?.name || t("thesisManagement.trajectories.trajectory", "Cohort Trajectory"),
        path: `/admin/thesis/${thesisId}/trajectories/${trajectoryId}`,
        navigable: true,
      },
      {
        label: studentName,
        path: `/admin/thesis/${thesisId}/trajectories/${trajectoryId}/students/${userId}`,
        navigable: false,
      },
    ]);
  }, [thesis?.name, trajectory?.name, studentName, thesisId, trajectoryId, userId, updateBreadcrumbs, t]);

  const handleReaderChange = async (selectedReaderId) => {
    const readerValue = selectedReaderId === "NONE" ? null : selectedReaderId;
    try {
      await updateReaderMutation.mutateAsync({
        thesisId,
        trajectoryId,
        userId,
        reader: readerValue,
      });
    } catch {
      // Error handled by store hook
    }
  };

  const handleSupervisorSubmit = async () => {
    const supervisorValue = selectedSupervisorId === "NONE" ? null : selectedSupervisorId;
    try {
      await updateSupervisorMutation.mutateAsync({
        thesisId,
        trajectoryId,
        userId,
        supervisor: supervisorValue,
        status: selectedSupervisorStatus,
      });
      setSupervisorModalOpen(false);
    } catch {
      // Error handled by store hook
    }
  };

  const openSupervisorEdit = () => {
    setSelectedSupervisorId(supervisor?._id || "NONE");
    setSelectedSupervisorStatus(supervisorRequest?.status || "approved");
    setSupervisorModalOpen(true);
  };

  const handleModalFileUpload = (fileType, e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadDraft((prev) => ({
        ...prev,
        file,
        name: prev?.name?.trim() ? prev.name : file.name.replace(/\.[^/.]+$/, ""),
      }));
    }
  };

  const handleModalRemoveFile = () => {
    setUploadDraft((prev) => (prev ? { ...prev, file: null } : prev));
  };

  const handleModalDragOver = (e) => {
    e.preventDefault();
  };

  const handleModalDrop = (fileType, e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setUploadDraft((prev) => ({
        ...prev,
        file,
        name: prev?.name?.trim() ? prev.name : file.name.replace(/\.[^/.]+$/, ""),
      }));
    }
  };

  const handleStaffUploadSubmit = async () => {
    if (!uploadDraft?.file) {
      toast.error(t("thesis.selectFile", "Please choose a file to upload"));
      return;
    }
    const docName = (uploadDraft.name || uploadDraft.file.name).trim();
    if (!docName) {
      toast.error(t("thesis.enterDocName", "Please enter a document name"));
      return;
    }

    try {
      setIsUploading(true);
      const res = await uploadFile(uploadDraft.file);
      const fileUrl = res?.data?.url || res?.url || res?.data?.file_url || res?.file_url;
      if (!fileUrl) {
        throw new Error("File URL not returned from server");
      }

      await uploadDocMutation.mutateAsync({
        thesisId,
        trajectoryId,
        userId,
        stepId: uploadDraft.stepId,
        data: {
          url: fileUrl,
          name: docName,
          file_name: uploadDraft.file.name,
        },
      });

      setUploadDraft(null);
    } catch (err) {
      toast.error(err?.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleStaffAddLinkSubmit = async () => {
    const name = linkDraft?.name?.trim();
    const url = linkDraft?.url?.trim();
    if (!name) {
      toast.error(t("thesis.enterLinkTitle", "Please enter a link title"));
      return;
    }
    if (!url) {
      toast.error(t("thesis.enterLinkUrl", "Please enter a link URL"));
      return;
    }

    try {
      await uploadDocMutation.mutateAsync({
        thesisId,
        trajectoryId,
        userId,
        stepId: linkDraft.stepId,
        data: {
          kind: "link",
          name,
          url,
        },
      });
      setLinkDraft(null);
    } catch {
      // Error handled by store hook
    }
  };

  const handleStaffRenameSubmit = async () => {
    if (!renameDraft?.name?.trim()) {
      toast.error(
        renameDraft?.kind === "link"
          ? t("thesis.enterLinkTitle", "Please enter a link title")
          : t("thesis.enterDocName", "Please enter a document name")
      );
      return;
    }

    try {
      await renameDocMutation.mutateAsync({
        thesisId,
        trajectoryId,
        userId,
        stepId: renameDraft.stepId,
        documentId: renameDraft.documentId,
        name: renameDraft.name.trim(),
      });
      setRenameDraft(null);
    } catch {
      // Error handled by store hook
    }
  };

  const handleStaffDeleteSubmit = async () => {
    if (!deleteDraft) return;
    try {
      await deleteDocMutation.mutateAsync({
        thesisId,
        trajectoryId,
        userId,
        stepId: deleteDraft.stepId,
        documentId: deleteDraft.documentId,
      });
      setDeleteDraft(null);
    } catch {
      // Error handled by store hook
    }
  };

  const handleAttemptStatusSubmit = async () => {
    if (!statusDraft?.status) return;
    try {
      await updateAttemptStatusMutation.mutateAsync({
        thesisId,
        trajectoryId,
        userId,
        status: statusDraft.status,
        reason: statusDraft.reason || "",
      });
      setStatusDraft(null);
    } catch {
      // Error handled by store hook
    }
  };

  const handleReenrollSubmit = async () => {
    if (!reenrollTrajectoryId) {
      toast.error(
        t(
          "thesisManagement.attempt.selectTrajectory",
          "Select a target trajectory"
        )
      );
      return;
    }
    try {
      const response = await reenrollMutation.mutateAsync({
        thesisId,
        trajectoryId,
        userId,
        targetTrajectoryId: reenrollTrajectoryId,
      });
      setReenrollOpen(false);
      setReenrollTrajectoryId("");
      const nextTrajId = response?.data?.trajectory?._id;
      if (nextTrajId) {
        navigate({
          to: "/admin/thesis/$id/trajectories/$trajectoryId/students/$userId",
          params: {
            id: thesisId,
            trajectoryId: String(nextTrajId),
            userId,
          },
        });
      } else {
        refetch();
      }
    } catch {
      // Error handled by store hook
    }
  };

  const handleDeadlineSubmit = async () => {
    if (!deadlineDraft?.stepId) return;
    try {
      await updateStepDeadlineMutation.mutateAsync({
        thesisId,
        trajectoryId,
        userId,
        stepId: deadlineDraft.stepId,
        deadline_date: deadlineDraft.date
          ? moment(deadlineDraft.date, "YYYY-MM-DD").toISOString()
          : null,
      });
      setDeadlineDraft(null);
    } catch {
      // Error handled by store hook
    }
  };

  const handleDeadlineClear = async (stepId) => {
    try {
      await updateStepDeadlineMutation.mutateAsync({
        thesisId,
        trajectoryId,
        userId,
        stepId,
        deadline_date: null,
      });
    } catch {
      // Error handled by store hook
    }
  };

  const getStepTypeLabel = (type) => {
    switch (type) {
      case "document_upload":
        return t("thesis.types.documentUpload", "Document Upload");
      case "teacher_approval":
        return t("thesis.types.teacherApproval", "Teacher Approval");
      case "information_only":
        return t("thesis.types.informationOnly", "Information Only");
      default:
        return type;
    }
  };

  const getDeadlineModeBadge = (mode) => {
    switch (mode) {
      case "required":
        return {
          label: t("thesisManagement.steps.deadline.required", "Deadline Required"),
          className: "bg-primary/15 text-primary border-primary/25 font-semibold",
        };
      case "optional":
        return {
          label: t("thesisManagement.steps.deadline.optional", "Deadline Optional"),
          className: "bg-muted text-muted-foreground border-border font-medium",
        };
      case "event_date":
      case "event":
        return {
          label: t("thesisManagement.steps.deadline.event", "Event Date"),
          className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 font-medium",
        };
      case "none":
      default:
        return {
          label: t("thesisManagement.steps.deadline.none", "No Deadline"),
          className: "bg-muted text-muted-foreground border-border font-medium",
        };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "locked":
        return (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border"
            title={t(
              "thesis.status.lockedHint",
              "Waiting for the required earlier step"
            )}
          >
            <Lock className="w-3.5 h-3.5" />
            {t("thesis.status.locked", "Locked")}
          </span>
        );
      case "overdue":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
            <AlertCircle className="w-3.5 h-3.5" />
            {t("thesis.status.overdue", "Overdue")}
          </span>
        );
      case "submitted":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Clock className="w-3.5 h-3.5" />
            {t("thesis.status.submitted", "Submitted")}
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t("thesis.status.approved", "Approved")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground border border-border">
            {t("thesis.status.notStarted", "Not Started")}
          </span>
        );
    }
  };

  const renderAttemptDecisionButton = (size = "default", variant = "default") => {
    if (!canModify || !attempt) return null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className="gap-2 font-semibold shadow-xs"
          >
            <GraduationCap className="w-4 h-4" />
            <span>{t("thesisManagement.attempt.decision", "Attempt Decision")}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            className="gap-2 cursor-pointer text-emerald-600 focus:text-emerald-700 focus:bg-emerald-500/10 font-medium"
            onClick={() => setStatusDraft({ status: "passed", reason: "" })}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{t("thesisManagement.attempt.markPassed", "Mark as Passed")}</span>
            {attemptStatus === "passed" && (
              <span className="ml-auto text-[10px] text-muted-foreground uppercase font-bold">
                {t("common.current", "Current")}
              </span>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 font-medium"
            onClick={() => setStatusDraft({ status: "failed", reason: "" })}
          >
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <span>{t("thesisManagement.attempt.markFailed", "Mark as Failed")}</span>
            {attemptStatus === "failed" && (
              <span className="ml-auto text-[10px] text-muted-foreground uppercase font-bold">
                {t("common.current", "Current")}
              </span>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState text={t("common.loading", "Loading student thesis details...")} />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <ErrorMessage
          message={error?.message || t("common.failedToLoad", "Failed to load student details")}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Bar with Student Identity, Status and Decision Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {studentName}
            </h1>
            <StatusBadge status={attemptStatus} />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            UID: {student?.uid || "—"} • {student?.email || ""} • {trajectory?.name || "Cohort"} • {t("thesisManagement.attempt.number", "Attempt")} #{attempt?.attempt_number ?? 1}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canModify && attemptStatus !== "passed" && (
            <Button
              variant="outline"
              size="default"
              className="gap-2 font-semibold shadow-xs"
              onClick={() => {
                setReenrollTrajectoryId("");
                setReenrollOpen(true);
              }}
            >
              <Compass className="w-4 h-4" />
              {t(
                "thesisManagement.attempt.reenrollTrajectory",
                "Re-enrol trajectory"
              )}
            </Button>
          )}
          {renderAttemptDecisionButton("default", "default")}
        </div>
      </div>

      {/* 4 Dashboard Cards matching ProgramDetail layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title={t("thesisManagement.table.studentName", "Student")}
          value={studentName}
          subtitle={`UID: ${student?.uid || "—"} • ${student?.email || ""}`}
          icon={User}
        />

        <DashboardCard
          title={t("thesisManagement.trajectories.trajectory", "Cohort Trajectory")}
          value={trajectory?.name || "Cohort"}
          subtitle={thesis?.name || t("thesisManagement.title", "Thesis")}
          icon={Compass}
        />

        <DashboardCard
          title={t("thesisManagement.trajectories.finalDeadline", "Final Deadline")}
          value={
            trajectory?.end_date
              ? moment(trajectory.end_date).format("DD/MM/YYYY")
              : "—"
          }
          subtitle={
            trajectory?.start_date
              ? `${t("thesisManagement.trajectories.startsOn", "Starts")}: ${moment(trajectory.start_date).format("DD/MM/YYYY")}`
              : "Ongoing cohort"
          }
          icon={Clock}
        />

        <DashboardCard
          title={t("thesis.progress", "Required Steps Progress")}
          value={`${progress.completed} / ${progress.total}`}
          subtitle={`${progress.percentage}% ${t("thesis.completed", "completed")} • #${attempt?.attempt_number ?? 1} (${attemptStatus})`}
          icon={CheckCircle2}
        />
      </div>

      {/* Signal / Hint Banners when active */}
      {attemptStatus === "active" && suggestPass && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-950 dark:text-emerald-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-semibold">
              {t("thesisManagement.attempt.passHint", "All required steps are complete! You can mark this thesis attempt as passed.")}
            </span>
          </div>
          {canModify && (
            <Button
              size="sm"
              className="h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold self-start sm:self-auto gap-1.5"
              onClick={() => setStatusDraft({ status: "passed", reason: "" })}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t("thesisManagement.attempt.markPassed", "Mark as Passed")}</span>
            </Button>
          )}
        </div>
      )}

      {attemptStatus === "active" && suggestFail && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-950 dark:text-amber-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div className="space-y-0.5">
              <span className="font-semibold">
                {t("thesisManagement.attempt.failHint", "Signals suggest marking failed.")}
              </span>
              {failReasons.length > 0 && (
                <span className="ml-1 text-[11px] text-amber-800 dark:text-amber-300">
                  ({failReasons.map((r) => (r.type === "trajectory_ended" ? t("thesisManagement.attempt.trajectoryEnded", "Trajectory ended") : `${r.step_name || "Step"} overdue`)).join(", ")})
                </span>
              )}
            </div>
          </div>
          {canModify && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3.5 text-destructive border-destructive/30 hover:bg-destructive/10 font-semibold self-start sm:self-auto gap-1.5"
              onClick={() => setStatusDraft({ status: "failed", reason: "" })}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{t("thesisManagement.attempt.markFailed", "Mark as Failed")}</span>
            </Button>
          )}
        </div>
      )}

      {attempt?.status_reason && (
        <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-xs text-muted-foreground flex items-center gap-2">
          <strong className="text-foreground">{t("thesisManagement.attempt.reason", "Reason")}:</strong>
          <span>{attempt.status_reason}</span>
        </div>
      )}

      {/* Main Content Layout: Left (Steps) | Right (Assigned Reader & Activity Log) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Steps & Submissions */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Steps & Submissions Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <h3 className="text-base font-bold text-foreground">
                  {t("thesisManagement.tabs.steps", "Steps & Submissions")}
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {steps.length} {t("thesis.steps", "steps")}
                </span>
              </div>
              <div className="sm:hidden">
                {renderAttemptDecisionButton("sm", "outline")}
              </div>
            </div>
          {steps.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
              {t("thesis.noSteps", "No steps configured for this thesis trajectory.")}
            </div>
          ) : (
            steps.map((step, idx) => (
              <div
                key={step._id}
                className="bg-card border border-border rounded-xl p-5 sm:p-6 shadow-2xs space-y-4"
              >
                {/* Step Header: clean, non-cluttered badge design */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <h3 className="text-base font-bold text-foreground">{step.name}</h3>
                    </div>
                    {/* Clean 2-chip row without redundant duplicate badges */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pl-8">
                      <span className="font-medium px-2 py-0.5 rounded bg-muted">
                        {getStepTypeLabel(step.type)}
                      </span>
                      {(() => {
                        const dm = getDeadlineModeBadge(step.deadline_mode);
                        return (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs border ${dm.className}`}
                          >
                            {dm.label}
                          </span>
                        );
                      })()}
                      {step.type === "document_upload" && step.student_uploads_document === false && (
                        <span className="font-medium px-2 py-0.5 rounded text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                          {t("thesis.staffUploadOnly", "Staff upload only")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Deadline & Status on right */}
                  <div className="flex flex-wrap items-center gap-3 pl-8 sm:pl-0 sm:self-center">
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
                        {step.has_student_override && (
                          <span className="text-[10px] font-semibold text-primary px-1.5 py-0.5 rounded bg-primary/10">
                            ({t("thesisManagement.attempt.customDeadline", "Custom")})
                          </span>
                        )}
                      </div>
                      {canModify && (
                        <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-border/60">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground gap-1"
                            onClick={() =>
                              setDeadlineDraft({
                                stepId: step._id,
                                date: step.deadline_date
                                  ? moment(step.deadline_date).format("YYYY-MM-DD")
                                  : "",
                              })
                            }
                            title={t("common.edit", "Edit")}
                          >
                            <Pencil className="w-3 h-3" />
                            <span>{t("common.edit", "Edit")}</span>
                          </Button>
                          {step.has_student_override && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                              disabled={updateStepDeadlineMutation.isPending}
                              onClick={() => handleDeadlineClear(step._id)}
                              title={t("thesisManagement.attempt.restoreCohort", "Restore cohort deadline")}
                            >
                              {t("thesisManagement.attempt.restoreCohort", "Restore")}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    <div>{getStatusBadge(step.status)}</div>
                  </div>
                </div>

                {/* Instruction & Resources */}
                <div className="pl-0 sm:pl-8 space-y-3">
                  {step.status === "locked" && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {step.lock_prerequisite_name
                          ? t(
                              "thesis.status.lockedWaitingNamed",
                              "Waiting for “{{step}}” to be completed.",
                              { step: step.lock_prerequisite_name }
                            )
                          : t(
                              "thesis.status.lockedWaiting",
                              "Waiting for the required earlier step to be completed."
                            )}
                      </span>
                    </div>
                  )}
                  <RichHtml html={step.instruction} className="text-xs sm:text-sm text-muted-foreground" />

                  {step.resources && step.resources.length > 0 && (
                    <div className="pt-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                        {t("thesis.resources", "Resources & Links")}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {step.resources.map((res, rIdx) => (
                          <a
                            key={rIdx}
                            href={res.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1 bg-primary/5 px-2.5 py-1 rounded border border-primary/20"
                          >
                            {res.label || res.url}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {step.attachments && step.attachments.length > 0 && (
                    <div className="pt-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                        {t("thesis.documents", "Documents")}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {step.attachments.map((att, aIdx) => (
                          <div
                            key={att.file_url || aIdx}
                            className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card/60 hover:bg-muted/30 transition-colors gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-primary shrink-0" />
                              <span
                                className="text-xs font-medium text-foreground truncate"
                                title={att.name}
                              >
                                {att.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs gap-1 cursor-pointer"
                                onClick={() => openSecureFile(att.file_url, att.name)}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                {t("common.view", "View")}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs gap-1 cursor-pointer"
                                onClick={() => downloadSecureFile(att.file_url, att.name)}
                              >
                                <Download className="w-3.5 h-3.5" />
                                {t("common.download", "Download")}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step Action 1: Document Upload */}
                  {step.type === "document_upload" && (
                    <div className="space-y-3 pt-2">
                      {/* Submissions list */}
                      {step.documents && step.documents.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                            {t("thesis.uploadedDocuments", "Submissions & Files")}
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {step.documents.map((doc) => {
                              const isLink = doc.kind === "link";
                              return (
                              <div
                                key={doc._id}
                                className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20 gap-3"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                    {isLink ? (
                                      <Link2 className="w-4 h-4" />
                                    ) : (
                                      <FileText className="w-4 h-4" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-foreground truncate" title={doc.name}>
                                      {doc.name || (isLink ? "Link" : "Document")}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground flex-wrap">
                                      <span>{moment(doc.uploaded_at).format("DD/MM/YYYY")}</span>
                                      {isLink && (
                                        <span>• {t("thesis.linkLabel", "Link")}</span>
                                      )}
                                      {doc.uploaded_by && (
                                        <span>
                                          • {doc.source === "backoffice" ? "Staff:" : "Student:"}{" "}
                                          {`${doc.uploaded_by.first_name || ""} ${doc.uploaded_by.last_name || ""}`.trim() || doc.uploaded_by.email}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {isLink ? (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                      onClick={() =>
                                        window.open(doc.url, "_blank", "noopener,noreferrer")
                                      }
                                      title={t("thesis.openLink", "Open link")}
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </Button>
                                  ) : (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        onClick={() => openSecureFile(doc.url)}
                                        title={t("thesis.viewFile", "View")}
                                      >
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        onClick={() =>
                                          downloadSecureFile(doc.url, doc.file_name || doc.name)
                                        }
                                        title={t("thesis.downloadFile", "Download")}
                                      >
                                        <Download className="w-4 h-4" />
                                      </Button>
                                    </>
                                  )}
                                  {canModify && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        onClick={() =>
                                          setRenameDraft({
                                            stepId: step._id,
                                            documentId: doc._id,
                                            name: doc.name || "",
                                            kind: doc.kind || "file",
                                          })
                                        }
                                        title={t("thesis.renameDocument", "Rename")}
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() =>
                                          setDeleteDraft({
                                            stepId: step._id,
                                            documentId: doc._id,
                                            name: doc.name || "",
                                            kind: doc.kind || "file",
                                          })
                                        }
                                        title={
                                          isLink
                                            ? t("thesis.deleteLink", "Delete link")
                                            : t("thesis.deleteDocument", "Delete")
                                        }
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Upload Document / Add Link */}
                      {canModify && (
                        <div className="pt-1 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2 text-xs"
                            onClick={() =>
                              setUploadDraft({ stepId: step._id, name: "", file: null })
                            }
                          >
                            <Upload className="w-3.5 h-3.5 text-primary" />
                            {t("thesis.uploadDocument", "Upload Document")}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2 text-xs"
                            onClick={() =>
                              setLinkDraft({ stepId: step._id, name: "", url: "" })
                            }
                          >
                            <Link2 className="w-3.5 h-3.5 text-primary" />
                            {t("thesis.addLink", "Add Link")}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step Action 2: Teacher Approval Request Status */}
                  {step.type === "teacher_approval" && (
                    <div className="space-y-3 pt-2">
                      <div className="p-4 rounded-xl bg-muted/30 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-primary" />
                            {t("thesis.supervisorRequestStatus", "Supervisor Approval")}:
                          </span>
                          <div className="flex items-center gap-2">
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
                        </div>

                        <div className="flex items-center gap-2">
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
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                              {t("thesis.rejected", "Rejected")}
                            </span>
                          )}
                          {canModify && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1.5 ml-2"
                              onClick={openSupervisorEdit}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              {t("thesisManagement.editSupervisor", "Edit Supervisor")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Assigned Reader & Activity Log */}
      <div className="lg:col-span-5 xl:col-span-4 space-y-5 lg:sticky lg:top-4">
        {/* Assigned Reader Card */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {t("thesisManagement.assignedReader", "Assigned Reader")}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {t("thesisManagement.readerDesc", "Thesis evaluator")}
                </p>
              </div>
            </div>
            {updateReaderMutation.isPending && (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground block">
              {t("thesisManagement.selectReader", "Select Reader")}
            </label>
            <Select
              disabled={!canModify || updateReaderMutation.isPending}
              value={reader?._id || "NONE"}
              onValueChange={handleReaderChange}
            >
              <SelectTrigger className="w-full h-9 bg-background text-xs">
                <SelectValue placeholder={t("thesisManagement.selectReader", "Select Reader...")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE" className="text-xs text-muted-foreground">
                  {t("thesisManagement.noReaderAssigned", "— No Reader Assigned —")}
                </SelectItem>
                {eligibleReaders.map((teacher) => (
                  <SelectItem key={teacher._id} value={teacher._id} className="text-xs">
                    {teacher.first_name} {teacher.last_name} ({teacher.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Student Personal Notes Card */}
        <StudentPersonalNotesCard
          thesisId={thesisId}
          trajectoryId={trajectoryId}
          userId={userId}
          notes={personalNotes}
          canModify={canModify}
        />

        {/* Activity Log Card (Timeline View) */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <History className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">
                    {t("thesisManagement.allLogsTitle", "Activity Log")}
                  </h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {allLogs.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("thesisManagement.searchLogs", "Search activity logs...")}
              className="w-full pl-8 h-8 text-xs bg-background"
              value={logSearch}
              onChange={(e) => {
                setLogSearch(e.target.value);
                setLogPage(1);
              }}
            />
          </div>

          {filteredLogs.length === 0 ? (
            <div className="py-8 text-center space-y-1">
              <History className="w-7 h-7 text-muted-foreground/30 mx-auto" />
              <p className="text-xs font-medium text-foreground">
                {t("thesisManagement.noLogsYet", "No activity logs found")}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {logSearch
                  ? t("thesisManagement.tryDifferentSearch", "Try searching for a different keyword")
                  : t("thesisManagement.noLogsRecorded", "Activities will appear here once steps are updated.")}
              </p>
            </div>
          ) : (
            <div className="relative pl-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/70 space-y-3.5 pt-1">
              {paginatedLogs.map((log) => {
                const meta = getActionMeta(log.action);
                const IconComp = meta.icon;
                const actorName = log.actor
                  ? `${log.actor.first_name || ""} ${log.actor.last_name || ""}`.trim() || log.actor.email
                  : "System";
                const stepObj = steps.find((s) => String(s._id) === String(log.step));
                const stepName = stepObj ? stepObj.name : null;

                return (
                  <div key={log._id} className="relative group">
                    {/* Timeline icon node */}
                    <div
                      className={`absolute -left-5 top-1 w-5 h-5 rounded-full border flex items-center justify-center transition-transform group-hover:scale-110 shadow-2xs ${meta.colorClass}`}
                    >
                      <IconComp className="w-2.5 h-2.5" />
                    </div>

                    {/* Activity Item Card */}
                    <div className="bg-muted/20 hover:bg-muted/40 border border-border/60 rounded-lg p-3 transition-colors space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${meta.badgeClass}`}
                          >
                            {formatActionLabel(log.action)}
                          </span>
                          {stepName && (
                            <span
                              className="text-[10px] font-medium text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border/50 truncate max-w-[130px]"
                              title={stepName}
                            >
                              {stepName}
                            </span>
                          )}
                        </div>
                        {/* Date ONLY */}
                        <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-muted-foreground/70" />
                          {moment(log.createdAt).format("DD/MM/YYYY")}
                        </span>
                      </div>

                      {/* Detail text */}
                      {log.detail && (
                        <p className="text-xs text-foreground/90 font-medium leading-relaxed">
                          {log.detail}
                        </p>
                      )}

                      {/* Actor footer */}
                      <div className="flex items-center gap-1.5 pt-1 border-t border-border/40 text-[11px] text-muted-foreground">
                        <Avatar className="w-4 h-4 border border-border/60">
                          <AvatarImage src={log.actor?.avatar} />
                          <AvatarFallback className="text-[8px] font-bold">
                            {actorName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">
                          {t("thesisManagement.by", "By")}{" "}
                          <strong className="text-foreground font-semibold">{actorName}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredLogs.length > logRowsPerPage && (
            <div className="pt-2 border-t border-border">
              <Pagination
                page={logPage}
                setPage={setLogPage}
                rowsPerPage={logRowsPerPage}
                setRowsPerPage={setLogRowsPerPage}
                totalRows={filteredLogs.length}
              />
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Edit Supervisor Modal */}
      <Dialog open={supervisorModalOpen} onOpenChange={setSupervisorModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              {t("thesisManagement.editSupervisor", "Edit Thesis Supervisor")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                {t("thesisManagement.selectSupervisor", "Select Supervisor")}
              </label>
              <Select
                value={selectedSupervisorId}
                onValueChange={setSelectedSupervisorId}
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder={t("thesisManagement.selectSupervisorPlaceholder", "Choose supervisor...")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE" className="text-xs text-muted-foreground">
                    {t("thesisManagement.noSupervisorAssigned", "— No Supervisor Assigned —")}
                  </SelectItem>
                  {eligibleSupervisors.map((s) => (
                    <SelectItem key={s._id} value={s._id} className="text-xs">
                      {s.first_name} {s.last_name} ({s.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSupervisorId !== "NONE" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  {t("thesisManagement.approvalStatus", "Approval Status")}
                </label>
                <Select
                  value={selectedSupervisorStatus}
                  onValueChange={setSelectedSupervisorStatus}
                >
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved" className="text-xs">
                      {t("thesis.approved", "Approved (Unlocks dependent steps)")}
                    </SelectItem>
                    <SelectItem value="pending" className="text-xs">
                      {t("thesis.pendingApproval", "Pending Review")}
                    </SelectItem>
                    <SelectItem value="rejected" className="text-xs">
                      {t("thesis.rejected", "Rejected")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-row items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSupervisorModalOpen(false)}
              disabled={updateSupervisorMutation.isPending}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSupervisorSubmit}
              disabled={updateSupervisorMutation.isPending}
              className="gap-2"
            >
              {updateSupervisorMutation.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              {t("common.save", "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Document Modal */}
      <Dialog
        open={!!uploadDraft}
        onOpenChange={(open) => {
          if (!open && !isUploading) setUploadDraft(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" />
              {t("thesis.uploadDocument", "Upload Document")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <DocumentUploadArea
              fileType="staff_thesis_document"
              title={t("thesis.documentFile", "Document File")}
              acceptedFormats="PDF, DOC, DOCX, ZIP, PNG, JPG"
              accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg"
              isOptional={false}
              uploadedFile={uploadDraft?.file}
              onFileUpload={handleModalFileUpload}
              onRemoveFile={handleModalRemoveFile}
              onDragOver={handleModalDragOver}
              onDrop={handleModalDrop}
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t("thesis.documentDisplayName", "Document Display Name")}
                <span className="text-destructive ml-1">*</span>
              </label>
              <Input
                type="text"
                placeholder={t("thesis.documentNamePlaceholder", "e.g., Final Thesis Draft")}
                value={uploadDraft?.name || ""}
                onChange={(e) =>
                  setUploadDraft((prev) => (prev ? { ...prev, name: e.target.value } : prev))
                }
                className="h-10 text-xs sm:text-sm"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-row items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setUploadDraft(null)}
              disabled={isUploading || uploadDocMutation.isPending}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleStaffUploadSubmit}
              disabled={
                isUploading ||
                uploadDocMutation.isPending ||
                !uploadDraft?.file ||
                !uploadDraft?.name?.trim()
              }
              className="gap-2"
            >
              {isUploading || uploadDocMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {t("thesis.uploading", "Uploading...")}
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  {t("common.upload", "Upload")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Link Modal */}
      <Dialog
        open={!!linkDraft}
        onOpenChange={(open) => {
          if (!open && !uploadDocMutation.isPending) setLinkDraft(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" />
              {t("thesis.addLink", "Add Link")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t("thesis.linkTitle", "Link Title")}
                <span className="text-destructive ml-1">*</span>
              </label>
              <Input
                type="text"
                placeholder={t("thesis.linkTitlePlaceholder", "e.g., Draft Google Drive folder")}
                value={linkDraft?.name || ""}
                onChange={(e) =>
                  setLinkDraft((prev) => (prev ? { ...prev, name: e.target.value } : prev))
                }
                className="h-10 text-xs sm:text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t("thesis.linkUrl", "URL")}
                <span className="text-destructive ml-1">*</span>
              </label>
              <Input
                type="text"
                placeholder="https://"
                value={linkDraft?.url || ""}
                onChange={(e) =>
                  setLinkDraft((prev) => (prev ? { ...prev, url: e.target.value } : prev))
                }
                className="h-10 text-xs sm:text-sm"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-row items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLinkDraft(null)}
              disabled={uploadDocMutation.isPending}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleStaffAddLinkSubmit}
              disabled={
                uploadDocMutation.isPending ||
                !linkDraft?.name?.trim() ||
                !linkDraft?.url?.trim()
              }
              className="gap-2"
            >
              {uploadDocMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {t("common.saving", "Saving...")}
                </>
              ) : (
                <>
                  <Link2 className="w-3.5 h-3.5" />
                  {t("thesis.addLink", "Add Link")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Document Modal */}
      <Dialog open={!!renameDraft} onOpenChange={(open) => !open && setRenameDraft(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {renameDraft?.kind === "link"
                ? t("thesis.renameLink", "Rename Link")
                : t("thesis.renameDocument", "Rename Document")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label className="text-xs font-semibold text-muted-foreground">
              {renameDraft?.kind === "link"
                ? t("thesis.linkTitle", "Link Title")
                : t("thesis.documentDisplayName", "Document Display Name")}
            </label>
            <Input
              type="text"
              value={renameDraft?.name || ""}
              onChange={(e) =>
                setRenameDraft((prev) => ({ ...prev, name: e.target.value }))
              }
              className="text-xs"
            />
          </div>

          <DialogFooter className="flex flex-row items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRenameDraft(null)}
              disabled={renameDocMutation.isPending}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleStaffRenameSubmit}
              disabled={renameDocMutation.isPending}
              className="gap-2"
            >
              {renameDocMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {t("common.save", "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Document Confirmation Dialog */}
      <Dialog open={!!deleteDraft} onOpenChange={(open) => !open && setDeleteDraft(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              {deleteDraft?.kind === "link"
                ? t("thesis.deleteLink", "Delete Link")
                : t("thesis.deleteDocument", "Delete Document")}
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-muted-foreground">
            {deleteDraft?.kind === "link"
              ? t(
                  "thesis.confirmDeleteLink",
                  "Are you sure you want to permanently delete this link?"
                )
              : t(
                  "thesis.confirmDeleteDoc",
                  "Are you sure you want to permanently delete this document?"
                )}{" "}
            <span className="font-semibold text-foreground">"{deleteDraft?.name}"</span>
          </p>

          <DialogFooter className="flex flex-row items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteDraft(null)}
              disabled={deleteDocMutation.isPending}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleStaffDeleteSubmit}
              disabled={deleteDocMutation.isPending}
              className="gap-2"
            >
              {deleteDocMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {t("common.delete", "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin re-enrol to another trajectory */}
      <Dialog
        open={reenrollOpen}
        onOpenChange={(open) => {
          if (!open && !reenrollMutation.isPending) {
            setReenrollOpen(false);
            setReenrollTrajectoryId("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {t(
                "thesisManagement.attempt.reenrollTrajectory",
                "Re-enrol trajectory"
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                {t(
                  "thesisManagement.attempt.targetTrajectory",
                  "Target trajectory"
                )}
              </label>
              <Select
                value={reenrollTrajectoryId}
                onValueChange={setReenrollTrajectoryId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t(
                      "thesisManagement.attempt.selectTrajectory",
                      "Select a trajectory"
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {reenrollTargets.map((traj) => (
                    <SelectItem key={traj._id} value={String(traj._id)}>
                      {traj.name || String(traj._id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {reenrollTargets.length === 0 && (
                <p className="text-[11px] text-muted-foreground">
                  {t(
                    "thesisManagement.attempt.noOtherTrajectories",
                    "No other trajectories available for this thesis."
                  )}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReenrollOpen(false)}
              disabled={reenrollMutation.isPending}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleReenrollSubmit}
              disabled={reenrollMutation.isPending || !reenrollTrajectoryId}
              className="gap-2"
            >
              {reenrollMutation.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              {t("thesisManagement.attempt.confirmReenroll", "Re-enrol")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark attempt passed/failed */}
      <Dialog open={!!statusDraft} onOpenChange={(open) => !open && setStatusDraft(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {statusDraft?.status === "failed"
                ? t("thesisManagement.attempt.markFailed", "Mark failed")
                : t("thesisManagement.attempt.markPassed", "Mark passed")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              {t(
                "thesisManagement.attempt.irreversible",
                "This cannot be reset to active afterwards."
              )}
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                {t("thesisManagement.attempt.reasonOptional", "Reason (optional)")}
              </label>
              <Input
                value={statusDraft?.reason || ""}
                onChange={(e) =>
                  setStatusDraft((prev) =>
                    prev ? { ...prev, reason: e.target.value } : prev
                  )
                }
                placeholder={t("thesisManagement.attempt.reasonPlaceholder", "Add a short reason")}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStatusDraft(null)}
              disabled={updateAttemptStatusMutation.isPending}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={statusDraft?.status === "failed" ? "destructive" : "default"}
              onClick={handleAttemptStatusSubmit}
              disabled={updateAttemptStatusMutation.isPending}
              className="gap-2"
            >
              {updateAttemptStatusMutation.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              {t("common.confirm", "Confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit per-student step deadline */}
      <Dialog open={!!deadlineDraft} onOpenChange={(open) => !open && setDeadlineDraft(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {t("thesisManagement.attempt.editDeadline", "Edit student deadline")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                {t("thesis.deadline", "Deadline")}
              </label>
              <Input
                type="date"
                value={deadlineDraft?.date || ""}
                onChange={(e) =>
                  setDeadlineDraft((prev) =>
                    prev ? { ...prev, date: e.target.value } : prev
                  )
                }
              />
              <p className="text-[11px] text-muted-foreground">
                {t(
                  "thesisManagement.attempt.deadlineHint",
                  "Clear the date and save to remove the custom override and restore the cohort deadline."
                )}
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeadlineDraft(null)}
              disabled={updateStepDeadlineMutation.isPending}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDeadlineSubmit}
              disabled={updateStepDeadlineMutation.isPending}
              className="gap-2"
            >
              {updateStepDeadlineMutation.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              {t("common.save", "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
