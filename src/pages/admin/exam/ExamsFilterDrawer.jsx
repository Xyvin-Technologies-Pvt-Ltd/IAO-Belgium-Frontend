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
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useGetBatches, useGetAllPrograms, useGetAllLanguages } from "@/store/useDropdownStore";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import { useTranslation } from "react-i18next";

export const EMPTY_EXAM_FILTERS = {
  status: "all",
  language: "all",
  program: "all",
  batch: "all",
};

const FilterSection = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/60">
      {label}
    </label>
    {children}
  </div>
);

const ExamsFilterDrawer = ({
  draftFilters,
  setDraftFilters,
  appliedFilters,
  setAppliedFilters,
  setPage,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [programSearchTerm, setProgramSearchTerm] = useState("");
  const [batchSearchTerm, setBatchSearchTerm] = useState("");

  const { data: languagesData } = useGetAllLanguages(
    { status: true },
    { enabled: isOpen },
  );

  const { data: programsData, isLoading: programsLoading } = useGetAllPrograms(
    {
      ...(programSearchTerm && { search: programSearchTerm }),
    },
    { enabled: isOpen },
  );

  const selectedProgramId =
    draftFilters.program !== "all" ? draftFilters.program : null;

  const { data: batchesData, isLoading: batchesLoading } = useGetBatches(
    selectedProgramId,
    {
      include_closed: true,
      ...(batchSearchTerm && { search: batchSearchTerm }),
    },
    { enabled: isOpen && !!selectedProgramId },
  );

  const languages = languagesData?.data || [];

  const activeFiltersCount = Object.values(appliedFilters || {}).filter(
    (val) => val !== "all" && val !== "" && val != null,
  ).length;

  const handleClearAll = () => {
    setDraftFilters(EMPTY_EXAM_FILTERS);
    setAppliedFilters(EMPTY_EXAM_FILTERS);
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
                {t("exam.filterTitle", "Filter exams")}
              </SheetTitle>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                {t(
                  "exam.filterSubtitle",
                  "Narrow by status, language, programme, or batch",
                )}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            <FilterSection label={t("exam.table.status")}>
              <Select
                value={draftFilters.status || "all"}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, status: val }))
                }
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue placeholder={t("exam.allStatuses")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("exam.allStatuses")}</SelectItem>
                  <SelectItem value="draft">{t("exam.status.draft")}</SelectItem>
                  <SelectItem value="published">
                    {t("exam.status.published")}
                  </SelectItem>
                  <SelectItem value="archived">
                    {t("exam.status.archived")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection label={t("exam.table.language")}>
              <Select
                value={draftFilters.language || "all"}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, language: val }))
                }
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue placeholder={t("exam.allLanguages")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("exam.allLanguages")}</SelectItem>
                  {languages.map((lang) => (
                    <SelectItem key={lang._id} value={lang._id}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection
              label={t("resultsManagement.filter.program", "Programme")}
            >
              <SearchableSelect
                placeholder={t("All Programs")}
                searchPlaceholder={t(
                  "planningManagement.modal.searchPrograms",
                  "Search programmes...",
                )}
                items={
                  programsData?.data?.map((p) => ({
                    ...p,
                    name: `${p.name} - ${p.language?.name || ""} - ${p.city?.name || ""}`,
                  })) || []
                }
                value={
                  draftFilters.program === "all"
                    ? ""
                    : draftFilters.program || ""
                }
                onChange={(val) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    program: val || "all",
                    batch: "all",
                  }))
                }
                onSearch={setProgramSearchTerm}
                isLoading={programsLoading}
              />
            </FilterSection>

            <FilterSection
              label={t("exam.table.batch", "Batch")}
            >
              <SearchableSelect
                placeholder={
                  selectedProgramId
                    ? t("All Batches")
                    : t(
                        "resultsManagement.filter.batchPlaceholderDisabled",
                        "Select a programme first",
                      )
                }
                searchPlaceholder={t(
                  "planningManagement.modal.searchBatches",
                  "Search batches...",
                )}
                items={(batchesData?.data || []).map((b) => ({
                  _id: b._id,
                  name: b.intake?.academic?.name
                    ? `${b.name} (${b.intake.academic.name})`
                    : b.name,
                }))}
                value={
                  draftFilters.batch === "all" ? "" : draftFilters.batch || ""
                }
                onChange={(val) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    batch: val || "all",
                  }))
                }
                onSearch={setBatchSearchTerm}
                isLoading={batchesLoading}
                disabled={!selectedProgramId}
              />
            </FilterSection>
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
            {t("resultsManagement.filter.clearBtn", "Clear All")}
          </Button>
          <Button className="w-full" onClick={handleApply}>
            {t("resultsManagement.filter.applyBtn", "Apply Filters")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default ExamsFilterDrawer;
