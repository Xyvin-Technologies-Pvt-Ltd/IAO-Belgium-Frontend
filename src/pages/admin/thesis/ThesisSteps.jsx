import { useEffect, useState, useMemo } from "react";
import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Layers,
  Plus,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { useCanModify } from "@/hooks/useCanModify";
import { LoadingState, ErrorMessage } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  useGetThesisById,
  useGetThesisSteps,
  useSaveThesisSteps,
} from "@/store/useThesisStore";
import StepList from "@/components/admin/thesis/StepList";
import StepForm from "@/components/admin/thesis/StepForm";
import DeleteConfirm from "@/components/DeleteConfirm";

const ThesisSteps = () => {
  const { t } = useTranslation();
  const params = useParams({ strict: false });
  const id = params.id;
  const canModify = useCanModify("operations");
  const { updateBreadcrumbs } = useBreadcrumb();

  // Queries
  const {
    data: thesisResponse,
    isLoading: isThesisLoading,
    error: thesisError,
    refetch: refetchThesis,
  } = useGetThesisById(id);

  const {
    data: stepsResponse,
    isLoading: isStepsLoading,
    error: stepsError,
    refetch: refetchSteps,
  } = useGetThesisSteps(id);

  // Mutation
  const saveSteps = useSaveThesisSteps();

  const thesis = thesisResponse?.data;
  const serverSteps = useMemo(() => stepsResponse?.data || [], [stepsResponse?.data]);
  const enrolledCount = stepsResponse?.enrolled_count || 0;
  const serverVersion = stepsResponse?.version || thesis?.updatedAt;

  // Local draft state
  const [draftSteps, setDraftSteps] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [stepToDelete, setStepToDelete] = useState(null);

  // Synchronize draft when server data loads or refetches
  useEffect(() => {
    if (serverSteps) {
      setDraftSteps(serverSteps);
    }
  }, [serverSteps]);

  // Breadcrumbs
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
          navigable: true,
        },
        {
          label: t("thesisManagement.steps.title", "Steps"),
          path: `/admin/thesis/${id}/steps`,
          navigable: false,
        },
      ]);
    }
    return () => {
      updateBreadcrumbs([]);
    };
  }, [thesis, id, updateBreadcrumbs, t]);

  // Check if draft has unsaved changes compared to server
  const isDirty = useMemo(() => {
    if (draftSteps.length !== serverSteps.length) return true;
    return JSON.stringify(draftSteps) !== JSON.stringify(serverSteps);
  }, [draftSteps, serverSteps]);

  const handleReorder = (newOrderedSteps) => {
    setDraftSteps(newOrderedSteps);
  };

  const handleOpenAdd = () => {
    setEditingStep(null);
    setOpenForm(true);
  };

  const handleOpenEdit = (step) => {
    setEditingStep(step);
    setOpenForm(true);
  };

  const editingIndex = useMemo(() => {
    if (!editingStep) return -1;
    return draftSteps.findIndex((s) => {
      if (editingStep._id) return s._id === editingStep._id;
      return s === editingStep;
    });
  }, [editingStep, draftSteps]);

  const handleSaveStepToDraft = (stepData) => {
    if (editingStep) {
      setDraftSteps((prev) =>
        prev.map((s) => {
          const isMatch = editingStep._id
            ? s._id === editingStep._id
            : s === editingStep;
          return isMatch ? { ...s, ...stepData } : s;
        })
      );
    } else {
      setDraftSteps((prev) => [
        ...prev,
        {
          ...stepData,
          _id: stepData._id || `new-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        },
      ]);
    }
  };

  const handleOpenDelete = (step) => {
    setStepToDelete(step);
  };

  const handleConfirmDelete = () => {
    if (!stepToDelete) return;
    setDraftSteps((prev) =>
      prev.filter((s) => {
        if (stepToDelete._id) {
          return s._id !== stepToDelete._id;
        }
        return s !== stepToDelete;
      })
    );
    setStepToDelete(null);
  };

  const handleResetDraft = () => {
    setDraftSteps(serverSteps);
  };

  const handleSaveChanges = async () => {
    if (!id || !canModify) return;

    const cleanedSteps = draftSteps.map((s, index) => {
      const isValidMongoId = s._id && /^[0-9a-fA-F]{24}$/.test(String(s._id));

      let lockedUntilStep = s.locked_until_step || null;
      if (lockedUntilStep && typeof lockedUntilStep === "object") {
        lockedUntilStep = lockedUntilStep._id || null;
      }
      if (lockedUntilStep) {
        const lockStr = String(lockedUntilStep);
        if (!/^[0-9a-fA-F]{24}$/.test(lockStr) && !lockStr.startsWith("__idx__:")) {
          const targetIdx = draftSteps.findIndex(
            (other) => other._id && String(other._id) === lockStr
          );
          lockedUntilStep = targetIdx >= 0 ? `__idx__:${targetIdx}` : null;
        }
      } else if (s.locked_until_supervisor) {
        const firstApprovalIdx = draftSteps.findIndex(
          (other, otherIdx) =>
            otherIdx !== index && other.type === "teacher_approval"
        );
        if (firstApprovalIdx >= 0) {
          const target = draftSteps[firstApprovalIdx];
          lockedUntilStep =
            target._id && /^[0-9a-fA-F]{24}$/.test(String(target._id))
              ? String(target._id)
              : `__idx__:${firstApprovalIdx}`;
        }
      }

      const stepItem = {
        name: s.name,
        type: s.type,
        deadline_mode: s.deadline_mode || "none",
        required: s.required !== undefined ? s.required : true,
        student_uploads_document: Boolean(s.student_uploads_document),
        locked_until_supervisor: false,
        locked_until_step: lockedUntilStep || null,
        approval_roles: Array.isArray(s.approval_roles) ? s.approval_roles : [],
        instruction: s.instruction || "",
        resources: (s.resources || []).map((r) => ({
          label: r.label,
          url: r.url,
        })),
        attachments: (s.attachments || []).map((a) => ({
          name: a.name,
          file_url: a.file_url,
        })),
        sequence: s.sequence,
      };

      if (isValidMongoId) {
        stepItem._id = s._id;
      }

      return stepItem;
    });

    await saveSteps.mutateAsync({
      thesisId: id,
      steps: cleanedSteps,
      version: serverVersion,
    });
  };

  if (isThesisLoading || isStepsLoading) {
    return (
      <LoadingState
        text={t("thesisManagement.steps.loading", "Loading thesis steps...")}
        fullHeight
      />
    );
  }

  if (thesisError || stepsError) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={
            thesisError?.message ||
            stepsError?.message ||
            t("thesisManagement.steps.loadFailed", "Failed to load thesis steps")
          }
          onRetry={() => {
            refetchThesis();
            refetchSteps();
          }}
          variant="card"
        />
      </div>
    );
  }

  if (!thesis) return null;

  return (
    <div className="space-y-6 mt-4">
      {/* Top Banner & Header */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ff8904]/10 text-[#ff8904] border border-[#ff8904]/20">
              {thesis.uid}
            </span>
            <h1 className="text-xl font-bold text-foreground truncate">
              {thesis.name}
            </h1>
          </div>

          {canModify && (
            <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
              {isDirty && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetDraft}
                  disabled={saveSteps.isPending}
                  className="gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t("thesisManagement.steps.discardChanges", "Discard")}
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenAdd}
                disabled={saveSteps.isPending}
                className="gap-1.5"
              >
                <Plus className="w-4 h-4" />
                {t("thesisManagement.steps.addStep", "Add Step")}
              </Button>

              <Button
                size="sm"
                onClick={handleSaveChanges}
                disabled={!isDirty || saveSteps.isPending}
                className="gap-1.5"
              >
                <Save className="w-4 h-4" />
                {saveSteps.isPending
                  ? t("common.saving", "Saving...")
                  : t("thesisManagement.steps.saveChanges", "Save Changes")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Enrolled Students Warning (shown only when enrolled_count > 0) */}
      {enrolledCount > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-800 dark:text-amber-200">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="space-y-1 text-sm">
            <h4 className="font-semibold">
              {t("thesisManagement.steps.warningTitle", "Students Already Enrolled")}
            </h4>
            <p className="text-xs opacity-90">
              {t(
                "thesisManagement.steps.warningDesc",
                "There are {{count}} student(s) currently enrolled in this thesis. Modifying, reordering, or removing steps will affect their active progress and milestone tracking.",
                { count: enrolledCount }
              )}
            </p>
          </div>
        </div>
      )}

      {/* Steps Sortable List */}
      <StepList
        steps={draftSteps}
        onReorder={handleReorder}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
        onAddStep={handleOpenAdd}
        canModify={canModify}
      />

      {/* Add / Edit Step Modal */}
      <StepForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSave={handleSaveStepToDraft}
        initialData={editingStep}
        siblingSteps={draftSteps}
        editingIndex={editingIndex}
      />

      {/* Remove Confirmation Dialog */}
      <DeleteConfirm
        open={!!stepToDelete}
        onClose={() => setStepToDelete(null)}
        onConfirm={handleConfirmDelete}
        count={1}
        data={stepToDelete?.name || "Step"}
        isLoading={false}
      />
    </div>
  );
};

export default ThesisSteps;
