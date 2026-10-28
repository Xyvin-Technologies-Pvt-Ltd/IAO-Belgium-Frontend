import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  Save,
  RotateCcw,
  AlertCircle,
  Clock,
  Layers,
  Compass,
  ArrowRight,
  Info,
} from "lucide-react";
import moment from "moment";
import { toast } from "sonner";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { useCanModify } from "@/hooks/useCanModify";
import { LoadingState, ErrorMessage } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useGetThesisById,
  useGetThesisDeadlines,
  useSaveThesisDeadlines,
} from "@/store/useThesisStore";

const ThesisDeadlines = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
    data: deadlinesResponse,
    isLoading: isDeadlinesLoading,
    error: deadlinesError,
    refetch: refetchDeadlines,
  } = useGetThesisDeadlines(id);

  const saveDeadlinesMutation = useSaveThesisDeadlines();

  const thesis = thesisResponse?.data;
  const matrixData = deadlinesResponse?.data;
  const steps = useMemo(() => matrixData?.steps || [], [matrixData?.steps]);
  const trajectories = useMemo(
    () => matrixData?.trajectories || [],
    [matrixData?.trajectories]
  );
  const serverDeadlines = useMemo(
    () => matrixData?.deadlines || [],
    [matrixData?.deadlines]
  );

  // Local draft dates map: key `${trajectoryId}_${stepId}` -> date string (YYYY-MM-DD)
  const [draftDates, setDraftDates] = useState({});
  const [missingKeys, setMissingKeys] = useState(new Set());

  // Compute server initial map
  const serverDatesMap = useMemo(() => {
    const map = {};
    serverDeadlines.forEach((d) => {
      const trajId = d.trajectory?._id || d.trajectory;
      const stepId = d.step?._id || d.step;
      if (trajId && stepId && d.deadline_date) {
        map[`${trajId}_${stepId}`] = moment(d.deadline_date).format("YYYY-MM-DD");
      }
    });
    return map;
  }, [serverDeadlines]);

  // Synchronize draft when server dates load
  useEffect(() => {
    setDraftDates(serverDatesMap);
    setMissingKeys(new Set());
  }, [serverDatesMap]);

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
          label: t("thesisManagement.deadlines.title", "Deadlines"),
          path: `/admin/thesis/${id}/deadlines`,
          navigable: false,
        },
      ]);
    }
    return () => {
      updateBreadcrumbs([]);
    };
  }, [thesis, id, updateBreadcrumbs, t]);

  // Detect dirty state
  const isDirty = useMemo(() => {
    const draftKeys = Object.keys(draftDates).filter((k) => !!draftDates[k]);
    const serverKeys = Object.keys(serverDatesMap).filter(
      (k) => !!serverDatesMap[k]
    );

    if (draftKeys.length !== serverKeys.length) return true;

    for (const key of draftKeys) {
      if (draftDates[key] !== serverDatesMap[key]) return true;
    }
    return false;
  }, [draftDates, serverDatesMap]);

  const handleCellChange = (trajId, stepId, value) => {
    const key = `${trajId}_${stepId}`;
    setDraftDates((prev) => ({
      ...prev,
      [key]: value,
    }));

    if (missingKeys.has(key) && value) {
      setMissingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const handleResetDraft = () => {
    setDraftDates(serverDatesMap);
    setMissingKeys(new Set());
  };

  const handleSaveChanges = async () => {
    if (!id || !canModify) return;

    // Validate: every required step must have a date for EVERY trajectory
    const newMissing = new Set();
    const missingStepNames = new Set();

    for (const step of steps) {
      if (step.deadline_mode === "required") {
        for (const traj of trajectories) {
          const key = `${traj._id}_${step._id}`;
          const dateVal = draftDates[key];
          if (!dateVal || dateVal.trim() === "") {
            newMissing.add(key);
            missingStepNames.add(step.name);
          }
        }
      }
    }

    if (newMissing.size > 0) {
      setMissingKeys(newMissing);
      const namesList = Array.from(missingStepNames).join(", ");
      toast.error(
        t(
          "thesisManagement.deadlines.requiredValidationFailed",
          "Every trajectory must have a deadline date for required steps: {{steps}}",
          { steps: namesList }
        )
      );
      return;
    }

    // Build payload array
    const payload = [];
    trajectories.forEach((traj) => {
      steps.forEach((step) => {
        const key = `${traj._id}_${step._id}`;
        const dateStr = draftDates[key];
        payload.push({
          trajectory: traj._id,
          step: step._id,
          deadline_date:
            step.deadline_mode === "none"
              ? null
              : dateStr && dateStr.trim() !== ""
              ? new Date(dateStr).toISOString()
              : null,
        });
      });
    });

    try {
      await saveDeadlinesMutation.mutateAsync({
        thesisId: id,
        deadlines: payload,
      });
      setMissingKeys(new Set());
    } catch {
      // Error handled by store
    }
  };

  if (isThesisLoading || isDeadlinesLoading) {
    return (
      <LoadingState
        text={t("thesisManagement.deadlines.loading", "Loading thesis deadlines...")}
        fullHeight
      />
    );
  }

  if (thesisError || deadlinesError) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={
            thesisError?.message ||
            deadlinesError?.message ||
            t("thesisManagement.deadlines.loadFailed", "Failed to load thesis deadlines")
          }
          onRetry={() => {
            refetchThesis();
            refetchDeadlines();
          }}
          variant="card"
        />
      </div>
    );
  }

  if (!thesis) return null;

  return (
    <div className="space-y-6 mt-4">
      {/* Header Banner */}
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
                  disabled={saveDeadlinesMutation.isPending}
                  className="gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t("thesisManagement.deadlines.discard", "Discard")}
                </Button>
              )}

              <Button
                size="sm"
                onClick={handleSaveChanges}
                disabled={!isDirty || saveDeadlinesMutation.isPending}
                className="gap-1.5"
              >
                <Save className="w-4 h-4" />
                {saveDeadlinesMutation.isPending
                  ? t("common.saving", "Saving...")
                  : t("thesisManagement.deadlines.saveChanges", "Save Changes")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Empty State: No steps */}
      {steps.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
            <Layers className="w-6 h-6 opacity-60" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              {t("thesisManagement.deadlines.noStepsTitle", "No Thesis Steps Found")}
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {t(
                "thesisManagement.deadlines.noStepsDesc",
                "Thesis steps must be created before assigning dates per trajectory."
              )}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() =>
              navigate({
                to: "/admin/thesis/$id/steps",
                params: { id },
              })
            }
            className="gap-1.5"
          >
            {t("thesisManagement.deadlines.configureSteps", "Configure Steps")}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      ) : trajectories.length === 0 ? (
        /* Empty State: No trajectories */
        <div className="bg-card border border-border rounded-xl p-10 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
            <Compass className="w-6 h-6 opacity-60" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              {t(
                "thesisManagement.deadlines.noTrajectoriesTitle",
                "No Trajectories Found"
              )}
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {t(
                "thesisManagement.deadlines.noTrajectoriesDesc",
                "Please add at least one trajectory on the thesis details page to configure cohort deadlines."
              )}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() =>
              navigate({
                to: "/admin/thesis/$id",
                params: { id },
              })
            }
            className="gap-1.5"
          >
            {t("thesisManagement.deadlines.goToDetails", "Go to Thesis Details")}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        /* Deadlines per trajectory Matrix Table */
        <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-border">
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              {t(
                "thesisManagement.deadlines.tableTitle",
                "Deadlines per trajectory"
              )}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(
                "thesisManagement.deadlines.tableSubtitle",
                "Dates follow each step's deadline behavior. Changing a date in one column does not change another."
              )}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-xs uppercase font-semibold text-muted-foreground">
                  <th className="p-4 min-w-[260px] sticky left-0 bg-muted/40 z-10">
                    {t("thesisManagement.deadlines.stepName", "Step Name")}
                  </th>
                  {trajectories.map((traj) => (
                    <th
                      key={traj._id}
                      className="p-4 min-w-[200px] text-foreground font-semibold"
                    >
                      <span className="text-sm font-bold truncate block" title={traj.name}>
                        {traj.name}
                      </span>
                    </th>
                  ))}
                </tr>

                {/* Trajectory Start Date Row */}
                <tr className="bg-muted/15 border-b border-border/80 text-xs">
                  <td className="p-4 font-semibold text-foreground sticky left-0 bg-muted/15 z-10 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    <span>
                      {t("thesisManagement.deadlines.trajectoryStartDate", "Trajectory Start Date")}
                    </span>
                  </td>
                  {trajectories.map((traj) => (
                    <td key={traj._id} className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
                        {moment(traj.start_date).format("DD/MM/YYYY")}
                      </span>
                    </td>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {steps.map((step, idx) => {
                  const isRequired = step.deadline_mode === "required";
                  const isOptional = step.deadline_mode === "optional";
                  const isEvent = step.deadline_mode === "event_date";
                  const isNone = !step.deadline_mode || step.deadline_mode === "none";

                  return (
                    <tr
                      key={step._id}
                      className="hover:bg-muted/10 transition-colors"
                    >
                      {/* Step Name & Badge (Sticky left) */}
                      <td className="p-4 sticky left-0 bg-card z-10 border-r border-border/40">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-muted-foreground">
                              #{idx + 1}
                            </span>
                            <span className="font-medium text-foreground text-sm">
                              {step.name}
                            </span>
                          </div>

                          <div>
                            {isRequired && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                {t("thesisManagement.steps.form.deadlineRequired", "Deadline Required")}
                              </span>
                            )}
                            {isOptional && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                                {t("thesisManagement.steps.form.deadlineOptional", "Deadline Optional")}
                              </span>
                            )}
                            {isEvent && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                {t("thesisManagement.steps.form.eventDate", "Event Date")}
                              </span>
                            )}
                            {isNone && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-normal text-muted-foreground bg-muted/60">
                                {t("thesisManagement.steps.form.noDeadline", "No deadline")}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Date Cells per Trajectory */}
                      {trajectories.map((traj) => {
                        const cellKey = `${traj._id}_${step._id}`;
                        const cellValue = draftDates[cellKey] || "";
                        const isMissing = missingKeys.has(cellKey);

                        if (isNone) {
                          return (
                            <td
                              key={traj._id}
                              className="p-4 bg-muted/20 text-muted-foreground/60 italic text-xs select-none"
                            >
                              —
                            </td>
                          );
                        }

                        return (
                          <td key={traj._id} className="p-3">
                            <div className="space-y-1">
                              <Input
                                type="date"
                                value={cellValue}
                                disabled={!canModify || saveDeadlinesMutation.isPending}
                                onChange={(e) =>
                                  handleCellChange(
                                    traj._id,
                                    step._id,
                                    e.target.value
                                  )
                                }
                                className={`text-xs h-9 ${
                                  isMissing
                                    ? "border-destructive ring-1 ring-destructive/40 bg-destructive/5"
                                    : ""
                                }`}
                              />
                              {isMissing && (
                                <p className="text-[11px] text-destructive flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 shrink-0" />
                                  {t("common.required", "Required")}
                                </p>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThesisDeadlines;
