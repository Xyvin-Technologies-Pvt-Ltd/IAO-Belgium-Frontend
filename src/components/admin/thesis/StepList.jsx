import { useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import {
  GripVertical,
  Edit,
  Trash2,
  FileText,
  CheckCircle2,
  Info,
  Calendar,
  Layers,
  Link as LinkIcon,
  Plus,
  Lock,
  Upload,
  Users,
  Paperclip,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const resolveLockTargetLabel = (step, allSteps, t) => {
  const raw = step.locked_until_step;
  if (!raw && !step.locked_until_supervisor) return null;

  if (raw) {
    const rawStr = String(typeof raw === "object" && raw?._id ? raw._id : raw);
    if (rawStr.startsWith("__idx__:")) {
      const idx = Number(rawStr.slice("__idx__:".length));
      const target = allSteps[idx];
      if (target) {
        return `${idx + 1}. ${target.name || "Untitled"}`;
      }
    } else {
      const targetIdx = allSteps.findIndex(
        (s) => s._id && String(s._id) === rawStr
      );
      if (targetIdx >= 0) {
        return `${targetIdx + 1}. ${allSteps[targetIdx].name || "Untitled"}`;
      }
    }
  }

  if (step.locked_until_supervisor) {
    const targetIdx = allSteps.findIndex(
      (s) =>
        s.type === "teacher_approval" &&
        (!step._id || String(s._id) !== String(step._id))
    );
    if (targetIdx >= 0) {
      return `${targetIdx + 1}. ${allSteps[targetIdx].name || "Untitled"}`;
    }
  }

  return t("thesisManagement.steps.tags.prerequisiteGate", "Prerequisite");
};

const SortableStepItem = ({
  step,
  index,
  allSteps = [],
  onEdit,
  onDelete,
  canModify,
  t,
}) => {
  const itemId = step._id || `step-draft-${index}-${step.name}`;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: itemId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const typeConfig = {
    document_upload: {
      label: t("thesisManagement.steps.type.documentUpload", "Document Upload"),
      icon: FileText,
      className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
    teacher_approval: {
      label: t("thesisManagement.steps.type.teacherApproval", "Teacher Approval"),
      icon: CheckCircle2,
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    information_only: {
      label: t("thesisManagement.steps.type.informationOnly", "Information Only"),
      icon: Info,
      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
  }[step.type] || {
    label: step.type,
    icon: Layers,
    className: "bg-muted text-muted-foreground border-border",
  };

  const TypeIcon = typeConfig.icon;

  const deadlineBadge = useMemo(() => {
    if (!step.deadline_mode || step.deadline_mode === "none") return null;

    if (step.deadline_mode === "required") {
      return {
        label: t("thesisManagement.steps.deadline.required", "Deadline Required"),
        className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      };
    }
    if (step.deadline_mode === "event_date") {
      return {
        label: t("thesisManagement.steps.deadline.event", "Event Date"),
        className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      };
    }
    return {
      label: t("thesisManagement.steps.deadline.optional", "Deadline Optional"),
      className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    };
  }, [step.deadline_mode, t]);

  const approvalRolesText = useMemo(() => {
    if (step.type !== "teacher_approval") return null;
    if (Array.isArray(step.approval_roles) && step.approval_roles.length > 0) {
      return step.approval_roles.map((r) => r.name || r.key || r).join(", ");
    }
    return null;
  }, [step.type, step.approval_roles]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between gap-4 p-3.5 bg-card border border-border rounded-xl transition-all shadow-xs ${
        isDragging
          ? "opacity-60 shadow-lg ring-2 ring-primary/30"
          : "hover:border-primary/40 hover:shadow-xs"
      }`}
    >
      {/* Left section: Drag + Sequence + Name + Type */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {canModify && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="p-1 text-muted-foreground/40 hover:text-foreground cursor-grab active:cursor-grabbing rounded hover:bg-muted/60 transition-colors shrink-0"
            title={t("thesisManagement.steps.dragToReorder", "Drag to reorder")}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}

        {/* Sequence number */}
        <div className="w-7 h-7 rounded-lg bg-muted text-foreground/80 flex items-center justify-center font-bold text-xs shrink-0">
          #{index + 1}
        </div>

        {/* Step Name & Type */}
        <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
          <h3 className="font-semibold text-sm text-foreground truncate">
            {step.name}
          </h3>

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeConfig.className}`}
          >
            <TypeIcon className="w-3 h-3" />
            {typeConfig.label}
          </span>

          {step.type === "teacher_approval" && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                approvalRolesText
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
              }`}
              title={
                approvalRolesText ||
                t("thesisManagement.steps.noRolesAssigned", "No roles configured")
              }
            >
              <Users className="w-3 h-3" />
              <span className="max-w-[160px] truncate">
                {approvalRolesText ||
                  t("thesisManagement.steps.noRolesAssigned", "No roles configured")}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Right section: Deadline Badge + Features + Actions */}
      <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-end">
        {/* Deadline Mode Badge */}
        {deadlineBadge && (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${deadlineBadge.className}`}
          >
            <Calendar className="w-3.5 h-3.5" />
            {deadlineBadge.label}
          </span>
        )}

        {/* Prerequisite lock gate */}
        {(step.locked_until_step || step.locked_until_supervisor) && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
            title={
              resolveLockTargetLabel(step, allSteps, t) ||
              t("thesisManagement.steps.tags.prerequisiteGate", "Prerequisite")
            }
          >
            <Lock className="w-3 h-3" />
            <span className="hidden sm:inline max-w-[10rem] truncate">
              {t("thesisManagement.steps.tags.afterStep", "After")}:{" "}
              {resolveLockTargetLabel(step, allSteps, t)}
            </span>
          </span>
        )}

        {/* Student Document Upload tag (if document upload type) */}
        {step.type === "document_upload" && step.student_uploads_document && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
            title={t("thesisManagement.steps.tags.studentUpload", "Student Upload")}
          >
            <Upload className="w-3 h-3" />
            <span className="hidden md:inline">
              {t("thesisManagement.steps.tags.studentUpload", "Student Upload")}
            </span>
          </span>
        )}

        {/* Resources indicator */}
        {Array.isArray(step.resources) && step.resources.length > 0 && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border"
            title={t("thesisManagement.steps.tags.resourcesCount", "{{count}} resource(s)", {
              count: step.resources.length,
            })}
          >
            <LinkIcon className="w-3 h-3 text-primary" />
            <span>{step.resources.length}</span>
          </span>
        )}

        {/* Attachments indicator */}
        {Array.isArray(step.attachments) && step.attachments.length > 0 && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border"
            title={t("thesisManagement.steps.tags.attachmentsCount", "{{count}} file(s)", {
              count: step.attachments.length,
            })}
          >
            <Paperclip className="w-3 h-3 text-primary" />
            <span>{step.attachments.length}</span>
          </span>
        )}

        {/* Edit and Delete Actions */}
        {canModify && (
          <div className="flex items-center gap-0.5 pl-2 border-l border-border/60">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onEdit(step, index)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title={t("common.edit", "Edit Step")}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onDelete(step, index)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              title={t("common.delete", "Remove Step")}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const StepList = ({
  steps = [],
  onReorder,
  onEdit,
  onDelete,
  onAddStep,
  canModify = true,
}) => {
  const { t } = useTranslation();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const itemIds = useMemo(() => {
    return steps.map((s, idx) => s._id || `step-draft-${idx}-${s.name}`);
  }, [steps]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = itemIds.indexOf(active.id);
    const newIndex = itemIds.indexOf(over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newSteps = arrayMove(steps, oldIndex, newIndex);
      onReorder(newSteps);
    }
  };

  if (steps.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground">
          {t("thesisManagement.steps.emptyTitle", "No steps configured yet")}
        </h3>
        {canModify && (
          <Button onClick={onAddStep} className="gap-1.5 mt-2">
            <Plus className="w-4 h-4" />
            {t("thesisManagement.steps.addFirstStep", "Add First Step")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <SortableStepItem
              key={step._id || `step-draft-${index}-${step.name}`}
              step={step}
              index={index}
              allSteps={steps}
              onEdit={onEdit}
              onDelete={onDelete}
              canModify={canModify}
              t={t}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default StepList;
