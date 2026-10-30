import { useEffect, useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { LoadingState, ErrorMessage } from "@/components/common";
import {
  Edit,
  Power,
  PowerOff,
  Award,
  Users,
  GraduationCap,
  CalendarDays,
  CircleDollarSign,
  FileText,
  Paperclip,
  Download,
  Eye,
  Layers,
  Calendar,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { openSecureFile, downloadSecureFile } from "@/utils/secureFile";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { useGetThesisById, useUpdateThesisStatus } from "@/store/useThesisStore";
import { useTranslation } from "react-i18next";
import { useCanModify } from "@/hooks/useCanModify";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import StatusBadge from "@/components/StatusBadge";
import CreateThesis from "@/components/admin/thesis/CreateThesis";
import DeactivateThesisConfirm from "@/components/admin/thesis/DeactivateThesisConfirm";
import TrajectoryList from "@/components/admin/thesis/TrajectoryList";
import { PROGRAM_TYPE_I18N_KEYS } from "@/constants/programTypes";

const ThesisDetail = () => {
  const { t } = useTranslation();
  const params = useParams({ strict: false });
  const id = params?.id;
  const navigate = useNavigate();
  const { updateBreadcrumbs } = useBreadcrumb();
  const canModify = useCanModify("operations");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [openDeactivate, setOpenDeactivate] = useState(false);

  const { data: thesisResponse, isLoading, isError, error } = useGetThesisById(id);
  const updateThesisStatus = useUpdateThesisStatus();

  const thesis = thesisResponse?.data;

  useEffect(() => {
    updateBreadcrumbs([
      { label: t("thesisManagement.title", "Thesis Catalog"), path: "/admin/thesis" },
      { label: thesis?.name || t("thesisManagement.detail.title", "Thesis Details") },
    ]);
  }, [thesis?.name, updateBreadcrumbs, t]);

  const handleToggleStatus = () => {
    if (thesis?.status) {
      setOpenDeactivate(true);
    } else {
      updateThesisStatus.mutate({ id: thesis._id, status: true });
    }
  };

  const handleConfirmDeactivate = () => {
    updateThesisStatus.mutate(
      { id: thesis._id, status: false },
      {
        onSuccess: () => {
          setOpenDeactivate(false);
        },
      }
    );
  };

  if (isLoading) {
    return <LoadingState message={t("thesisManagement.detail.loading", "Loading thesis details...")} />;
  }

  if (isError || !thesis) {
    return (
      <ErrorMessage
        message={error?.message || t("thesisManagement.detail.loadFailed", "Failed to load thesis details")}
        onRetry={() => navigate({ to: "/admin/thesis" })}
      />
    );
  }

  const actions = [
    ...(canModify
      ? [
          {
            label: t("thesisManagement.menu.moduleDetails", "Module details"),
            icon: Edit,
            onClick: () => setIsEditModalOpen(true),
          },
        ]
      : []),
    {
      label: t("thesisManagement.teachers.title", "Teachers"),
      icon: Users,
      onClick: () =>
        navigate({
          to: "/admin/thesis/$id/teachers",
          params: { id },
        }),
    },
    {
      label: t("thesisManagement.steps.title", "Steps"),
      icon: Layers,
      onClick: () =>
        navigate({
          to: "/admin/thesis/$id/steps",
          params: { id },
        }),
    },
    {
      label: t("thesisManagement.deadlines.title", "Deadlines"),
      icon: Calendar,
      onClick: () =>
        navigate({
          to: "/admin/thesis/$id/deadlines",
          params: { id },
        }),
    },
    {
      label: t("thesisManagement.menu.markingScheme", "Marking scheme"),
      icon: ClipboardList,
      disabled: true,
      onClick: () => {},
    },
    ...(canModify
      ? [
          {
            label: thesis.status
              ? t("thesisManagement.table.deactivate", "Deactivate")
              : t("thesisManagement.table.activate", "Activate"),
            icon: thesis.status ? PowerOff : Power,
            onClick: handleToggleStatus,
            className: thesis.status
              ? "text-red-600 dark:text-red-400"
              : "text-green-600 dark:text-green-400",
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Header Card */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              {thesis.uid && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  {thesis.uid}
                </span>
              )}
              <h1 className="text-2xl font-bold text-foreground">{thesis.name}</h1>
              <StatusBadge status={thesis.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {t("thesisManagement.detail.moduleDetails", "Module details and configured trajectory milestones.")}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <RowActionMenu actions={actions} />
          </div>
        </div>
      </div>

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Price */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <CircleDollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {t("thesisManagement.detail.price", "Price")}
            </p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              €{Number(thesis.price ?? 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Academic Years (Multi) */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {t("thesisManagement.detail.academicYear", "Academic Year")}
            </p>
            <p
              className="text-sm font-semibold text-foreground mt-0.5 truncate"
              title={
                Array.isArray(thesis.academic)
                  ? thesis.academic.map((a) => a.name || a).join(", ")
                  : thesis.academic?.name || "-"
              }
            >
              {Array.isArray(thesis.academic) && thesis.academic.length > 0
                ? thesis.academic.map((a) => a.name || a).join(", ")
                : thesis.academic?.name || "-"}
            </p>
          </div>
        </div>

        {/* Programmes (Multi) */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {t("thesisManagement.detail.programme", "Programme")}
            </p>
            {Array.isArray(thesis.program) && thesis.program.length > 0 ? (
              <div className="mt-1 space-y-1">
                {thesis.program.map((p, idx) => (
                  <div key={p._id || idx} className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate" title={p.name}>
                      {p.name || "-"}
                    </p>
                    {(p.city?.name || p.is_online || p.language?.name) && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {[p.is_online ? "Online" : p.city?.name, p.language?.name].filter(Boolean).join(" - ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm font-semibold text-foreground mt-0.5 truncate">
                {thesis.program?.name || "-"}
              </p>
            )}
          </div>
        </div>

        {/* Study Year */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Award className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {t("thesisManagement.detail.studyYear", "Study Year")}
            </p>
            <p className="text-sm font-semibold text-foreground mt-0.5 truncate">
              {thesis.current_year
                ? Array.isArray(thesis.current_year)
                  ? thesis.current_year.map((y) => `Year ${y}`).join(", ")
                  : `Year ${thesis.current_year}`
                : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Description / Content Card */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <FileText className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-base font-semibold text-foreground">
            {t("thesisManagement.detail.description", "Description")}
          </h3>
        </div>

        {thesis.description ? (
          <div
            className="prose dark:prose-invert max-w-none text-sm text-foreground/90 leading-relaxed overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: thesis.description }}
          />
        ) : (
          <p className="text-sm text-muted-foreground italic">
            {t(
              "thesisManagement.detail.noDescription",
              "No description provided for this thesis."
            )}
          </p>
        )}
      </div>

      {/* Documents Section */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-base font-semibold text-foreground">
              {t("thesisManagement.detail.documents", "Documents")}
            </h3>
          </div>
          {Array.isArray(thesis.attachments) && thesis.attachments.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
              {thesis.attachments.length} {thesis.attachments.length === 1 ? t("common.file", "file") : t("common.files", "files")}
            </span>
          )}
        </div>

        {Array.isArray(thesis.attachments) && thesis.attachments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {thesis.attachments.map((file, idx) => (
              <div
                key={file.file_url || idx}
                className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-card/50 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 mr-3">
                  <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate" title={file.name || file.filename}>
                      {file.name || file.filename}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 h-8 px-2.5 text-xs cursor-pointer"
                    onClick={() => openSecureFile(file.file_url, file.name || file.filename)}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {t("common.view", "View")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 h-8 px-2.5 text-xs cursor-pointer"
                    onClick={() => downloadSecureFile(file.file_url, file.name || file.filename)}
                  >
                    <Download className="w-3.5 h-3.5" />
                    {t("common.download", "Download")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            {t(
              "thesisManagement.detail.noAttachments",
              "No documents provided for this thesis."
            )}
          </p>
        )}
      </div>

      {/* Trajectories Section */}
      <TrajectoryList thesisId={id} canModify={canModify} />

      {/* Edit Modal */}
      <CreateThesis
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        thesisData={thesis}
      />

      {/* Deactivate Confirmation Dialog */}
      <DeactivateThesisConfirm
        open={openDeactivate}
        onClose={() => setOpenDeactivate(false)}
        onConfirm={handleConfirmDeactivate}
        thesisName={thesis.name}
        isLoading={updateThesisStatus.isPending}
      />
    </div>
  );
};

export default ThesisDetail;
