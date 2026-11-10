import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { PROGRAM_TYPES } from "@/constants/programTypes";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import ClearableDateInput from "@/components/admin/ClearableDateInput";

//* IPB-151: Module Reports filters — same layout / behaviour as the
//* "Filter invoices" panel on Teacher Proforma Expense Notes.

const FilterSection = ({ label, onReset, children }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between gap-2">
      <label
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: "#94a3b8" }}
      >
        {label}
      </label>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-medium text-primary hover:underline"
        >
          Reset
        </button>
      )}
    </div>
    {children}
  </div>
);

export const EMPTY_MODULE_REPORT_FILTERS = {
  module_type: "all",
  program_type: "all",
  program_id: "all",
  city_id: "all",
  start_from: "",
  start_to: "",
  end_from: "",
  end_to: "",
};

const DATE_KEYS = ["start_from", "start_to", "end_from", "end_to"];

//* Static options with local search (SearchableSelect only searches via onSearch)
function OptionSelect({ items, value, onChange, placeholder, searchPlaceholder }) {
  const [term, setTerm] = useState("");
  const handleSearch = useCallback((next) => setTerm(next || ""), []);
  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    return q ? items.filter((item) => item.name.toLowerCase().includes(q)) : items;
  }, [items, term]);
  return (
    <SearchableSelect
      className="w-full"
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      items={filtered}
      value={value && value !== "all" ? String(value) : ""}
      onChange={(next) => onChange(next || "all")}
      onSearch={handleSearch}
    />
  );
}

function DateRangeSection({ label, fromKey, toKey, draftFilters, setDraftFilters, isSet, applyPatch, invalid, t }) {
  return (
    <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
      <FilterSection
        label={label}
        onReset={
          isSet(fromKey) || isSet(toKey)
            ? () => applyPatch({ [fromKey]: "", [toKey]: "" })
            : null
        }
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs" style={{ color: "#94a3b8" }}>
              {t("finance.moduleReports.filters.from", "From")}
            </p>
            <ClearableDateInput
              value={draftFilters[fromKey]}
              onChange={(val) => setDraftFilters((prev) => ({ ...prev, [fromKey]: val }))}
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs" style={{ color: "#94a3b8" }}>
              {t("finance.moduleReports.filters.to", "To")}
            </p>
            <ClearableDateInput
              value={draftFilters[toKey]}
              min={draftFilters[fromKey]}
              invalid={invalid}
              onChange={(val) => setDraftFilters((prev) => ({ ...prev, [toKey]: val }))}
            />
            {invalid && (
              <p className="text-xs text-red-600">
                {t(
                  "finance.moduleReports.filters.invalidRange",
                  "End date cannot be earlier than the start date.",
                )}
              </p>
            )}
          </div>
        </div>
      </FilterSection>
    </div>
  );
}

export default function ModuleReportsFilterDrawer({
  draftFilters,
  setDraftFilters,
  appliedFilters,
  setAppliedFilters,
  setPage,
  filterOptions = {},
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const activeFiltersCount =
    Object.entries(appliedFilters || {}).filter(
      ([key, val]) => !DATE_KEYS.includes(key) && val && val !== "all",
    ).length +
    (appliedFilters?.start_from || appliedFilters?.start_to ? 1 : 0) +
    (appliedFilters?.end_from || appliedFilters?.end_to ? 1 : 0);

  const startInvalid = Boolean(
    draftFilters.start_from && draftFilters.start_to && draftFilters.start_to < draftFilters.start_from,
  );
  const endInvalid = Boolean(
    draftFilters.end_from && draftFilters.end_to && draftFilters.end_to < draftFilters.end_from,
  );

  const isSet = (key) =>
    (draftFilters?.[key] && draftFilters[key] !== "all") ||
    (appliedFilters?.[key] && appliedFilters[key] !== "all");

  const applyPatch = (patch) => {
    setDraftFilters((prev) => ({ ...prev, ...patch }));
    setAppliedFilters((prev) => ({ ...prev, ...patch }));
    setPage?.(1);
  };

  const handleClearAll = () => {
    setDraftFilters({ ...EMPTY_MODULE_REPORT_FILTERS });
    setAppliedFilters({ ...EMPTY_MODULE_REPORT_FILTERS });
    setPage?.(1);
  };

  const handleApply = () => {
    if (startInvalid || endInvalid) return;
    setAppliedFilters({ ...draftFilters });
    setPage?.(1);
    setIsOpen(false);
  };

  const moduleTypes = [
    { value: "module", label: t("finance.moduleReports.types.module", "Module") },
    { value: "skill_day", label: t("finance.moduleReports.types.skillDay", "Skill day") },
    { value: "thesis", label: t("finance.moduleReports.types.thesis", "Thesis") },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant={activeFiltersCount > 0 ? "default" : "outline"}
          className="relative gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t("finance.moduleReports.filters.button", "Filters")}
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
                {t("finance.moduleReports.filters.title", "Filter modules")}
              </SheetTitle>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                {t(
                  "finance.moduleReports.filters.subtitle",
                  "Type, program, city, start and end date",
                )}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            <FilterSection
              label={t("finance.moduleReports.filters.moduleType", "Module type")}
              onReset={isSet("module_type") ? () => applyPatch({ module_type: "all" }) : null}
            >
              <Select
                value={draftFilters.module_type || "all"}
                onValueChange={(val) => setDraftFilters((prev) => ({ ...prev, module_type: val }))}
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue placeholder={t("finance.moduleReports.filters.allTypes", "All types")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("finance.moduleReports.filters.allTypes", "All types")}
                  </SelectItem>
                  {moduleTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection
              label={t("finance.moduleReports.filters.programType", "Program type")}
              onReset={isSet("program_type") ? () => applyPatch({ program_type: "all" }) : null}
            >
              <Select
                value={draftFilters.program_type || "all"}
                onValueChange={(val) => setDraftFilters((prev) => ({ ...prev, program_type: val }))}
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue placeholder={t("finance.moduleReports.filters.allProgramTypes", "All program types")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("finance.moduleReports.filters.allProgramTypes", "All program types")}
                  </SelectItem>
                  {PROGRAM_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection
              label={t("finance.moduleReports.filters.program", "Program")}
              onReset={isSet("program_id") ? () => applyPatch({ program_id: "all" }) : null}
            >
              <OptionSelect
                items={filterOptions.programs || []}
                value={draftFilters.program_id}
                placeholder={t("finance.moduleReports.filters.allPrograms", "All programs")}
                searchPlaceholder={t("finance.moduleReports.filters.searchPrograms", "Search programs...")}
                onChange={(val) => setDraftFilters((prev) => ({ ...prev, program_id: val }))}
              />
            </FilterSection>

            <FilterSection
              label={t("finance.moduleReports.filters.city", "City")}
              onReset={isSet("city_id") ? () => applyPatch({ city_id: "all" }) : null}
            >
              <OptionSelect
                items={filterOptions.cities || []}
                value={draftFilters.city_id}
                placeholder={t("finance.moduleReports.filters.allCities", "All cities")}
                searchPlaceholder={t("finance.moduleReports.filters.searchCities", "Search cities...")}
                onChange={(val) => setDraftFilters((prev) => ({ ...prev, city_id: val }))}
              />
            </FilterSection>
          </div>

          <DateRangeSection
            label={t("finance.moduleReports.columns.startDate", "Start date")}
            fromKey="start_from"
            toKey="start_to"
            invalid={startInvalid}
            {...{ draftFilters, setDraftFilters, isSet, applyPatch, t }}
          />
          <DateRangeSection
            label={t("finance.moduleReports.columns.endDate", "End date")}
            fromKey="end_from"
            toKey="end_to"
            invalid={endInvalid}
            {...{ draftFilters, setDraftFilters, isSet, applyPatch, t }}
          />
        </div>

        <SheetFooter
          className="p-6 pt-4 shrink-0 flex-row gap-3 sm:space-x-0"
          style={{ borderTop: "1px solid var(--sidebar-border, #e8edf3)" }}
        >
          <Button variant="outline" className="flex-1" onClick={handleClearAll}>
            {t("finance.moduleReports.filters.clearAll", "Clear all")}
          </Button>
          <SheetClose asChild>
            <Button className="flex-1" onClick={handleApply} disabled={startInvalid || endInvalid}>
              {t("finance.moduleReports.filters.apply", "Apply filters")}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
