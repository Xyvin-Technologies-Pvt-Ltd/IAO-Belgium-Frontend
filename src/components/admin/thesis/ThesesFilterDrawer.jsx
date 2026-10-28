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
import { useTranslation } from "react-i18next";
import { useGetAllAcademicYears } from "@/store/useDropdownStore";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";

const FilterSection = ({ label, children }) => (
  <div className="space-y-2">
    <label
      className="text-xs font-semibold uppercase tracking-wider"
      style={{ color: "#94a3b8" }}
    >
      {label}
    </label>
    {children}
  </div>
);

const STUDY_YEARS = [1, 2, 3, 4, 5];

const ThesesFilterDrawer = ({
  draftFilters,
  setDraftFilters,
  appliedFilters,
  setAppliedFilters,
  setPage,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [academicSearchTerm, setAcademicSearchTerm] = useState("");

  const { data: academicYearsData, isLoading: academicYearsLoading } =
    useGetAllAcademicYears(
      {
        ...(academicSearchTerm && { search: academicSearchTerm }),
      },
      { enabled: isOpen }
    );

  const academicYears = academicYearsData?.data || [];

  const activeFiltersCount = Object.entries(appliedFilters).filter(
    ([, val]) => val !== "all" && val !== undefined && val !== ""
  ).length;

  const handleClearAll = () => {
    const resetObj = {
      academic: "all",
      current_year: "all",
    };
    setDraftFilters(resetObj);
    setAppliedFilters(resetObj);
    setPage(1);
  };

  const handleOpenChange = (open) => {
    if (open) {
      setDraftFilters({ ...appliedFilters });
    }
    setIsOpen(open);
  };

  const handleApply = () => {
    setAppliedFilters(draftFilters);
    setPage(1);
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
          {t("common.filter", "Filters")}
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
                {t("thesisManagement.filters.title", "Filter Theses")}
              </SheetTitle>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                {t("thesisManagement.filters.subtitle", "Narrow down the theses list")}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            <FilterSection label={t("thesisManagement.table.academic", "Academic Year")}>
              <SearchableSelect
                placeholder={t(
                  "thesisManagement.filters.allAcademicYears",
                  "All Academic Years"
                )}
                searchPlaceholder={t("thesisManagement.modal.searchAcademic", "Search academic years...")}
                items={academicYears}
                value={draftFilters.academic === "all" ? "" : draftFilters.academic}
                onChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, academic: val || "all" }))
                }
                onSearch={setAcademicSearchTerm}
                isLoading={academicYearsLoading}
              />
            </FilterSection>

            <FilterSection label={t("thesisManagement.filters.studyYear", "Study Year")}>
              <Select
                value={draftFilters.current_year}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, current_year: val }))
                }
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue
                    placeholder={t(
                      "thesisManagement.filters.allStudyYears",
                      "All Study Years"
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t(
                      "thesisManagement.filters.allStudyYears",
                      "All Study Years"
                    )}
                  </SelectItem>
                  {STUDY_YEARS.map((yr) => (
                    <SelectItem key={yr} value={String(yr)}>
                      {t("thesisManagement.modal.yearOption", `Year ${yr}`, {
                        year: yr,
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            {t("common.clearAll", "Clear All")}
          </Button>
          <Button className="w-full" onClick={handleApply}>
            {t("common.applyFilters", "Apply Filters")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default ThesesFilterDrawer;
