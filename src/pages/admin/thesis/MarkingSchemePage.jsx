import { useEffect, useMemo, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Plus,
  Save,
  Trash2,
  ChevronDown,
  ChevronUp,
  Award,
  Users,
  BookOpen,
  Layers,
  MessageSquare,
  Sliders,
  RotateCcw,
  Loader2,
} from "lucide-react";

import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { useCanModify } from "@/hooks/useCanModify";
import { useThesisAdminKind } from "@/hooks/useThesisAdminKind";
import { useGetThesisById } from "@/store/useThesisStore";
import { getMarkingConfig, saveMarkingConfig } from "@/api/thesisApi";
import { LoadingState, ErrorMessage } from "@/components/common";
import DashboardCard from "@/components/admin/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEFAULT_FINAL_PERCENTAGE_EQUATION =
  "((supervisor_score / supervisor_max * 100) + (reader_score / reader_max * 100)) / 2";

const blankCriterion = (maxScore = 0) => ({
  name: "",
  max_score: maxScore,
  weight: "",
  supervisor_percent: "",
  reader_percent: "",
  filled_by: "both",
  guidance: "",
  comment_required: false,
});

const blankSection = (maxScore = 0) => ({
  name: "",
  criteria: [blankCriterion(maxScore)],
});

const sumNumber = (values) =>
  values.reduce((total, value) => total + (Number(value) || 0), 0);

const schemeTotals = (sections) => {
  const criteria = (sections || []).flatMap((section) => section.criteria || []);
  const readerCriteria = criteria.filter(
    (criterion) => criterion.filled_by !== "supervisor"
  );
  return {
    supervisor_total_score: sumNumber(
      criteria.map((criterion) => criterion.max_score)
    ),
    reader_total_score: sumNumber(
      readerCriteria.map((criterion) => criterion.max_score)
    ),
    supervisor_total_weight: sumNumber(
      criteria.map((criterion) => criterion.weight)
    ),
    reader_total_weight: sumNumber(
      readerCriteria.map((criterion) => criterion.weight)
    ),
  };
};

const positiveWeight = (value) => {
  const weight = Number(value);
  if (!Number.isFinite(weight) || weight <= 0) return 0;
  return weight;
};

const roundPercent = (value) => Math.round(Number(value) * 100) / 100;

const weightPercentages = (weights) => {
  const amounts = weights.map(positiveWeight);
  const total = amounts.reduce((sum, weight) => sum + weight, 0);
  if (!(total > 0)) return amounts.map(() => null);
  const rounded = amounts.map((weight) => roundPercent((weight / total) * 100));
  let last = -1;
  amounts.forEach((weight, index) => {
    if (weight > 0) last = index;
  });
  if (last >= 0) {
    const others = rounded.reduce(
      (sum, value, index) => (index === last ? sum : sum + value),
      0
    );
    rounded[last] = roundPercent(100 - others);
  }
  return rounded;
};

const criterionWeightPercents = (sections) => {
  const rows = [];
  (sections || []).forEach((section, sectionIndex) => {
    (section.criteria || []).forEach((criterion, criterionIndex) => {
      rows.push({
        key: `${sectionIndex}-${criterionIndex}`,
        weight: criterion.weight,
        filled_by: criterion.filled_by,
      });
    });
  });
  const supervisor = weightPercentages(rows.map((row) => row.weight));
  const readerRows = rows
    .map((row, index) => ({ row, index }))
    .filter((item) => item.row.filled_by !== "supervisor");
  const reader = weightPercentages(readerRows.map((item) => item.row.weight));
  const result = new Map();
  rows.forEach((row, index) => {
    result.set(row.key, { supervisor: supervisor[index], reader: null });
  });
  readerRows.forEach((item, position) => {
    result.set(item.row.key, {
      supervisor: supervisor[item.index],
      reader: reader[position],
    });
  });
  return result;
};

const formatWeightPercent = (value) => (value == null ? "—" : String(value));

const MarkingSchemePage = () => {
  const { t } = useTranslation();
  const params = useParams({ strict: false });
  const id = params.id;
  const { updateBreadcrumbs } = useBreadcrumb();
  const { type: thesisType, basePath, label: kindLabel } = useThesisAdminKind();
  const canModify = useCanModify(basePath);

  const thesisQuery = useGetThesisById(id, { type: thesisType });
  const thesis = thesisQuery.data?.data;

  const configQuery = useQuery({
    queryKey: ["thesis-marking-config", id, thesisType],
    queryFn: () => getMarkingConfig(id),
    enabled: Boolean(id),
  });

  const serverConfig = configQuery.data?.data;

  const initialForm = useMemo(() => {
    if (!serverConfig) return null;

    return {
      weights_enabled: Boolean(serverConfig.weights_enabled),
      supervisor_total_weight: serverConfig.supervisor_total_weight ?? "",
      reader_total_weight: serverConfig.reader_total_weight ?? "",
      supervisor_total_score: serverConfig.supervisor_total_score ?? "",
      reader_total_score: serverConfig.reader_total_score ?? "",
      pass_percentage: serverConfig.pass_percentage ?? 50,
      final_percentage_equation:
        serverConfig.final_percentage_equation ||
        DEFAULT_FINAL_PERCENTAGE_EQUATION,
      final_feedback: {
        enabled: Boolean(serverConfig.final_feedback?.enabled),
        title: serverConfig.final_feedback?.title || "Final feedback",
        instructions: serverConfig.final_feedback?.instructions || "",
        required: Boolean(serverConfig.final_feedback?.required),
      },
      sections: (serverConfig.sections || []).map((section) => ({
        _id: section._id,
        name: section.name || "",
        criteria: (section.criteria || []).map((criterion) => ({
          _id: criterion._id,
          name: criterion.name || "",
          max_score: serverConfig.weights_enabled
            ? 10
            : criterion.max_score ?? 0,
          weight: criterion.weight ?? "",
          supervisor_percent: criterion.supervisor_percent ?? "",
          reader_percent: criterion.reader_percent ?? "",
          filled_by: criterion.filled_by || "both",
          guidance: criterion.guidance || "",
          comment_required: Boolean(criterion.comment_required),
        })),
      })),
    };
  }, [serverConfig]);

  const [draftForm, setDraftForm] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState(() => new Set());

  const form = draftForm ?? initialForm;

  useEffect(() => {
    if (!thesis) return;
    updateBreadcrumbs([
      { label: kindLabel, path: basePath, navigable: true },
      { label: thesis.name, path: `${basePath}/${id}`, navigable: true },
      {
        label: t("thesisManagement.menu.markingScheme", "Marking Scheme"),
        path: "",
        navigable: false,
      },
    ]);
  }, [thesis, kindLabel, basePath, id, t, updateBreadcrumbs]);

  const totals = useMemo(() => schemeTotals(form?.sections), [form?.sections]);
  const masterWeightPercents = useMemo(() => {
    if (thesisType !== "master") return null;
    return criterionWeightPercents(form?.sections);
  }, [thesisType, form?.sections]);

  const isDirty = useMemo(() => {
    if (!draftForm || !initialForm) return false;
    return JSON.stringify(initialForm) !== JSON.stringify(draftForm);
  }, [initialForm, draftForm]);

  const updateForm = (updater) => {
    setDraftForm((prev) => {
      const base = prev ?? initialForm;
      return typeof updater === "function"
        ? updater(base)
        : { ...base, ...updater };
    });
  };

  const handleDiscard = () => {
    setDraftForm(null);
  };

  const saveMutation = useMutation({
    mutationFn: () => saveMarkingConfig(id, { ...form, ...totals }),
    onSuccess: () => {
      toast.success(
        t("thesisManagement.marking.saved", "Marking scheme saved")
      );
      setDraftForm(null);
      configQuery.refetch();
    },
    onError: (error) => {
      toast.error(
        error?.message ||
          t(
            "thesisManagement.marking.saveError",
            "Could not save the marking scheme"
          )
      );
    },
  });

  const toggleCollapse = (idx) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const updateSection = (index, patch) => {
    updateForm((current) => {
      const sections = current.sections.map((section, i) =>
        i === index ? { ...section, ...patch } : section
      );
      return { ...current, sections };
    });
  };

  const updateCriterion = (sectionIndex, criterionIndex, patch) => {
    updateForm((current) => {
      const sections = current.sections.map((section, i) => {
        if (i !== sectionIndex) return section;
        return {
          ...section,
          criteria: section.criteria.map((criterion, j) =>
            j === criterionIndex ? { ...criterion, ...patch } : criterion
          ),
        };
      });
      return { ...current, sections };
    });
  };

  if (thesisQuery.isLoading || configQuery.isLoading || !form) {
    return (
      <LoadingState
        text={t(
          "thesisManagement.marking.loading",
          "Loading marking scheme..."
        )}
        fullHeight
      />
    );
  }

  if (thesisQuery.error || configQuery.error) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={
            thesisQuery.error?.message ||
            configQuery.error?.message ||
            t(
              "thesisManagement.marking.loadFailed",
              "Failed to load marking scheme"
            )
          }
          onRetry={() => {
            thesisQuery.refetch();
            configQuery.refetch();
          }}
          variant="card"
        />
      </div>
    );
  }

  if (!thesis) return null;

  return (
    <div className="space-y-6 mt-4">
      {/* 1. Header Banner & Action Bar */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              {thesis.uid && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ff8904]/10 text-[#ff8904] border border-[#ff8904]/20">
                  {thesis.uid}
                </span>
              )}
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                {thesis.name}
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted text-foreground border border-border">
                {t("thesisManagement.menu.markingScheme", "Marking Scheme")}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {kindLabel} ·{" "}
              {t(
                "thesisManagement.marking.thesisHint",
                "This marking scheme applies only to this thesis."
              )}
            </p>
          </div>

          {canModify && (
            <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
              {isDirty && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDiscard}
                  disabled={saveMutation.isPending}
                  className="gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t("common.discard", "Discard")}
                </Button>
              )}
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="gap-2"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {t("common.save", "Save Changes")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Overview Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title={t(
            "thesisManagement.marking.passPercentage",
            "Pass Percentage"
          )}
          value={`${form.pass_percentage ?? 50}%`}
          subtitle={t(
            "thesisManagement.marking.passThreshold",
            "Minimum score required to pass"
          )}
          icon={Award}
        />

        <DashboardCard
          title={
            form.weights_enabled
              ? t(
                  "thesisManagement.marking.supervisorWeight",
                  "Supervisor Weight"
                )
              : t(
                  "thesisManagement.marking.supervisorTotalMarks",
                  "Supervisor Total Marks"
                )
          }
          value={
            form.weights_enabled
              ? `${totals.supervisor_total_weight}%`
              : `${totals.supervisor_total_score} pts`
          }
          subtitle={
            form.weights_enabled
              ? t(
                  "thesisManagement.marking.weightFromCriteria",
                  "Sum of supervisor weights"
                )
              : t(
                  "thesisManagement.marking.marksFromCriteria",
                  "Sum of criteria max marks"
                )
          }
          icon={Users}
        />

        <DashboardCard
          title={
            form.weights_enabled
              ? t("thesisManagement.marking.readerWeight", "Reader Weight")
              : t(
                  "thesisManagement.marking.readerTotalMarks",
                  "Reader Total Marks"
                )
          }
          value={
            form.weights_enabled
              ? `${totals.reader_total_weight}%`
              : `${totals.reader_total_score} pts`
          }
          subtitle={
            form.weights_enabled
              ? t(
                  "thesisManagement.marking.weightFromCriteria",
                  "Sum of reader weights"
                )
              : t(
                  "thesisManagement.marking.marksFromCriteria",
                  "Sum of reader max marks"
                )
          }
          icon={BookOpen}
        />

        <DashboardCard
          title={t(
            "thesisManagement.marking.structureSummary",
            "Sections & Criteria"
          )}
          value={`${form.sections.length} ${
            form.sections.length === 1
              ? t("common.section", "Section")
              : t("common.sections", "Sections")
          }`}
          subtitle={`${form.sections.reduce(
            (acc, s) => acc + (s.criteria?.length || 0),
            0
          )} ${t("thesisManagement.marking.criteriaTotal", "total criteria")}`}
          icon={Layers}
        />
      </div>

      {/* 3. General Scheme Settings */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              {t(
                "thesisManagement.marking.generalSettings",
                "General Scheme Settings"
              )}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Pass Percentage */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">
              {t(
                "thesisManagement.marking.passPercentage",
                "Pass percentage (%)"
              )}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              min="0"
              max="100"
              disabled={!canModify}
              value={form.pass_percentage}
              placeholder="50"
              onChange={(event) =>
                updateForm({ pass_percentage: event.target.value })
              }
            />
            <p className="text-[11px] text-muted-foreground">
              {t(
                "thesisManagement.marking.passPercentageHint",
                "Minimum overall percentage required for a student to pass this thesis."
              )}
            </p>
          </div>

          {/* Weights switch panel */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/20">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">
                {t("thesisManagement.marking.weights", "Weighting System")}
              </p>
              <p className="text-xs text-muted-foreground">
                {form.weights_enabled
                  ? t(
                      "thesisManagement.marking.weightsEnabledHint",
                      "Scores are calculated using criterion weights and evaluator percentages."
                    )
                  : t(
                      "thesisManagement.marking.weightsDisabledHint",
                      "Scores are calculated as a simple sum of maximum marks."
                    )}
              </p>
            </div>
            <Switch
              checked={form.weights_enabled}
              disabled={!canModify}
              onCheckedChange={(checked) =>
                updateForm((current) => ({
                  ...current,
                  weights_enabled: checked,
                  sections: checked
                    ? (current.sections || []).map((section) => ({
                        ...section,
                        criteria: (section.criteria || []).map((criterion) => ({
                          ...criterion,
                          max_score: 10,
                        })),
                      }))
                    : current.sections,
                }))
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold text-foreground">
            {t(
              "thesisManagement.marking.finalPercentageEquation",
              "Final percentage equation"
            )}
          </Label>
          <Textarea
            rows={3}
            disabled={!canModify}
            value={form.final_percentage_equation || ""}
            className="font-mono text-xs"
            onChange={(event) =>
              updateForm({ final_percentage_equation: event.target.value })
            }
          />
          <p className="text-[11px] text-muted-foreground">
            {t(
              "thesisManagement.marking.finalPercentageEquationHint",
              "Use supervisor_score, supervisor_max, reader_score, reader_max, additional_reader_score, and additional_reader_max."
            )}
          </p>
        </div>
      </div>

      {/* 4. Final Evaluator Feedback Card */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {t(
                  "thesisManagement.marking.finalFeedback",
                  "Final Evaluator Feedback"
                )}
              </h2>
            </div>
          </div>
          <Switch
            checked={form.final_feedback.enabled}
            disabled={!canModify}
            onCheckedChange={(checked) =>
              updateForm((current) => ({
                ...current,
                final_feedback: {
                  ...current.final_feedback,
                  enabled: checked,
                },
              }))
            }
          />
        </div>

        {form.final_feedback.enabled && (
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold text-foreground">
                  {t(
                    "thesisManagement.marking.feedbackTitle",
                    "Feedback Section Title"
                  )}
                </Label>
                <Input
                  disabled={!canModify}
                  value={form.final_feedback.title}
                  placeholder={t(
                    "thesisManagement.marking.feedbackTitlePlaceholder",
                    "e.g. Final Evaluator Assessment"
                  )}
                  onChange={(event) =>
                    updateForm((current) => ({
                      ...current,
                      final_feedback: {
                        ...current.final_feedback,
                        title: event.target.value,
                      },
                    }))
                  }
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold text-foreground">
                  {t(
                    "thesisManagement.marking.feedbackInstructions",
                    "Instructions for Evaluators"
                  )}
                </Label>
                <Textarea
                  rows={2}
                  disabled={!canModify}
                  value={form.final_feedback.instructions}
                  placeholder={t(
                    "thesisManagement.marking.feedbackInstructionsPlaceholder",
                    "Provide guidance on what teachers should address in their final feedback..."
                  )}
                  onChange={(event) =>
                    updateForm((current) => ({
                      ...current,
                      final_feedback: {
                        ...current.final_feedback,
                        instructions: event.target.value,
                      },
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="final-feedback-required"
                disabled={!canModify}
                checked={form.final_feedback.required}
                onCheckedChange={(checked) =>
                  updateForm((current) => ({
                    ...current,
                    final_feedback: {
                      ...current.final_feedback,
                      required: Boolean(checked),
                    },
                  }))
                }
              />
              <Label
                htmlFor="final-feedback-required"
                className="text-xs font-medium cursor-pointer text-foreground select-none"
              >
                {t(
                  "thesisManagement.marking.feedbackRequired",
                  "Feedback is mandatory before submitting evaluation"
                )}
              </Label>
            </div>
          </div>
        )}
      </div>

      {/* 5. Evaluation Sections & Criteria Builder */}
      <div className="space-y-5">
        {/* Sections Header with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {t(
                  "thesisManagement.marking.sectionsTitle",
                  "Evaluation Sections & Criteria"
                )}
              </h2>
              <p className="text-xs text-muted-foreground">
                {form.sections.length}{" "}
                {form.sections.length === 1
                  ? t("common.section", "section")
                  : t("common.sections", "sections")}{" "}
                ·{" "}
                {form.sections.reduce(
                  (acc, s) => acc + (s.criteria?.length || 0),
                  0
                )}{" "}
                {t("thesisManagement.marking.criteriaTotal", "total criteria")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canModify && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const newSec = blankSection(form.weights_enabled ? 10 : 0);
                  updateForm((current) => ({
                    ...current,
                    sections: [...current.sections, newSec],
                  }));
                }}
                className="gap-1.5 text-xs h-8"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("thesisManagement.marking.addSection", "Add Section")}
              </Button>
            )}
          </div>
        </div>

        {/* Section Cards */}
        {form.sections.map((section, sectionIndex) => {
          const isCollapsed = collapsedSections.has(sectionIndex);
          const sectionTotalScore = sumNumber(
            (section.criteria || []).map((c) => c.max_score)
          );
          const sectionTotalWeight = sumNumber(
            (section.criteria || []).map((c) => c.weight)
          );

          return (
            <div
              key={section._id || sectionIndex}
              className="bg-card border border-border rounded-xl shadow-xs overflow-hidden transition-all"
            >
              {/* Section Header Bar */}
              <div className="p-4 sm:p-5 bg-muted/25 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#ff8904]/10 text-[#ff8904] border border-[#ff8904]/20 shrink-0">
                    {t(
                      "thesisManagement.marking.sectionNumber",
                      `Section ${sectionIndex + 1}`
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <Input
                      disabled={!canModify}
                      value={section.name}
                      placeholder={t(
                        "thesisManagement.marking.sectionPlaceholder",
                        "Section title (e.g. Dissertation Quality & Methodology)"
                      )}
                      className="font-medium bg-background text-sm h-9"
                      onChange={(event) =>
                        updateSection(sectionIndex, {
                          name: event.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                  {/* Stat Pill */}
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-background border border-border text-muted-foreground">
                    {(section.criteria || []).length}{" "}
                    {t("thesisManagement.marking.criteria", "criteria")} ·{" "}
                    {sectionTotalScore}{" "}
                    {t("thesisManagement.marking.marks", "marks")}
                    {form.weights_enabled && ` · ${sectionTotalWeight}%`}
                  </span>

                  {/* Reorder Buttons */}
                  {canModify && (
                    <div className="flex items-center gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                        disabled={sectionIndex === 0}
                        onClick={() => {
                          updateForm((current) => {
                            const sections = [...current.sections];
                            const tmp = sections[sectionIndex];
                            sections[sectionIndex] = sections[sectionIndex - 1];
                            sections[sectionIndex - 1] = tmp;
                            return { ...current, sections };
                          });
                        }}
                        title={t("common.moveUp", "Move section up")}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                        disabled={sectionIndex === form.sections.length - 1}
                        onClick={() => {
                          updateForm((current) => {
                            const sections = [...current.sections];
                            const tmp = sections[sectionIndex];
                            sections[sectionIndex] = sections[sectionIndex + 1];
                            sections[sectionIndex + 1] = tmp;
                            return { ...current, sections };
                          });
                        }}
                        title={t("common.moveDown", "Move section down")}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 cursor-pointer"
                        disabled={form.sections.length <= 1}
                        onClick={() =>
                          updateForm((current) => ({
                            ...current,
                            sections: current.sections.filter(
                              (_, index) => index !== sectionIndex
                            ),
                          }))
                        }
                        title={t("common.delete", "Delete section")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {/* Collapse / Expand Toggle */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={() => toggleCollapse(sectionIndex)}
                    title={
                      isCollapsed
                        ? t("common.expand", "Expand")
                        : t("common.collapse", "Collapse")
                    }
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isCollapsed ? "-rotate-90" : ""
                      }`}
                    />
                  </Button>
                </div>
              </div>

              {/* Section Body */}
              {!isCollapsed && (
                <div className="p-5 space-y-4">
                  {(section.criteria || []).length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg border-border bg-card/40 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {t(
                          "thesisManagement.marking.noCriteria",
                          "No criteria added to this section yet."
                        )}
                      </p>
                      {canModify && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateSection(sectionIndex, {
                              criteria: [...section.criteria, blankCriterion(form.weights_enabled ? 10 : 0)],
                            })
                          }
                          className="gap-1.5 text-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {t(
                            "thesisManagement.marking.addCriterion",
                            "Add Criterion"
                          )}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {section.criteria.map((criterion, criterionIndex) => (
                        <div
                          key={criterion._id || criterionIndex}
                          className="rounded-xl border border-border bg-muted/15 dark:bg-muted/10 p-4 sm:p-5 space-y-4 hover:border-primary/40 transition-colors shadow-2xs"
                        >
                          {/* Criterion Top Bar */}
                          <div className="flex items-center justify-between pb-3 border-b border-border/60 gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="inline-flex items-center justify-center min-w-[28px] h-5 px-1.5 rounded text-[11px] font-bold bg-primary/10 text-primary border border-primary/25 shrink-0">
                                C{criterionIndex + 1}
                              </span>
                              <span className="text-xs font-semibold text-foreground truncate">
                                {criterion.name ||
                                  t(
                                    "thesisManagement.marking.untitledCriterion",
                                    "Untitled Criterion"
                                  )}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              {/* Comment Required Switch */}
                              <div className="flex items-center gap-2">
                                <Switch
                                  id={`comment-req-${sectionIndex}-${criterionIndex}`}
                                  disabled={!canModify}
                                  checked={criterion.comment_required}
                                  onCheckedChange={(checked) =>
                                    updateCriterion(
                                      sectionIndex,
                                      criterionIndex,
                                      {
                                        comment_required: checked,
                                      }
                                    )
                                  }
                                />
                                <Label
                                  htmlFor={`comment-req-${sectionIndex}-${criterionIndex}`}
                                  className="text-xs font-medium cursor-pointer text-muted-foreground select-none"
                                >
                                  {t(
                                    "thesisManagement.marking.commentRequired",
                                    "Comment required"
                                  )}
                                </Label>
                              </div>

                              {canModify && (
                                <>
                                  <span className="h-3.5 w-px bg-border/80 shrink-0" />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:bg-destructive/10 cursor-pointer"
                                    onClick={() =>
                                      updateSection(sectionIndex, {
                                        criteria: section.criteria.filter(
                                          (_, index) => index !== criterionIndex
                                        ),
                                      })
                                    }
                                    title={t(
                                      "common.delete",
                                      "Delete criterion"
                                    )}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Form Fields Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                            {/* Criterion Name: 6 cols */}
                            <div className="sm:col-span-6 space-y-1.5">
                              <Label className="text-xs font-medium text-foreground">
                                {t(
                                  "thesisManagement.marking.criterion",
                                  "Criterion Name"
                                )}{" "}
                                <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                disabled={!canModify}
                                value={criterion.name}
                                placeholder={t(
                                  "thesisManagement.marking.criterionPlaceholder",
                                  "e.g. Critical Thinking & Originality"
                                )}
                                onChange={(event) =>
                                  updateCriterion(
                                    sectionIndex,
                                    criterionIndex,
                                    {
                                      name: event.target.value,
                                    }
                                  )
                                }
                              />
                            </div>

                            {/* Max Score: 3 cols */}
                            <div className="sm:col-span-3 space-y-1.5">
                              <Label className="text-xs font-medium text-foreground">
                                {t(
                                  "thesisManagement.marking.maxScore",
                                  "Max Score"
                                )}{" "}
                                <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                type="number"
                                min="0"
                                disabled={!canModify || form.weights_enabled}
                                value={form.weights_enabled ? 10 : criterion.max_score}
                                onChange={(event) =>
                                  updateCriterion(
                                    sectionIndex,
                                    criterionIndex,
                                    {
                                      max_score:
                                        Number(event.target.value) || 0,
                                    }
                                  )
                                }
                              />
                            </div>

                            {/* Filled By: 3 cols using ui/select */}
                            <div className="sm:col-span-3 space-y-1.5">
                              <Label className="text-xs font-medium text-foreground">
                                {t(
                                  "thesisManagement.marking.filledBy",
                                  "Filled by"
                                )}
                              </Label>
                              <Select
                                disabled={!canModify}
                                value={criterion.filled_by || "both"}
                                onValueChange={(val) =>
                                  updateCriterion(
                                    sectionIndex,
                                    criterionIndex,
                                    {
                                      filled_by: val,
                                    }
                                  )
                                }
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="both">
                                    {t(
                                      "thesisManagement.marking.both",
                                      "Supervisor & Reader"
                                    )}
                                  </SelectItem>
                                  <SelectItem value="supervisor">
                                    {t(
                                      "thesisManagement.marking.supervisorOnly",
                                      "Supervisor only"
                                    )}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Weighting Fields (if weights_enabled) */}
                            {form.weights_enabled && (
                              <>
                                <div className="sm:col-span-4 space-y-1.5">
                                  <Label className="text-xs font-medium text-foreground">
                                    {t(
                                      "thesisManagement.marking.weight",
                                      "Weight"
                                    )}
                                  </Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    disabled={!canModify}
                                    value={criterion.weight}
                                    placeholder="0"
                                    onChange={(event) =>
                                      updateCriterion(
                                        sectionIndex,
                                        criterionIndex,
                                        {
                                          weight: event.target.value,
                                        }
                                      )
                                    }
                                  />
                                </div>

                                <div className="sm:col-span-4 space-y-1.5">
                                  <Label className="text-xs font-medium text-foreground">
                                    {t(
                                      "thesisManagement.marking.supervisorPercent",
                                      "Supervisor Weight (%)"
                                    )}
                                  </Label>
                                  {thesisType === "master" ? (
                                    <div className="h-9 px-3 flex items-center rounded-md border border-input bg-muted/30 text-sm">
                                      {formatWeightPercent(
                                        masterWeightPercents?.get(
                                          `${sectionIndex}-${criterionIndex}`
                                        )?.supervisor
                                      )}
                                    </div>
                                  ) : (
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      disabled={!canModify}
                                      value={criterion.supervisor_percent}
                                      placeholder="0"
                                      onChange={(event) =>
                                        updateCriterion(
                                          sectionIndex,
                                          criterionIndex,
                                          {
                                            supervisor_percent:
                                              event.target.value,
                                          }
                                        )
                                      }
                                    />
                                  )}
                                </div>

                                <div className="sm:col-span-4 space-y-1.5">
                                  <Label className="text-xs font-medium text-foreground">
                                    {t(
                                      "thesisManagement.marking.readerPercent",
                                      "Reader Weight (%)"
                                    )}
                                  </Label>
                                  {thesisType === "master" ? (
                                    <div className="h-9 px-3 flex items-center rounded-md border border-input bg-muted/30 text-sm">
                                      {formatWeightPercent(
                                        masterWeightPercents?.get(
                                          `${sectionIndex}-${criterionIndex}`
                                        )?.reader
                                      )}
                                    </div>
                                  ) : (
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      disabled={!canModify}
                                      value={criterion.reader_percent}
                                      placeholder="0"
                                      onChange={(event) =>
                                        updateCriterion(
                                          sectionIndex,
                                          criterionIndex,
                                          {
                                            reader_percent: event.target.value,
                                          }
                                        )
                                      }
                                    />
                                  )}
                                </div>
                              </>
                            )}

                            {/* Guidance text: 12 cols */}
                            <div className="sm:col-span-12 space-y-1.5">
                              <Label className="text-xs font-medium text-muted-foreground">
                                {t(
                                  "thesisManagement.marking.guidance",
                                  "Guidance & Notes for Evaluator (Optional)"
                                )}
                              </Label>
                              <Textarea
                                rows={2}
                                disabled={!canModify}
                                value={criterion.guidance}
                                placeholder={t(
                                  "thesisManagement.marking.guidancePlaceholder",
                                  "Describe specific evaluation criteria, grade rubrics, or expectations..."
                                )}
                                onChange={(event) =>
                                  updateCriterion(
                                    sectionIndex,
                                    criterionIndex,
                                    {
                                      guidance: event.target.value,
                                    }
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Criterion Button */}
                  {canModify && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateSection(sectionIndex, {
                          criteria: [...section.criteria, blankCriterion(form.weights_enabled ? 10 : 0)],
                        })
                      }
                      className="w-full border-dashed text-xs py-2 gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t(
                        "thesisManagement.marking.addCriterion",
                        "Add Criterion to Section"
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Add Section Button */}
        {canModify && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const newSec = blankSection(form.weights_enabled ? 10 : 0);
              updateForm((current) => ({
                ...current,
                sections: [...current.sections, newSec],
              }));
            }}
            className="w-full border-dashed py-4 gap-2 text-sm font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t("thesisManagement.marking.addSection", "Add Evaluation Section")}
          </Button>
        )}
      </div>

      {/* 6. Sticky Bottom Save Bar (Visible when there are unsaved changes) */}
      {canModify && isDirty && (
        <div className="sticky bottom-6 z-20 bg-card/95 backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <p className="text-sm font-medium text-foreground">
              {t(
                "thesisManagement.marking.unsavedChanges",
                "You have unsaved changes in this marking scheme."
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDiscard}
              disabled={saveMutation.isPending}
            >
              {t("common.discard", "Discard")}
            </Button>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="gap-2"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {t("common.save", "Save Changes")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkingSchemePage;
