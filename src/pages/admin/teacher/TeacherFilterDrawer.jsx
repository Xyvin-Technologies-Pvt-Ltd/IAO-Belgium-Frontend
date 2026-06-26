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
  useGetAllTeacherRoles,
  useGetAllTeacherTitle,
  useGetAllContractTypes,
  useGetAllDepartments,
  useGetAllRegions,
  useGetAllTeachingRegions,
} from "@/store/useDropdownStore";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import SearchableMultiSelect from "@/components/ui/forms/SearchableMultiSelect";
import { useTranslation } from "react-i18next";

// Multi-select filter keys (values are arrays of {_id, name})
const MULTI_FILTER_KEYS = [
  "teacher_role",
  "academic_degree",
  "language",
  "mother_tongue",
  "contract_type",
  "department",
  "region",
  "teaching_regions",
];

// Single-value helper filters (values are strings, "all" means unset)
const SINGLE_FILTER_KEYS = ["country", "location", "status"];

export const createEmptyFilters = () => ({
  teacher_role: [],
  academic_degree: [],
  language: [],
  mother_tongue: [],
  contract_type: [],
  department: [],
  region: [],
  teaching_regions: [],
  country: "all",
  location: "all",
  status: "all",
});

const FilterSection = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
      {label}
    </label>
    {children}
  </div>
);

const TeacherFilterDrawer = ({
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
  const [motherTongueSearchTerm, setMotherTongueSearchTerm] = useState("");
  const [roleSearchTerm, setRoleSearchTerm] = useState("");
  const [titleSearchTerm, setTitleSearchTerm] = useState("");
  const [contractTypeSearchTerm, setContractTypeSearchTerm] = useState("");
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState("");
  const [regionSearchTerm, setRegionSearchTerm] = useState("");
  const [teachingRegionSearchTerm, setTeachingRegionSearchTerm] = useState("");

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

  const { data: motherTonguesData, isLoading: motherTonguesLoading } =
    useGetAllLanguages(
      { ...(motherTongueSearchTerm && { search: motherTongueSearchTerm }) },
      { enabled: isOpen }
    );

  const { data: rolesData, isLoading: rolesLoading } = useGetAllTeacherRoles(
    { ...(roleSearchTerm && { search: roleSearchTerm }) },
    { enabled: isOpen }
  );

  const { data: titlesData, isLoading: titlesLoading } = useGetAllTeacherTitle(
    { ...(titleSearchTerm && { search: titleSearchTerm }) },
    { enabled: isOpen }
  );

  const { data: contractTypesData, isLoading: contractTypesLoading } =
    useGetAllContractTypes(
      { ...(contractTypeSearchTerm && { search: contractTypeSearchTerm }) },
      { enabled: isOpen }
    );

  const { data: departmentsData, isLoading: departmentsLoading } =
    useGetAllDepartments(
      { ...(departmentSearchTerm && { search: departmentSearchTerm }) },
      { enabled: isOpen }
    );

  const { data: regionsData, isLoading: regionsLoading } = useGetAllRegions(
    { ...(regionSearchTerm && { search: regionSearchTerm }) },
    { enabled: isOpen }
  );

  const { data: teachingRegionsData, isLoading: teachingRegionsLoading } =
    useGetAllTeachingRegions(
      { ...(teachingRegionSearchTerm && { search: teachingRegionSearchTerm }) },
      { enabled: isOpen }
    );

  const activeFiltersCount =
    MULTI_FILTER_KEYS.reduce(
      (acc, key) => acc + ((appliedFilters[key]?.length || 0) > 0 ? 1 : 0),
      0
    ) +
    // country is a helper for city, so it is not counted
    ["location", "status"].reduce(
      (acc, key) => acc + (appliedFilters[key] !== "all" ? 1 : 0),
      0
    );

  const setMulti = (key) => (value) =>
    setDraftFilters((prev) => ({ ...prev, [key]: value }));

  const handleClearAll = () => {
    const resetObj = createEmptyFilters();
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
          {t("teacherManagement.filters.title", "Filters")}
          {activeFiltersCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-background">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-100 sm:w-120 p-0 bg-sidebar flex flex-col h-full max-h-screen"
      >
        <SheetHeader className="p-6 pb-5 shrink-0 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9.5 h-9.5 rounded-[10px] bg-orange-500/10 flex items-center justify-center shrink-0">
              <SlidersHorizontal size={18} className="text-orange-500" />
            </div>
            <div>
              <SheetTitle className="text-base font-semibold">
                {t("teacherManagement.filters.heading", "Filter Teachers")}
              </SheetTitle>
              <p className="text-xs mt-0.5 text-slate-400">
                {t(
                  "teacherManagement.filters.subheading",
                  "Narrow down the teachers list"
                )}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            <FilterSection
              label={t("teacherManagement.filters.teacherRole", "Lecturer Role")}
            >
              <SearchableMultiSelect
                placeholder={t("teacherManagement.filters.allRoles", "All Roles")}
                searchPlaceholder={t("common.searchRoles", "Search roles...")}
                items={rolesData?.data || []}
                selected={draftFilters.teacher_role}
                onChange={setMulti("teacher_role")}
                onSearch={setRoleSearchTerm}
                isLoading={rolesLoading}
              />
            </FilterSection>

            <FilterSection
              label={t("teacherManagement.filters.academicDegree", "Academic Degree")}
            >
              <SearchableMultiSelect
                placeholder={t("teacherManagement.filters.allDegrees", "All Degrees")}
                searchPlaceholder={t("common.searchTitles", "Search degrees...")}
                items={titlesData?.data || []}
                selected={draftFilters.academic_degree}
                onChange={setMulti("academic_degree")}
                onSearch={setTitleSearchTerm}
                isLoading={titlesLoading}
              />
            </FilterSection>

            <FilterSection
              label={t("teacherManagement.filters.contractType", "Contract Type")}
            >
              <SearchableMultiSelect
                placeholder={t("teacherManagement.filters.allContractTypes", "All Contract Types")}
                searchPlaceholder={t("common.search", "Search...")}
                items={contractTypesData?.data || []}
                selected={draftFilters.contract_type}
                onChange={setMulti("contract_type")}
                onSearch={setContractTypeSearchTerm}
                isLoading={contractTypesLoading}
              />
            </FilterSection>

            <FilterSection
              label={t("teacherManagement.filters.department", "Department")}
            >
              <SearchableMultiSelect
                placeholder={t("teacherManagement.filters.allDepartments", "All Departments")}
                searchPlaceholder={t("common.search", "Search...")}
                items={departmentsData?.data || []}
                selected={draftFilters.department}
                onChange={setMulti("department")}
                onSearch={setDepartmentSearchTerm}
                isLoading={departmentsLoading}
              />
            </FilterSection>

            <FilterSection label={t("teacherManagement.filters.status", "Status")}>
              <Select
                value={draftFilters.status}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, status: val }))
                }
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue placeholder={t("teacherManagement.filters.allStatuses", "All Statuses")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("teacherManagement.filters.allStatuses", "All Statuses")}</SelectItem>
                  <SelectItem value="active">{t("teacherManagement.filters.active", "Active")}</SelectItem>
                  <SelectItem value="inactive">{t("teacherManagement.filters.inactive", "Inactive")}</SelectItem>
                  <SelectItem value="deleted">{t("teacherManagement.filters.deleted", "Deleted")}</SelectItem>
                </SelectContent>
              </Select>
            </FilterSection>
          </div>

          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("teacherManagement.filters.languageAndRegion", "Language & Region")}
            </p>

            <FilterSection
              label={t("teacherManagement.filters.language", "Language of Instruction")}
            >
              <SearchableMultiSelect
                placeholder={t("teacherManagement.filters.allLanguages", "All Languages")}
                searchPlaceholder={t("common.searchLanguages", "Search languages...")}
                items={languagesData?.data || []}
                selected={draftFilters.language}
                onChange={setMulti("language")}
                onSearch={setLanguageSearchTerm}
                isLoading={languagesLoading}
              />
            </FilterSection>

            <FilterSection
              label={t("teacherManagement.filters.motherTongue", "Mother Tongue")}
            >
              <SearchableMultiSelect
                placeholder={t("teacherManagement.filters.allLanguages", "All Languages")}
                searchPlaceholder={t("common.searchLanguages", "Search languages...")}
                items={motherTonguesData?.data || []}
                selected={draftFilters.mother_tongue}
                onChange={setMulti("mother_tongue")}
                onSearch={setMotherTongueSearchTerm}
                isLoading={motherTonguesLoading}
              />
            </FilterSection>

            <FilterSection
              label={t("teacherManagement.filters.region", "Region")}
            >
              <SearchableMultiSelect
                placeholder={t("teacherManagement.filters.allRegions", "All Regions")}
                searchPlaceholder={t("common.search", "Search...")}
                items={regionsData?.data || []}
                selected={draftFilters.region}
                onChange={setMulti("region")}
                onSearch={setRegionSearchTerm}
                isLoading={regionsLoading}
              />
            </FilterSection>

            <FilterSection
              label={t("teacherManagement.filters.teachingRegions", "Regions Where They Teach")}
            >
              <SearchableMultiSelect
                placeholder={t("teacherManagement.filters.allRegions", "All Regions")}
                searchPlaceholder={t("common.search", "Search...")}
                items={teachingRegionsData?.data || []}
                selected={draftFilters.teaching_regions}
                onChange={setMulti("teaching_regions")}
                onSearch={setTeachingRegionSearchTerm}
                isLoading={teachingRegionsLoading}
              />
            </FilterSection>

            <FilterSection
              label={t("teacherManagement.filters.country", "Country (Helper)")}
            >
              <SearchableSelect
                placeholder={t("teacherManagement.filters.selectCountry", "Select Country")}
                searchPlaceholder={t("common.searchCountries", "Search countries...")}
                items={countriesData?.data || []}
                value={draftFilters.country === "all" ? "" : draftFilters.country}
                onChange={(val) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    country: val || "all",
                    location: "all",
                  }))
                }
                onSearch={setCountrySearchTerm}
                isLoading={countriesLoading}
              />
            </FilterSection>

            <FilterSection label={t("teacherManagement.filters.city", "City")}>
              <SearchableSelect
                placeholder={t("teacherManagement.filters.allCities", "All Cities")}
                searchPlaceholder={t("common.searchCities", "Search cities...")}
                items={citiesData?.data || []}
                value={draftFilters.location === "all" ? "" : draftFilters.location}
                onChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, location: val || "all" }))
                }
                onSearch={setCitySearchTerm}
                isLoading={citiesLoading}
                disabled={!selectedCountry && draftFilters.country !== "all"}
              />
            </FilterSection>
          </div>
        </div>

        <SheetFooter className="mt-auto shrink-0 bg-sidebar border-t border-sidebar-border p-6 flex flex-col gap-3">
          <Button
            variant="outline"
            className="w-full border-sidebar-border"
            onClick={handleClearAll}
          >
            {t("teacherManagement.filters.clearAll", "Clear All")}
          </Button>
          <Button className="w-full" onClick={handleApply}>
            {t("teacherManagement.filters.apply", "Apply Filters")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export { MULTI_FILTER_KEYS, SINGLE_FILTER_KEYS };
export default TeacherFilterDrawer;
