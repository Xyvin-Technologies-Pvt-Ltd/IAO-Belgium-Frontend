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
import { Checkbox } from "@/components/ui/checkbox";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useGetBatches, useGetAllPrograms, useGetAllAcademicYears } from "@/store/useDropdownStore";
import { useGetExamsDropdown } from "@/store/useExamStore";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import { useTranslation } from "react-i18next";

const FilterSection = ({ label, children }) => (
  <div className="space-y-2">
    <label
      className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/60"
    >
      {label}
    </label>
    {children}
  </div>
);

const ResultsFilterDrawer = ({
  draftFilters,
  setDraftFilters,
  appliedFilters,
  setAppliedFilters,
  setPage,
  examType,
  showPendingScoreFilter,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const [programSearchTerm, setProgramSearchTerm] = useState("");
  const [batchSearchTerm, setBatchSearchTerm] = useState("");

  const { data: programsData, isLoading: programsLoading } = useGetAllPrograms(
    {
      ...(programSearchTerm && { search: programSearchTerm }),
    },
    { enabled: isOpen }
  );

  const selectedProgramId = draftFilters.program !== "all" ? draftFilters.program : null;

  const { data: batchesData, isLoading: batchesLoading } = useGetBatches(
    selectedProgramId,
    {
      ...(batchSearchTerm && { search: batchSearchTerm }),
    },
    { enabled: isOpen && !!selectedProgramId }
  );

  const { data: academicYearsData } = useGetAllAcademicYears(
    { status: true },
    { enabled: isOpen }
  );

  const { data: examsData } = useGetExamsDropdown(
    { ...(examType && { type: examType }) },
    { enabled: isOpen }
  );

  const activeFiltersCount = Object.entries(appliedFilters).filter(([key, val]) => {
    if (key === "failed" && val === true) return true;
    if (key === "pending_admin_score" && val === true) return true;
    return val !== "all" && val !== "" && val !== false;
  }).length;

  const handleClearAll = () => {
    const resetObj = {
      program: "all",
      batch: "all",
      academic: "all",
      exam: "all",
      failed: false,
      pending_admin_score: false,
    };
    setDraftFilters(resetObj);
    setAppliedFilters(resetObj);
    setPage(1);
  };

  const handleApply = () => {
    setAppliedFilters(draftFilters);
    setPage(1);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant={activeFiltersCount > 0 ? "default" : "outline"}
          className="relative gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t("common.filters")}
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
                {t("resultsManagement.filterTitle")}
              </SheetTitle>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                {t("resultsManagement.filterSubtitle")}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            {/* Program */}
            <FilterSection label={t("resultsManagement.filter.program")}>
              <SearchableSelect
                placeholder={t("resultsManagement.filter.programPlaceholder")}
                searchPlaceholder={t("resultsManagement.filter.programSearchPlaceholder")}
                items={
                  programsData?.data?.map((p) => ({
                    ...p,
                    name: `${p.name} - ${p.language?.name || ""} - ${p.city?.name || ""}`,
                  })) || []
                }
                value={draftFilters.program === "all" ? "" : draftFilters.program || ""}
                onChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, program: val || "all", batch: "all" }))
                }
                onSearch={setProgramSearchTerm}
                isLoading={programsLoading}
              />
            </FilterSection>

            {/* Batch */}
            <FilterSection label={t("resultsManagement.filter.batch")}>
              <SearchableSelect
                placeholder={selectedProgramId ? t("resultsManagement.filter.batchPlaceholder") : t("resultsManagement.filter.batchPlaceholderDisabled")}
                searchPlaceholder={t("resultsManagement.filter.batchSearchPlaceholder")}
                items={batchesData?.data || []}
                value={draftFilters.batch === "all" ? "" : draftFilters.batch || ""}
                onChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, batch: val || "all" }))
                }
                onSearch={setBatchSearchTerm}
                isLoading={batchesLoading}
                disabled={!selectedProgramId}
              />
            </FilterSection>

            {/* Academic Year */}
            <FilterSection label={t("resultsManagement.filter.academic")}>
              <Select
                value={draftFilters.academic || "all"}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, academic: val }))
                }
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue placeholder={t("resultsManagement.filter.academicPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("resultsManagement.filter.academicPlaceholder")}</SelectItem>
                  {academicYearsData?.data?.map((ay) => (
                    <SelectItem key={ay._id} value={ay._id}>
                      {ay.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            {/* Exam */}
            <FilterSection label={t("resultsManagement.filter.exam")}>
              <Select
                value={draftFilters.exam || "all"}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, exam: val }))
                }
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue placeholder={t("resultsManagement.filter.examPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("resultsManagement.filter.examPlaceholder")}</SelectItem>
                  {examsData?.data?.map((ex) => (
                    <SelectItem key={ex._id} value={ex._id}>
                      {ex.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

             {/* Failed Only */}
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="failed-filter-drawer"
                checked={draftFilters.failed}
                onCheckedChange={(checked) =>
                  setDraftFilters((prev) => ({ ...prev, failed: !!checked }))
                }
              />
              <label
                htmlFor="failed-filter-drawer"
                className="text-xs sm:text-sm font-medium leading-none cursor-pointer text-dashboard-text dark:text-white"
              >
                {t("resultsManagement.failedOnly")}
              </label>
            </div>

            {/* Pending Admin Score */}
            {showPendingScoreFilter && (
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="pending-score-filter-drawer"
                  checked={draftFilters.pending_admin_score}
                  onCheckedChange={(checked) =>
                    setDraftFilters((prev) => ({ ...prev, pending_admin_score: !!checked }))
                  }
                />
                <label
                  htmlFor="pending-score-filter-drawer"
                  className="text-xs sm:text-sm font-medium leading-none cursor-pointer text-dashboard-text dark:text-white"
                >
                  {t("resultsManagement.pendingScore", "Pending admin score")}
                </label>
              </div>
            )}
          </div>
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
            {t("resultsManagement.filter.clearBtn")}
          </Button>
          <Button className="w-full" onClick={handleApply}>
            {t("resultsManagement.filter.applyBtn")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default ResultsFilterDrawer;
