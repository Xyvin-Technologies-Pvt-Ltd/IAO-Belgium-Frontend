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
  useGetAllCountries,
  useGetAllCities,
  useGetAllLanguages,
  useGetAllPrograms,
  useGetProgramsByCitiesAndLanguages,
  useGetBatches,
} from "@/store/useDropdownStore";
import { useTranslation } from "react-i18next";

export const DEFAULT_LOCATION_CHANGES_FILTERS = {
  country: "all",
  city: "all",
  language: "all",
  program: "all",
  batch: "all",
  target_program: "all",
  switched_city: "all",
  switched_batch: "all",
};

const FilterSection = ({ label, children }) => (
  <div className="space-y-2">
    <label
      className="text-xs font-semibold uppercase tracking-wider block"
      style={{ color: "#94a3b8" }}
    >
      {label}
    </label>
    {children}
  </div>
);

const SectionHeader = ({ title }) => (
  <div className="text-sm font-bold border-b border-border pb-1 mb-3 text-primary uppercase tracking-wider">
    {title}
  </div>
);

const LocationChangesFilterDrawer = ({
  draftFilters,
  setDraftFilters,
  appliedFilters,
  setAppliedFilters,
  setPage,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const selectedCountry =
    draftFilters.country && draftFilters.country !== "all"
      ? draftFilters.country
      : null;
  const selectedCity =
    draftFilters.city && draftFilters.city !== "all" ? draftFilters.city : "";
  const selectedLanguage =
    draftFilters.language && draftFilters.language !== "all"
      ? draftFilters.language
      : "";
  const selectedProgramId =
    draftFilters.program !== "all" ? draftFilters.program : null;
  const hasProgramScope = Boolean(selectedCity || selectedLanguage);

  const selectedTargetCity =
    draftFilters.switched_city && draftFilters.switched_city !== "all" ? draftFilters.switched_city : "";
  const selectedTargetProgramId =
    draftFilters.target_program !== "all" ? draftFilters.target_program : null;

  // Origin dropdown queries
  const { data: countriesData } = useGetAllCountries(
    {},
    { enabled: isOpen },
  );

  const { data: citiesData } = useGetAllCities(
    {
      ...(selectedCountry && { country: selectedCountry }),
    },
    { enabled: isOpen && !!selectedCountry },
  );

  const { data: languagesData } = useGetAllLanguages(
    {},
    { enabled: isOpen },
  );

  const { data: allProgramsData } = useGetAllPrograms(
    {},
    { enabled: isOpen && !hasProgramScope },
  );
  const { data: scopedProgramsData } = useGetProgramsByCitiesAndLanguages(
    selectedCity,
    selectedLanguage,
    { enabled: isOpen && hasProgramScope },
  );
  const programsData = hasProgramScope ? scopedProgramsData : allProgramsData;

  const { data: batchesData } = useGetBatches(
    selectedProgramId,
    { include_closed: true },
    { enabled: isOpen && !!selectedProgramId },
  );

  // Target dropdown queries
  const { data: allCitiesData } = useGetAllCities(
    {},
    { enabled: isOpen },
  );

  const { data: allTargetProgramsData } = useGetAllPrograms(
    {},
    { enabled: isOpen && !selectedTargetCity },
  );
  const { data: scopedTargetProgramsData } = useGetProgramsByCitiesAndLanguages(
    selectedTargetCity,
    "",
    { enabled: isOpen && !!selectedTargetCity },
  );
  const targetProgramsData = selectedTargetCity ? scopedTargetProgramsData : allTargetProgramsData;

  const { data: targetBatchesData } = useGetBatches(
    selectedTargetProgramId,
    { include_closed: true },
    { enabled: isOpen && !!selectedTargetProgramId },
  );

  const activeFiltersCount = Object.entries(appliedFilters).filter(
    ([key, val]) => val !== "all" && val !== "",
  ).length;

  const handleClearAll = () => {
    setDraftFilters({ ...DEFAULT_LOCATION_CHANGES_FILTERS });
    setAppliedFilters({ ...DEFAULT_LOCATION_CHANGES_FILTERS });
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
          {t("studentManagement.filters.title", "Filters")}
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
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <SheetTitle className="text-xl font-bold">
              {t("studentManagement.filters.title", "Filters")}
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex-grow overflow-y-auto p-6 space-y-8">
          
          {/* Origin Section */}
          <div className="space-y-4">
            <SectionHeader title={t("studentManagement.filters.originSection", "Origin")} />

            {/* Country */}
            <FilterSection label={t("studentManagement.filters.country", "Country")}>
              <Select
                value={draftFilters.country}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    country: val,
                    city: "all",
                    program: "all",
                    batch: "all",
                  }))
                }
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue placeholder={t("studentManagement.filters.allCountries", "All Countries")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("studentManagement.filters.allCountries", "All Countries")}
                  </SelectItem>
                  {countriesData?.data?.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            {/* City */}
            <FilterSection label={t("studentManagement.filters.city", "City")}>
              <Select
                value={draftFilters.city}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    city: val,
                    program: "all",
                    batch: "all",
                  }))
                }
                disabled={!selectedCountry}
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue
                    placeholder={
                      selectedCountry
                        ? t("studentManagement.filters.allCities", "All Cities")
                        : t("studentManagement.filters.selectCountryFirst", "Select country first")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("studentManagement.filters.allCities", "All Cities")}
                  </SelectItem>
                  {citiesData?.data?.map((city) => (
                    <SelectItem key={city._id} value={city._id}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            {/* Language */}
            <FilterSection label={t("studentManagement.filters.language", "Language")}>
              <Select
                value={draftFilters.language}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    language: val,
                    program: "all",
                    batch: "all",
                  }))
                }
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue placeholder={t("studentManagement.filters.allLanguages", "All Languages")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("studentManagement.filters.allLanguages", "All Languages")}
                  </SelectItem>
                  {languagesData?.data?.map((lang) => (
                    <SelectItem key={lang._id} value={lang._id}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            {/* Origin Program */}
            <FilterSection
              label={t("studentManagement.filters.originProgram", "Origin Programme")}
            >
              <Select
                value={draftFilters.program}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    program: val,
                    batch: "all",
                  }))
                }
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue
                    placeholder={t(
                      "studentManagement.filters.allPrograms",
                      "All Programs",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t(
                      "studentManagement.filters.allPrograms",
                      "All Programs",
                    )}
                  </SelectItem>
                  {programsData?.data?.map((program) => (
                    <SelectItem key={program._id} value={program._id}>
                      {program.name} - {program.city?.name || "N/A"} -{" "}
                      {program.language?.name || "N/A"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            {/* Original Group */}
            <FilterSection label={t("studentManagement.filters.originalGroup", "Original Group")}>
              <Select
                value={draftFilters.batch}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, batch: val }))
                }
                disabled={!selectedProgramId}
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue
                    placeholder={t(
                      "studentManagement.filters.allBatches",
                      "All Groups",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("studentManagement.filters.allBatches", "All Groups")}
                  </SelectItem>
                  {batchesData?.data?.map((batch) => (
                    <SelectItem key={batch._id} value={batch._id}>
                      {batch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>
          </div>

          {/* Target Section */}
          <div className="space-y-4">
            <SectionHeader title={t("studentManagement.filters.targetSection", "Target")} />

            {/* Target City */}
            <FilterSection label={t("studentManagement.filters.switchedCity", "Switched City")}>
              <Select
                value={draftFilters.switched_city}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    switched_city: val,
                    target_program: "all",
                    switched_batch: "all",
                  }))
                }
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue
                    placeholder={t("studentManagement.filters.allCities", "All Cities")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("studentManagement.filters.allCities", "All Cities")}
                  </SelectItem>
                  {allCitiesData?.data?.map((city) => (
                    <SelectItem key={city._id} value={city._id}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            {/* Target Program */}
            <FilterSection label={t("studentManagement.filters.targetProgram", "Target Programme")}>
              <Select
                value={draftFilters.target_program}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    target_program: val,
                    switched_batch: "all",
                  }))
                }
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue
                    placeholder={t("studentManagement.filters.allPrograms", "All Programs")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("studentManagement.filters.allPrograms", "All Programs")}
                  </SelectItem>
                  {targetProgramsData?.data?.map((program) => (
                    <SelectItem key={program._id} value={program._id}>
                      {program.name} - {program.city?.name || "N/A"} -{" "}
                      {program.language?.name || "N/A"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            {/* Switched Group */}
            <FilterSection label={t("studentManagement.filters.switchedGroup", "Switched Group")}>
              <Select
                value={draftFilters.switched_batch}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, switched_batch: val }))
                }
                disabled={!selectedTargetProgramId}
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue
                    placeholder={t(
                      "studentManagement.filters.allBatches",
                      "All Groups",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("studentManagement.filters.allBatches", "All Groups")}
                  </SelectItem>
                  {targetBatchesData?.data?.map((batch) => (
                    <SelectItem key={batch._id} value={batch._id}>
                      {batch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>
          </div>

        </div>

        <SheetFooter
          className="p-6 shrink-0 flex flex-row items-center gap-3"
          style={{ borderTop: "1px solid var(--sidebar-border, #e8edf3)" }}
        >
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClearAll}
          >
            {t("common.clearAll", "Clear All")}
          </Button>
          <Button className="flex-1" onClick={handleApply}>
            {t("common.apply", "Apply")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default LocationChangesFilterDrawer;
