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
import {
  useGetAllCities,
  useGetAllLanguages,
  useGetAllCountries,
} from "@/store/useDropdownStore";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import { Input } from "@/components/ui/input";
import ClearableDateInput from "@/components/admin/ClearableDateInput";
import { PROGRAM_TYPES, PROGRAM_TYPE_I18N_KEYS } from "@/constants/programTypes";
import { useTranslation } from "react-i18next";
import {
  DEFAULT_INTAKE_FILTERS,
  countActiveIntakeFilters,
  hasInvalidIntakeRange,
  isDateRangeInvalid,
  isFeeRangeInvalid,
} from "./intakeFilterUtils";

const FilterSection = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>
      {label}
    </label>
    {children}
  </div>
);

const IntakesFilterDrawer = ({
  draftFilters,
  setDraftFilters,
  appliedFilters,
  setAppliedFilters,
  setPage,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const [citySearchTerm, setCitySearchTerm] = useState("");
  const [languageSearchTerm, setLanguageSearchTerm] = useState("");

  const { data: countriesData, isLoading: countriesLoading } = useGetAllCountries(
    { ...(countrySearchTerm && { search: countrySearchTerm }) },
    { enabled: isOpen }
  );

  const selectedCountry = draftFilters.country !== "all" ? draftFilters.country : null;

  const { data: citiesData, isLoading: citiesLoading } = useGetAllCities(
    {
      ...(citySearchTerm && { search: citySearchTerm }),
      ...(selectedCountry && { country: selectedCountry }),
    },
    { enabled: isOpen }
  );

  const { data: languagesData, isLoading: languagesLoading } = useGetAllLanguages(
    { ...(languageSearchTerm && { search: languageSearchTerm }) },
    { enabled: isOpen }
  );

  const activeFiltersCount = countActiveIntakeFilters(appliedFilters);
  const rangeInvalid = hasInvalidIntakeRange(draftFilters);

  const setDraft = (patch) => setDraftFilters((prev) => ({ ...prev, ...patch }));

  //* IPB-152: from/to pair (date range or fee range)
  const renderRange = (label, fromKey, toKey, invalid, type = "date") => (
    <FilterSection label={label}>
      <div className="grid grid-cols-2 gap-2">
        {type === "date" ? (
          <>
            <ClearableDateInput
              value={draftFilters[fromKey]}
              onChange={(val) => setDraft({ [fromKey]: val })}
            />
            <ClearableDateInput
              value={draftFilters[toKey]}
              min={draftFilters[fromKey]}
              invalid={invalid}
              onChange={(val) => setDraft({ [toKey]: val })}
            />
          </>
        ) : (
          <>
            <Input
              type="number"
              min={0}
              placeholder={t("intakeManagement.filters.min")}
              className="bg-sidebar border-sidebar-border"
              value={draftFilters[fromKey]}
              onChange={(e) => setDraft({ [fromKey]: e.target.value })}
            />
            <Input
              type="number"
              min={0}
              placeholder={t("intakeManagement.filters.max")}
              className={`bg-sidebar border-sidebar-border ${invalid ? "border-red-500" : ""}`}
              value={draftFilters[toKey]}
              onChange={(e) => setDraft({ [toKey]: e.target.value })}
            />
          </>
        )}
      </div>
      {type === "date" && (
        <div className="grid grid-cols-2 gap-2 text-[11px]" style={{ color: "#94a3b8" }}>
          <span>{t("intakeManagement.filters.from")}</span>
          <span>{t("intakeManagement.filters.to")}</span>
        </div>
      )}
      {invalid && (
        <p className="text-xs text-red-500">{t("intakeManagement.filters.invalidRange")}</p>
      )}
    </FilterSection>
  );

  const handleClearAll = () => {
    const reset = { ...DEFAULT_INTAKE_FILTERS };
    setDraftFilters(reset);
    setAppliedFilters(reset);
    setPage(1);
  };

  const handleApply = () => {
    if (rangeInvalid) return;
    setAppliedFilters(draftFilters);
    setPage(1);
    setIsOpen(false);
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        //* start from the applied filters (they may have been cleared/restored outside the drawer)
        if (open) setDraftFilters(appliedFilters);
        setIsOpen(open);
      }}
    >
      <SheetTrigger asChild>
        <Button variant={activeFiltersCount > 0 ? "default" : "outline"} className="relative gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          {t("intakeManagement.filters.title")}
          {activeFiltersCount > 0 && (
            <span style={{
              position: "absolute", top: -8, right: -8,
              background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 700,
              width: 20, height: 20, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "2px solid #fff",
            }}>
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[400px] sm:w-[480px] p-0 bg-sidebar flex flex-col h-full max-h-screen">
        <SheetHeader className="p-6 pb-5 shrink-0" style={{ borderBottom: "1px solid var(--sidebar-border, #e8edf3)" }}>
          <div className="flex items-center gap-3">
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "rgba(255,137,4,0.10)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <SlidersHorizontal size={18} color="#ff8904" />
            </div>
            <div>
              <SheetTitle className="text-base font-semibold text-sidebar-foreground">
                {t("intakeManagement.filters.narrowDownIntakes")}
              </SheetTitle>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                {t("intakeManagement.filters.narrowDownIntakes")}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          {/* IPB-152: Type + Programme name */}
          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            <FilterSection label={t("intakeManagement.filters.type")}>
              <Select
                value={draftFilters.program_type}
                onValueChange={(val) => setDraft({ program_type: val })}
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue placeholder={t("intakeManagement.filters.allTypes")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("intakeManagement.filters.allTypes")}</SelectItem>
                  {PROGRAM_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(PROGRAM_TYPE_I18N_KEYS[type], type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection label={t("intakeManagement.filters.programName")}>
              <Input
                placeholder={t("intakeManagement.filters.programNamePlaceholder")}
                className="bg-sidebar border-sidebar-border"
                value={draftFilters.program_name}
                onChange={(e) => setDraft({ program_name: e.target.value })}
              />
            </FilterSection>
          </div>

          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            <FilterSection label={t("intakeManagement.filters.status")}>
              <Select
                value={draftFilters.status}
                onValueChange={(val) => setDraftFilters((prev) => ({ ...prev, status: val }))}
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue placeholder={t("intakeManagement.filters.allStatuses")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("intakeManagement.filters.allStatuses")}</SelectItem>
                  <SelectItem value="open">{t("common.open")}</SelectItem>
                  <SelectItem value="closed">{t("common.closed")}</SelectItem>
                  <SelectItem value="deleted">{t("common.deleted")}</SelectItem>
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection label={t("intakeManagement.filters.language")}>
              <SearchableSelect
                placeholder={t("intakeManagement.filters.allLanguages")}
                searchPlaceholder={t("intakeManagement.filters.searchLanguages")}
                items={languagesData?.data || []}
                value={draftFilters.language === "all" ? "" : draftFilters.language}
                onChange={(val) => setDraftFilters((prev) => ({ ...prev, language: val || "all" }))}
                onSearch={setLanguageSearchTerm}
                isLoading={languagesLoading}
              />
            </FilterSection>
          </div>

          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>
              {t("intakeManagement.filters.location")}
            </p>
            <FilterSection label={t("intakeManagement.filters.countryHelper")}>
              <SearchableSelect
                placeholder={t("intakeManagement.filters.selectCountryFirst")}
                searchPlaceholder={t("intakeManagement.filters.searchCountries")}
                items={countriesData?.data || []}
                value={draftFilters.country === "all" ? "" : draftFilters.country}
                onChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, country: val || "all", city: "all" }))
                }
                onSearch={setCountrySearchTerm}
                isLoading={countriesLoading}
              />
            </FilterSection>

            <FilterSection label={t("intakeManagement.filters.city")}>
              <SearchableSelect
                placeholder={t("intakeManagement.filters.allCities")}
                searchPlaceholder={t("intakeManagement.filters.searchCities")}
                items={citiesData?.data || []}
                value={draftFilters.city === "all" ? "" : draftFilters.city}
                onChange={(val) => setDraftFilters((prev) => ({ ...prev, city: val || "all" }))}
                onSearch={setCitySearchTerm}
                isLoading={citiesLoading}
                disabled={!selectedCountry}
              />
            </FilterSection>
          </div>

          {/* IPB-152: Registration fee + date ranges */}
          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            {renderRange(
              t("intakeManagement.filters.registrationFee"),
              "fee_min",
              "fee_max",
              isFeeRangeInvalid(draftFilters.fee_min, draftFilters.fee_max),
              "number",
            )}
            {renderRange(
              t("intakeManagement.filters.startDate"),
              "start_date_from",
              "start_date_to",
              isDateRangeInvalid(draftFilters.start_date_from, draftFilters.start_date_to),
            )}
            {renderRange(
              t("intakeManagement.filters.endDate"),
              "end_date_from",
              "end_date_to",
              isDateRangeInvalid(draftFilters.end_date_from, draftFilters.end_date_to),
            )}
            {renderRange(
              t("intakeManagement.filters.deadline"),
              "deadline_from",
              "deadline_to",
              isDateRangeInvalid(draftFilters.deadline_from, draftFilters.deadline_to),
            )}
          </div>
        </div>

        <SheetFooter className="mt-auto shrink-0" style={{
          background: "var(--sidebar, #fff)",
          borderTop: "1px solid var(--sidebar-border, #e8edf3)",
          padding: "16px 24px",
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          <Button variant="outline" className="w-full border-sidebar-border" onClick={handleClearAll}>
            {t("intakeManagement.filters.clearAll")}
          </Button>
          <Button className="w-full" onClick={handleApply} disabled={rangeInvalid}>
            {t("intakeManagement.filters.applyFilters")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default IntakesFilterDrawer;
