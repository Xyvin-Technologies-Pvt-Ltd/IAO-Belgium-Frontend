/* eslint-disable react-refresh/only-export-components */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  FileQuestion,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export const QUESTION_TYPES = [
  {
    value: "short_answer",
    labelKey: "thesisManagement.steps.form.questionTypes.shortAnswer",
    labelDefault: "Short Answer",
  },
  {
    value: "long_answer",
    labelKey: "thesisManagement.steps.form.questionTypes.longAnswer",
    labelDefault: "Long Answer",
  },
  {
    value: "multiple_choice",
    labelKey: "thesisManagement.steps.form.questionTypes.multipleChoice",
    labelDefault: "Multiple Choice",
  },
  {
    value: "yes_no",
    labelKey: "thesisManagement.steps.form.questionTypes.yesNo",
    labelDefault: "Yes / No",
  },
  {
    value: "confirmation",
    labelKey: "thesisManagement.steps.form.questionTypes.confirmation",
    labelDefault: "Confirmation Checkbox",
  },
  {
    value: "supervisor",
    labelKey: "thesisManagement.steps.form.questionTypes.supervisor",
    labelDefault: "Supervisor Selection",
  },
];

export function createEmptyQuestion() {
  return {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    label: "",
    type: "short_answer",
    required: false,
    options: [],
  };
}

export function createEmptySection() {
  return {
    id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: "",
    questions: [createEmptyQuestion()],
  };
}

export function normalizeFormSchema(raw) {
  const sections = Array.isArray(raw?.sections) ? raw.sections : [];
  if (!sections.length) return { sections: [createEmptySection()] };
  return {
    sections: sections.map((sec) => ({
      id: sec.id || createEmptySection().id,
      title: sec.title || "",
      questions:
        Array.isArray(sec.questions) && sec.questions.length
          ? sec.questions.map((q) => ({
              id: q.id || createEmptyQuestion().id,
              label: q.label || "",
              type: q.type || "short_answer",
              required: Boolean(q.required),
              options: Array.isArray(q.options)
                ? q.options.map((o) => ({
                    id: o.id || `opt_${Math.random().toString(36).slice(2, 8)}`,
                    label: o.label || "",
                  }))
                : [],
            }))
          : [createEmptyQuestion()],
    })),
  };
}

const moveItem = (list, index, direction) => {
  const next = index + direction;
  if (next < 0 || next >= list.length) return list;
  const copy = [...list];
  const tmp = copy[index];
  copy[index] = copy[next];
  copy[next] = tmp;
  return copy;
};

export default function ThesisFormBuilder({ value, onChange, error }) {
  const { t } = useTranslation();
  const sections = value?.sections || [];
  const [collapsedSectionIds, setCollapsedSectionIds] = useState(() => new Set());

  const updateSections = (nextSections) => {
    onChange({ sections: nextSections });
  };

  const updateSection = (sectionIndex, patch) => {
    updateSections(
      sections.map((sec, i) => (i === sectionIndex ? { ...sec, ...patch } : sec))
    );
  };

  const updateQuestion = (sectionIndex, questionIndex, patch) => {
    const section = sections[sectionIndex];
    const questions = (section.questions || []).map((q, i) =>
      i === questionIndex ? { ...q, ...patch } : q
    );
    updateSection(sectionIndex, { questions });
  };

  const toggleSectionCollapse = (secId) => {
    setCollapsedSectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(secId)) {
        next.delete(secId);
      } else {
        next.add(secId);
      }
      return next;
    });
  };

  const handleAddSection = () => {
    const newSec = createEmptySection();
    updateSections([...sections, newSec]);
    // Ensure newly added section is expanded
    setCollapsedSectionIds((prev) => {
      const next = new Set(prev);
      next.delete(newSec.id);
      return next;
    });
  };

  const handleAddQuestion = (sectionIndex) => {
    const section = sections[sectionIndex];
    updateSection(sectionIndex, {
      questions: [...(section.questions || []), createEmptyQuestion()],
    });
  };

  const totalQuestions = sections.reduce(
    (acc, sec) => acc + (sec.questions?.length || 0),
    0
  );

  return (
    <div className="space-y-4 pt-2 border-t border-border/60">
      {/* 1. Header: Clean Title and Branded Counters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Label className="text-sm font-semibold text-foreground">
          {t("thesisManagement.steps.form.formBuilder", "Form Builder")}
        </Label>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25">
          {sections.length}{" "}
          {sections.length === 1
            ? t("thesisManagement.steps.form.sectionSingular", "section")
            : t("thesisManagement.steps.form.sectionPlural", "sections")}
          {" • "}
          {totalQuestions}{" "}
          {totalQuestions === 1
            ? t("thesisManagement.steps.form.questionSingular", "question")
            : t("thesisManagement.steps.form.questionPlural", "questions")}
        </span>
      </div>

      {error && (
        <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs font-medium text-destructive">
          {error}
        </div>
      )}

      {/* 2. Sections List */}
      <div className="space-y-3.5">
        {sections.map((section, sIdx) => {
          const secId = section.id || `sec_${sIdx}`;
          const isCollapsed = collapsedSectionIds.has(secId);
          const questions = section.questions || [];

          return (
            <div
              key={secId}
              className="rounded-xl border border-border bg-card shadow-xs overflow-hidden transition-all"
            >
              {/* Section Header */}
              <div className="bg-muted/30 px-3.5 py-2.5 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/30 shrink-0">
                    {t("thesisManagement.steps.form.sectionPrefix", "Section {{num}}", {
                      num: sIdx + 1,
                    })}
                  </span>

                  <div className="flex-1 min-w-0">
                    <Input
                      value={section.title || ""}
                      onChange={(e) =>
                        updateSection(sIdx, { title: e.target.value })
                      }
                      placeholder={t(
                        "thesisManagement.steps.form.sectionTitlePlaceholder",
                        "Section title"
                      )}
                      className="h-8 text-xs sm:text-sm font-medium bg-background border-border/80 focus-visible:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 pl-1 sm:pl-0">
                  <span className="text-[11px] font-medium text-muted-foreground bg-muted/80 px-2 py-0.5 rounded border border-border/50">
                    {questions.length}{" "}
                    {questions.length === 1
                      ? t("thesisManagement.steps.form.questionSingular", "question")
                      : t("thesisManagement.steps.form.questionPlural", "questions")}
                  </span>

                  <div className="flex items-center gap-0.5">
                    {/* Reorder Section */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                      disabled={sIdx === 0}
                      onClick={() => updateSections(moveItem(sections, sIdx, -1))}
                      title={t("common.moveUp", "Move section up")}
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                      disabled={sIdx === sections.length - 1}
                      onClick={() => updateSections(moveItem(sections, sIdx, 1))}
                      title={t("common.moveDown", "Move section down")}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </Button>

                    {/* Delete Section */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10 cursor-pointer"
                      disabled={sections.length <= 1}
                      onClick={() =>
                        updateSections(sections.filter((_, i) => i !== sIdx))
                      }
                      title={t("common.delete", "Delete section")}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>

                    {/* Collapse / Expand Toggle */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                      onClick={() => toggleSectionCollapse(secId)}
                      title={
                        isCollapsed
                          ? t("common.expand", "Expand section")
                          : t("common.collapse", "Collapse section")
                      }
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isCollapsed ? "" : "rotate-180"
                        }`}
                      />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Section Body (Visible when not collapsed) */}
              {!isCollapsed && (
                <div className="p-3.5 space-y-3">
                  {/* Questions List */}
                  {questions.length === 0 ? (
                    <div className="p-5 rounded-md border border-dashed border-border text-center bg-card/40 space-y-1.5">
                      <FileQuestion className="w-5 h-5 mx-auto text-muted-foreground/60" />
                      <p className="text-xs text-muted-foreground">
                        {t(
                          "thesisManagement.steps.form.noQuestions",
                          "No questions added to this section yet."
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {questions.map((question, qIdx) => (
                        <div
                          key={question.id || qIdx}
                          className="rounded-xl border border-primary/30 hover:border-primary/50 bg-card p-3.5 sm:p-4 space-y-3.5 shadow-xs transition-colors"
                        >
                          {/* Question Card Top Bar: Index, Required Switch, Reorder & Delete */}
                          <div className="flex items-center justify-between pb-2 border-b border-border/60 gap-2">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center min-w-[28px] h-5 px-1.5 rounded text-[11px] font-bold bg-primary/10 text-primary border border-primary/25">
                                Q{qIdx + 1}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Required Switch */}
                              <div className="flex items-center gap-1.5">
                                <Switch
                                  id={`req-${section.id}-${question.id}`}
                                  checked={Boolean(question.required)}
                                  onCheckedChange={(checked) =>
                                    updateQuestion(sIdx, qIdx, {
                                      required: checked,
                                    })
                                  }
                                />
                                <Label
                                  htmlFor={`req-${section.id}-${question.id}`}
                                  className="text-xs font-medium cursor-pointer select-none text-muted-foreground hover:text-foreground flex items-center"
                                >
                                  <span>
                                    {t(
                                      "thesisManagement.steps.form.required",
                                      "Required"
                                    )}
                                  </span>
                                  {question.required && (
                                    <span className="text-destructive font-bold ml-0.5">
                                      *
                                    </span>
                                  )}
                                </Label>
                              </div>

                              <span className="h-3.5 w-px bg-border/80 shrink-0" />

                              {/* Reorder & Delete Question */}
                              <div className="flex items-center gap-0.5">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                                  disabled={qIdx === 0}
                                  onClick={() =>
                                    updateSection(sIdx, {
                                      questions: moveItem(
                                        section.questions || [],
                                        qIdx,
                                        -1
                                      ),
                                    })
                                  }
                                  title={t("common.moveUp", "Move question up")}
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                                  disabled={
                                    qIdx === (section.questions || []).length - 1
                                  }
                                  onClick={() =>
                                    updateSection(sIdx, {
                                      questions: moveItem(
                                        section.questions || [],
                                        qIdx,
                                        1
                                      ),
                                    })
                                  }
                                  title={t("common.moveDown", "Move question down")}
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:bg-destructive/10 cursor-pointer"
                                  disabled={(section.questions || []).length <= 1}
                                  onClick={() =>
                                    updateSection(sIdx, {
                                      questions: (section.questions || []).filter(
                                        (_, i) => i !== qIdx
                                      ),
                                    })
                                  }
                                  title={t("common.delete", "Delete question")}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Question Input & Question Type */}
                          <div className="flex flex-col sm:flex-row gap-2.5">
                            <div className="flex-1 space-y-1">
                              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                {t(
                                  "thesisManagement.steps.form.questionLabel",
                                  "Question Prompt"
                                )}
                              </Label>
                              <Input
                                value={question.label || ""}
                                onChange={(e) =>
                                  updateQuestion(sIdx, qIdx, {
                                    label: e.target.value,
                                  })
                                }
                                placeholder={t(
                                  "thesisManagement.steps.form.questionPlaceholder",
                                  "Enter question prompt..."
                                )}
                                className="text-xs sm:text-sm bg-background border-border/80 focus-visible:ring-primary/20"
                              />
                            </div>

                            <div className="sm:w-52 space-y-1 shrink-0">
                              <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                                {t(
                                  "thesisManagement.steps.form.questionType",
                                  "Answer Type"
                                )}
                              </Label>
                              <Select
                                value={question.type}
                                onValueChange={(val) =>
                                  updateQuestion(sIdx, qIdx, {
                                    type: val,
                                    options:
                                      val === "multiple_choice"
                                        ? question.options?.length
                                          ? question.options
                                          : [
                                              {
                                                id: `opt_${Date.now()}`,
                                                label: "",
                                              },
                                            ]
                                        : [],
                                  })
                                }
                              >
                                <SelectTrigger className="w-full text-xs sm:text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {QUESTION_TYPES.map((qt) => (
                                    <SelectItem
                                      key={qt.value}
                                      value={qt.value}
                                      className="text-xs"
                                    >
                                      {t(qt.labelKey, qt.labelDefault)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Multiple Choice Options List */}
                          {question.type === "multiple_choice" && (
                            <div className="space-y-2 pt-1 pl-1">
                              <div className="flex items-center justify-between">
                                <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                  {t(
                                    "thesisManagement.steps.form.options",
                                    "Choices / Options"
                                  )}
                                </Label>
                                <span className="text-[10px] text-muted-foreground font-medium">
                                  {(question.options || []).length}{" "}
                                  {t("common.options", "options")}
                                </span>
                              </div>

                              <div className="space-y-2">
                                {(question.options || []).map((opt, oIdx) => (
                                  <div
                                    key={opt.id || oIdx}
                                    className="flex items-center gap-2"
                                  >
                                    <div className="w-3.5 h-3.5 rounded-full border-2 border-primary/70 bg-primary/10 shrink-0" />

                                    <Input
                                      value={opt.label || ""}
                                      onChange={(e) => {
                                        const options = (
                                          question.options || []
                                        ).map((o, i) =>
                                          i === oIdx
                                            ? { ...o, label: e.target.value }
                                            : o
                                        );
                                        updateQuestion(sIdx, qIdx, { options });
                                      }}
                                      placeholder={t(
                                        "thesisManagement.steps.form.optionPlaceholder",
                                        "Option {{n}}",
                                        { n: oIdx + 1 }
                                      )}
                                      className="text-xs h-8 bg-background border-border/80 focus-visible:ring-primary/20"
                                    />

                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer"
                                      disabled={
                                        (question.options || []).length <= 1
                                      }
                                      onClick={() => {
                                        const options = (
                                          question.options || []
                                        ).filter((_, i) => i !== oIdx);
                                        updateQuestion(sIdx, qIdx, { options });
                                      }}
                                      title={t("common.delete", "Delete option")}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                ))}
                              </div>

                              {/* Compact inline '+ Add Option' button */}
                              <div className="pt-0.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateQuestion(sIdx, qIdx, {
                                      options: [
                                        ...(question.options || []),
                                        {
                                          id: `opt_${Date.now()}_${oIdxSafe(
                                            question.options
                                          )}`,
                                          label: "",
                                        },
                                      ],
                                    })
                                  }
                                  className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 text-primary text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>
                                    {t(
                                      "thesisManagement.steps.form.addOption",
                                      "Add Option"
                                    )}
                                  </span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inside Section Footer: Dashed '+ Add Question to Section X' button */}
                  <button
                    type="button"
                    onClick={() => handleAddQuestion(sIdx)}
                    className="w-full py-2.5 px-3 rounded-lg border border-dashed border-primary/40 hover:border-primary bg-primary/[0.02] hover:bg-primary/[0.06] text-primary text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-primary" />
                    <span>
                      {t(
                        "thesisManagement.steps.form.addQuestionToSection",
                        "Add Question to Section {{num}}",
                        { num: sIdx + 1 }
                      )}
                    </span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Bottom of Form Builder: Prominent Solid '+ Add New Section' */}
      <div className="pt-1">
        <Button
          type="button"
          onClick={handleAddSection}
          className="w-full h-11 font-semibold text-xs sm:text-sm gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-xs cursor-pointer transition-all hover:shadow"
        >
          <Plus className="w-4 h-4" />
          <span>
            {t("thesisManagement.steps.form.addNewSection", "Add New Section")}
          </span>
        </Button>
      </div>
    </div>
  );
}

function oIdxSafe(options) {
  return (options || []).length;
}
