import { useEffect, useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { LoadingState, ErrorMessage } from "@/components/common";
import {
  Edit,
  Power,
  PowerOff,
  Layers,
  Calendar,
  Award,
  Users,
  GraduationCap,
  CalendarDays,
  Tag,
  CircleDollarSign,
  FileText,
} from "lucide-react";
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
  const canModify = useCanModify("operations");
  const params = useParams({ strict: false });
  const id = params.id;
  const navigate = useNavigate();
  const { updateBreadcrumbs } = useBreadcrumb();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [openDeactivate, setOpenDeactivate] = useState(false);

  const { data: responseData, isLoading, error, refetch } = useGetThesisById(id);
  const updateThesisStatus = useUpdateThesisStatus();

  const thesis = responseData?.data;

  useEffect(() => {
    if (thesis) {
      updateBreadcrumbs([
        {
          label: t("sidebar.admin.thesis", "Thesis"),
          path: "/admin/thesis",
          navigable: true,
        },
        {
          label: thesis.name || t("thesisManagement.detail.title", "Thesis Details"),
          path: `/admin/thesis/${id}`,
          navigable: false,
        },
      ]);
    }
    return () => {
      updateBreadcrumbs([]);
    };
  }, [thesis, id, updateBreadcrumbs, t]);

  if (isLoading) {
    return (
      <LoadingState
        text={t("thesisManagement.detail.loading", "Loading thesis details...")}
        fullHeight
      />
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={
            error?.message ||
            t("thesisManagement.detail.loadFailed", "Failed to load thesis details")
          }
          onRetry={refetch}
          variant="card"
        />
      </div>
    );
  }

  if (!thesis) return null;

  const handleConfirmDeactivate = async () => {
    try {
      await updateThesisStatus.mutateAsync({
        id: thesis._id,
        status: false,
      });
    } finally {
      setOpenDeactivate(false);
    }
  };

  const handleActivate = () => {
    updateThesisStatus.mutate({
      id: thesis._id,
      status: true,
    });
  };

  const programType =
    (Array.isArray(thesis.program) && thesis.program[0]?.program_type) ||
    thesis.program?.program_type ||
    null;
  const programTypeLabel = programType
    ? t(PROGRAM_TYPE_I18N_KEYS[programType] || programType, programType)
    : t("common.notAvailable", "N/A");

  const headerActions = [
    {
      label: t("thesisManagement.detail.moduleDetails", "Module details"),
      icon: Edit,
      onClick: () => setIsEditModalOpen(true),
    },
    {
      label: t("thesisManagement.detail.teachers", "Teachers"),
      icon: Users,
      onClick: () =>
        navigate({
          to: "/admin/thesis/$id/teachers",
          params: { id },
        }),
    },
    {
      label: t("thesisManagement.detail.steps", "Steps"),
      icon: Layers,
      onClick: () =>
        navigate({
          to: "/admin/thesis/$id/steps",
          params: { id },
        }),
    },
    {
      label: t("thesisManagement.detail.deadlines", "Deadlines"),
      icon: Calendar,
      onClick: () =>
        navigate({
          to: "/admin/thesis/$id/deadlines",
          params: { id },
        }),
    },
    {
      label: t("thesisManagement.detail.markingSchemeLaterPhase", "Marking scheme"),
      icon: Award,
      disabled: true,
    },
    thesis.status
      ? {
          label: t("thesisManagement.table.deactivate", "Deactivate"),
          icon: PowerOff,
          onClick: () => setOpenDeactivate(true),
          className: "text-red-600 dark:text-red-400",
        }
      : {
          label: t("thesisManagement.table.activate", "Activate"),
          icon: Power,
          onClick: handleActivate,
          className: "text-green-600 dark:text-green-400",
        },
  ];

  return (
    <div className="space-y-6 mt-4">
      {/* Header section */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ff8904]/10 text-[#ff8904] border border-[#ff8904]/20">
                {thesis.uid}
              </span>
              <h1 className="text-2xl font-bold text-foreground">
                {thesis.name}
              </h1>
              <div className="flex items-center gap-1.5 text-sm">
                <StatusBadge status={thesis.status} />
              </div>
            </div>
          </div>

          {canModify && (
            <div className="flex items-center gap-2 self-start md:self-center">
              <RowActionMenu actions={headerActions} />
            </div>
          )}
        </div>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Programme Type */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {t("thesisManagement.detail.programType", "Programme Type")}
            </p>
            <p className="text-sm font-semibold text-foreground mt-0.5 truncate" title={programTypeLabel}>
              {programTypeLabel}
            </p>
          </div>
        </div>

        {/* Academic Year */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {t("thesisManagement.detail.academicYear", "Academic Years")}
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              {Array.isArray(thesis.academic) && thesis.academic.length > 0 ? (
                thesis.academic.map((a, idx) => (
                  <span
                    key={a._id || idx}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-700 dark:text-blue-300"
                  >
                    {a.name || a}
                  </span>
                ))
              ) : (
                <span className="text-sm font-semibold text-foreground">
                  {thesis.academic?.name || "-"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Programme */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {t("thesisManagement.detail.programme", "Programmes")}
            </p>
            {Array.isArray(thesis.program) && thesis.program.length > 0 ? (
              <div className="space-y-1.5 mt-1 max-h-32 overflow-y-auto">
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
              {thesis.current_year ? `Year ${thesis.current_year}` : "-"}
            </p>
          </div>
        </div>

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
