import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, RotateCcw, Trash2, BadgeCheck } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Button } from "@/components/ui/button";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import StatusBadge from "@/components/StatusBadge";
import AssignModuleDialog from "./AssignModuleDialog";
import MarkModulePaidDialog from "./MarkModulePaidDialog";
import RemoveModuleDialog from "./RemoveModuleDialog";
import { formatTZ } from "@/utils/dateUtils";

const roleBadgeClass = {
  extra:
    "bg-sky-50 text-sky-700 ring-sky-600/10 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-400/20",
  excluded:
    "bg-muted text-muted-foreground ring-border dark:bg-white/5 dark:text-white/50",
  manual:
    "bg-violet-50 text-violet-700 ring-violet-600/10 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-400/20",
};

const getDurationUnitLabel = (durationUnit, t) => {
  const unit = (durationUnit || "years").toLowerCase();
  const label = unit.startsWith("semester")
    ? t("common.semester", "Semester")
    : unit.startsWith("month")
      ? t("common.durationUnits.month", "Month")
      : unit.startsWith("week")
        ? t("common.durationUnits.week", "Week")
        : unit.startsWith("day")
          ? t("common.durationUnits.day", "Day")
          : t("common.durationUnits.year", "Year");
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const AssignedModulesSection = ({
  modules = [],
  applicationId,
  studentId,
  totalYears = 1,
  currentYear = 1,
  durationUnit = "years",
  onReattempt,
  onDone,
}) => {
  const { t } = useTranslation();
  const [assignOpen, setAssignOpen] = useState(false);
  const [markPaidModule, setMarkPaidModule] = useState(null);
  const [removeModule, setRemoveModule] = useState(null);

  const auditLine = (module) => {
    const meta = module.override_meta || {};
    const parts = [];
    if (meta.assigned_by_name) {
      parts.push(
        t(
          "studentManagement.moduleOverride.assignedBy",
          "Assigned by {{name}} · {{date}}",
          {
            name: meta.assigned_by_name,
            date: formatTZ(meta.assigned_at, "DD MMM YYYY") || "-",
          },
        ),
      );
    }
    if (meta.removed_by_name) {
      parts.push(
        t(
          "studentManagement.moduleOverride.removedBy",
          "Removed by {{name}} · {{date}}",
          {
            name: meta.removed_by_name,
            date: formatTZ(meta.removed_at, "DD MMM YYYY") || "-",
          },
        ),
      );
    }
    if (meta.marked_paid_by_name) {
      parts.push(
        t(
          "studentManagement.moduleOverride.markedPaidBy",
          "Marked paid by {{name}} · {{date}}",
          {
            name: meta.marked_paid_by_name,
            date: formatTZ(meta.marked_paid_at, "DD MMM YYYY") || "-",
          },
        ),
      );
    }
    return parts.join(" · ");
  };

  const getRowActions = (m) => {
    const role = m.year_completion_role || "required";
    const actions = [];

    if (m.can_mark_paid) {
      actions.push({
        label: t("studentManagement.moduleOverride.markPaid", "Mark as paid"),
        icon: BadgeCheck,
        onClick: () => setMarkPaidModule(m),
      });
    }

    if (m.can_remove) {
      actions.push({
        label: t("common.remove", "Remove"),
        icon: Trash2,
        className: "text-red-600 focus:text-red-600 dark:text-red-400",
        onClick: () => setRemoveModule(m),
      });
    }

    if (
      (m.status === "failed" || m.status === "completed") &&
      role !== "excluded"
    ) {
      actions.push({
        label: t("yearCompletion.reattempt", "Reattempt"),
        icon: RotateCcw,
        onClick: () =>
          onReattempt?.({
            componentId: m._id,
            systemId: m.system_id,
            name: m.name,
          }),
      });
    }

    return actions;
  };

  return (
    <div className="col-span-12">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-semibold">
          {t("studentManagement.details.assignedModules", "Assigned Modules")}
        </h3>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setAssignOpen(true)}
          disabled={!applicationId}
        >
          <Plus className="h-3.5 w-3.5" />
          {t("studentManagement.moduleOverride.assign", "Assign module")}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">
              {t("studentManagement.details.moduleId", "Module ID")}
            </TableHead>
            <TableHead>
              {t("studentManagement.details.moduleName", "Module Name")}
            </TableHead>
            <TableHead className="w-[120px]">
              {t("studentManagement.table.status", "Status")}
            </TableHead>
            <TableHead className="w-[120px]">
              {t("studentManagement.details.payment", "Payment")}
            </TableHead>
            <TableHead className="w-12 text-right">
              <span className="sr-only">
                {t("common.actions", "Actions")}
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {modules.length > 0 ? (
            modules.map((m) => {
              const role = m.year_completion_role || "required";
              const audit = auditLine(m);
              const actions = getRowActions(m);

              return (
                <TableRow
                  key={m._id}
                  className={
                    role === "excluded" ? "opacity-60 bg-muted/30" : undefined
                  }
                >
                  <TableCell className="align-middle font-mono text-xs text-muted-foreground">
                    {m.uid}
                  </TableCell>
                  <TableCell className="align-middle">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium">{m.name}</span>
                        {m.is_reattempt && (
                          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-indigo-600 ring-1 ring-inset ring-indigo-500/20 dark:text-indigo-300">
                            {t("yearCompletion.reattempt", "Reattempt")}
                          </span>
                        )}
                        {role === "extra" && (
                          <span
                            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ring-1 ring-inset ${roleBadgeClass.extra}`}
                          >
                            {m.counts_for_year != null
                              ? t(
                                  "studentManagement.moduleOverride.extraYear",
                                  "Extra · {{unit}} {{year}}",
                                  {
                                    unit: getDurationUnitLabel(durationUnit, t),
                                    year: m.counts_for_year,
                                  },
                                )
                              : t(
                                  "studentManagement.moduleOverride.extra",
                                  "Extra",
                                )}
                          </span>
                        )}
                        {role === "excluded" && (
                          <span
                            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ring-1 ring-inset ${roleBadgeClass.excluded}`}
                          >
                            {t(
                              "studentManagement.moduleOverride.excluded",
                              "Excluded",
                            )}
                          </span>
                        )}
                        {m.source === "manual" && role !== "extra" && (
                          <span
                            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ring-1 ring-inset ${roleBadgeClass.manual}`}
                          >
                            {t(
                              "studentManagement.moduleOverride.manual",
                              "Manual",
                            )}
                          </span>
                        )}
                      </div>
                      {audit ? (
                        <span className="truncate text-xs text-muted-foreground">
                          {audit}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="align-middle">
                    <StatusBadge status={m.status} />
                  </TableCell>
                  <TableCell className="align-middle">
                    <StatusBadge status={m.payment_status || "unpaid"} />
                  </TableCell>
                  <TableCell
                    className="align-middle text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <RowActionMenu actions={actions} />
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-8 text-center text-muted-foreground"
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

      <AssignModuleDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        applicationId={applicationId}
        studentId={studentId}
        totalYears={totalYears}
        defaultYear={currentYear}
        durationUnit={durationUnit}
        onDone={onDone}
      />
      <MarkModulePaidDialog
        open={!!markPaidModule}
        onOpenChange={(open) => !open && setMarkPaidModule(null)}
        applicationId={applicationId}
        module={markPaidModule}
        onDone={onDone}
      />
      <RemoveModuleDialog
        open={!!removeModule}
        onOpenChange={(open) => !open && setRemoveModule(null)}
        applicationId={applicationId}
        module={removeModule}
        onDone={onDone}
      />
    </div>
  );
};

export default AssignedModulesSection;
