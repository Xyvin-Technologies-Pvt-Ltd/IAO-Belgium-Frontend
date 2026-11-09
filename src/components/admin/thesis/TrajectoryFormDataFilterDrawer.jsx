import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isFilterableFormQuestion } from "@/utils/thesisFormAnswers";

const FilterSection = ({ label, children }) => (
  <div className="space-y-2">
    <label
      className="text-xs font-semibold uppercase tracking-wider line-clamp-2"
      style={{ color: "#94a3b8" }}
      title={typeof label === "string" ? label : undefined}
    >
      {label}
    </label>
    {children}
  </div>
);

export default function TrajectoryFormDataFilterDrawer({
  questions = [],
  draftFilters,
  setDraftFilters,
  appliedFilters,
  setAppliedFilters,
  setPage,
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const filterableQuestions = (questions || []).filter(isFilterableFormQuestion);

  const activeFiltersCount = Object.entries(appliedFilters || {}).filter(
    ([, val]) => val !== "all" && val !== undefined && val !== ""
  ).length;

  const handleOpenChange = (open) => {
    if (open) {
      setDraftFilters({ ...appliedFilters });
    }
    setIsOpen(open);
  };

  const handleClearAll = () => {
    const resetObj = { submission: "all" };
    for (const question of filterableQuestions) {
      resetObj[question.id] = "all";
    }
    setDraftFilters(resetObj);
    setAppliedFilters(resetObj);
    if (setPage) setPage(1);
  };

  const handleApply = () => {
    setAppliedFilters(draftFilters);
    if (setPage) setPage(1);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant={activeFiltersCount > 0 ? "default" : "outline"}
          className="relative gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t("common.filters", "Filters")}
          {activeFiltersCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: -8,
                right: -8,
                background: "#ef4444",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                width: 20,
                height: 20,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #fff",
              }}
            >
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-100 sm:w-120 p-0 bg-sidebar flex flex-col h-full max-h-screen"
      >
        <SheetHeader
          className="p-6 pb-5 shrink-0"
          style={{ borderBottom: "1px solid var(--sidebar-border, #e8edf3)" }}
        >
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "rgba(255,137,4,0.10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <SlidersHorizontal size={18} color="#ff8904" />
            </div>
            <div>
              <SheetTitle className="text-base font-semibold text-sidebar-foreground">
                {t(
                  "thesisManagement.formData.filterTitle",
                  "Filter form data"
                )}
              </SheetTitle>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                {t(
                  "thesisManagement.formData.filterSubtitle",
                  "Narrow down by submission status and answers"
                )}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            <FilterSection
              label={t("thesisManagement.formData.submission", "Submission")}
            >
              <Select
                value={draftFilters?.submission || "all"}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, submission: val }))
                }
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue placeholder={t("common.all", "All")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all", "All")}</SelectItem>
                  <SelectItem value="submitted">
                    {t("thesisManagement.formData.submitted", "Submitted")}
                  </SelectItem>
                  <SelectItem value="not_submitted">
                    {t(
                      "thesisManagement.formData.notSubmitted",
                      "Not submitted"
                    )}
                  </SelectItem>
                </SelectContent>
              </Select>
            </FilterSection>
          </div>

          {filterableQuestions.length > 0 ? (
            <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#94a3b8" }}
              >
                {t("thesisManagement.formData.answersSection", "Answers")}
              </p>

              {filterableQuestions.map((question) => (
                <FilterSection key={question.id} label={question.label}>
                  <Select
                    value={draftFilters?.[question.id] || "all"}
                    onValueChange={(val) =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        [question.id]: val,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                      <SelectValue placeholder={t("common.all", "All")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t("common.all", "All")}
                      </SelectItem>
                      {question.type === "yes_no" ? (
                        <>
                          <SelectItem value="yes">
                            {t("common.yes", "Yes")}
                          </SelectItem>
                          <SelectItem value="no">
                            {t("common.no", "No")}
                          </SelectItem>
                        </>
                      ) : null}
                      {question.type === "confirmation" ? (
                        <>
                          <SelectItem value="true">
                            {t("common.confirmed", "Confirmed")}
                          </SelectItem>
                          <SelectItem value="false">
                            {t("common.notConfirmed", "Not confirmed")}
                          </SelectItem>
                        </>
                      ) : null}
                      {question.type === "multiple_choice"
                        ? (question.options || []).map((opt) => (
                            <SelectItem key={opt.id} value={String(opt.id)}>
                              {opt.label}
                            </SelectItem>
                          ))
                        : null}
                    </SelectContent>
                  </Select>
                </FilterSection>
              ))}
            </div>
          ) : null}
        </div>

        <SheetFooter
          className="mt-auto shrink-0"
          style={{
            background: "var(--sidebar, #fff)",
            borderTop: "1px solid var(--sidebar-border, #e8edf3)",
            padding: "16px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <Button
            variant="outline"
            className="w-full border-sidebar-border"
            onClick={handleClearAll}
          >
            {t("common.clearAll", "Clear All")}
          </Button>
          <Button className="w-full" onClick={handleApply}>
            {t("common.applyFilters", "Apply Filters")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
