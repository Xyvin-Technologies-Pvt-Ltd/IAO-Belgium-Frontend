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
} from "@/store/useDropdownStore";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";

const FilterSection = ({ label, children }) => (
  <div className="space-y-2">
    <label
      className="text-xs font-semibold uppercase tracking-wider text-slate-400"
    >
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
  const [isOpen, setIsOpen] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const [citySearchTerm, setCitySearchTerm] = useState("");
  const [languageSearchTerm, setLanguageSearchTerm] = useState("");
  const [roleSearchTerm, setRoleSearchTerm] = useState("");
  const [titleSearchTerm, setTitleSearchTerm] = useState("");

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

  const { data: rolesData, isLoading: rolesLoading } = useGetAllTeacherRoles(
    { ...(roleSearchTerm && { search: roleSearchTerm }) },
    { enabled: isOpen }
  );

  const { data: titlesData, isLoading: titlesLoading } = useGetAllTeacherTitle(
    { ...(titleSearchTerm && { search: titleSearchTerm }) },
    { enabled: isOpen }
  );

  const activeFiltersCount = Object.entries(appliedFilters).filter(
    ([key, val]) => key !== "country" && val !== "all"
  ).length;

  const handleClearAll = () => {
    const resetObj = {
      location: "all",
      language: "all",
      teacher_role: "all",
      academic_degree: "all",
      country: "all",
      status: "all",
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
          Filters
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
        <SheetHeader
          className="p-6 pb-5 shrink-0 border-b border-sidebar-border"
        >
          <div className="flex items-center gap-3">
            <div className="w-9.5 h-9.5 rounded-[10px] bg-orange-500/10 flex items-center justify-center shrink-0">
              <SlidersHorizontal size={18} className="text-orange-500" />
            </div>
            <div>
              <SheetTitle className="text-base font-semibold">
                Filter Teachers
              </SheetTitle>
              <p className="text-xs mt-0.5 text-slate-400">
                Narrow down the teachers list
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            <FilterSection label="Teacher Role">
              <SearchableSelect
                placeholder="All Roles"
                searchPlaceholder="Search roles..."
                items={rolesData?.data || []}
                value={draftFilters.teacher_role === "all" ? "" : draftFilters.teacher_role}
                onChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, teacher_role: val || "all" }))
                }
                onSearch={setRoleSearchTerm}
                isLoading={rolesLoading}
              />
            </FilterSection>

            <FilterSection label="Academic Degree">
              <SearchableSelect
                placeholder="All Degrees"
                searchPlaceholder="Search degrees..."
                items={titlesData?.data || []}
                value={draftFilters.academic_degree === "all" ? "" : draftFilters.academic_degree}
                onChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, academic_degree: val || "all" }))
                }
                onSearch={setTitleSearchTerm}
                isLoading={titlesLoading}
              />
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>
            </FilterSection>
          </div>

          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Location & Language
            </p>
            
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

            <FilterSection label="Country (Helper)">
              <SearchableSelect
                placeholder="Select Country"
                searchPlaceholder="Search countries..."
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

            <FilterSection label="City">
              <SearchableSelect
                placeholder="All Cities"
                searchPlaceholder="Search cities..."
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

export default TeacherFilterDrawer;
