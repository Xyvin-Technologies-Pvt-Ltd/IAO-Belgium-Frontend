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
import { useState } from "react";
import {
  useGetAllCities,
  useGetAllLanguages,
  useGetAllCountries,
} from "@/store/useDropdownStore";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import { PROGRAM_TYPES } from "@/constants/programTypes";

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

const ProgramsFilterDrawer = ({
  draftFilters,
  setDraftFilters,
  appliedFilters,
  setAppliedFilters,
  setPage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const [citySearchTerm, setCitySearchTerm] = useState("");
  const [languageSearchTerm, setLanguageSearchTerm] = useState("");

  const { data: countriesData, isLoading: countriesLoading } =
    useGetAllCountries(
      {
        ...(countrySearchTerm && { search: countrySearchTerm }),
      },
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

  const { data: languagesData, isLoading: languagesLoading } =
    useGetAllLanguages(
      {
        ...(languageSearchTerm && { search: languageSearchTerm }),
      },
      { enabled: isOpen }
    );

  const activeFiltersCount = Object.entries(appliedFilters).filter(
    ([key, val]) => key !== "country" && val !== "all"
  ).length;

  const handleClearAll = () => {
    const resetObj = {
      program_type: "all",
      language: "all",
      city: "all",
      country: "all",
      status: "all",
      is_online: "all",
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

  const programTypes = PROGRAM_TYPES;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant={activeFiltersCount > 0 ? "default" : "outline"}
          className="relative gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
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
                Filter Programs
              </SheetTitle>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                Narrow down the programs list
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            <FilterSection label="Program Type">
              <Select
                value={draftFilters.program_type}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, program_type: val }))
                }
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {programTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection label="Status">
              <Select
                value={draftFilters.status}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, status: val }))
                }
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection label="Online Programme">
              <Select
                value={draftFilters.is_online}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, is_online: val }))
                }
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue placeholder="All Modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="true">Online</SelectItem>
                  <SelectItem value="false">Offline</SelectItem>
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection label="Language">
              <SearchableSelect
                placeholder="All Languages"
                searchPlaceholder="Search languages..."
                items={languagesData?.data || []}
                value={draftFilters.language === "all" ? "" : draftFilters.language}
                onChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, language: val || "all" }))
                }
                onSearch={setLanguageSearchTerm}
                isLoading={languagesLoading}
              />
            </FilterSection>
          </div>

          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "#94a3b8" }}
            >
              Location
            </p>
            <FilterSection label="Country (Helper)">
              <SearchableSelect
                placeholder="Select Country to filter Cities"
                searchPlaceholder="Search countries..."
                items={countriesData?.data || []}
                value={draftFilters.country === "all" ? "" : draftFilters.country}
                onChange={(val) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    country: val || "all",
                    city: "all",
                  }))
                }
                onSearch={setCountrySearchTerm}
                isLoading={countriesLoading}
              />
            </FilterSection>

            <FilterSection label="City">
              <SearchableSelect
                placeholder="All Cities"
                searchPlaceholder="Search cities..."
                items={citiesData?.data || []}
                value={draftFilters.city === "all" ? "" : draftFilters.city}
                onChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, city: val || "all" }))
                }
                onSearch={setCitySearchTerm}
                isLoading={citiesLoading}
                disabled={!selectedCountry && draftFilters.country !== "all"}
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
            Clear All
          </Button>
          <Button className="w-full" onClick={handleApply}>
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default ProgramsFilterDrawer;
