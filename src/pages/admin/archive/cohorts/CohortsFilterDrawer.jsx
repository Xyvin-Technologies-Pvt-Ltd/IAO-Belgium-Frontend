import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useArchiveFacets } from "@/store/useArchiveStore";
import ArchiveFacetSelect from "../components/ArchiveFacetSelect";
import FilterSection from "../components/FilterSection";

const DEFAULTS = { family: "all", academic_year: "all", target_year: "all", location: "all", is_online: "all", from: "", to: "" };

const CohortsFilterDrawer = ({ draftFilters, setDraftFilters, appliedFilters, setAppliedFilters, setPage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: facetsData } = useArchiveFacets();
  const facets = facetsData?.data;

  const activeFiltersCount = Object.entries(appliedFilters).filter(
    ([, val]) => val !== "all" && val !== "",
  ).length;

  const handleClearAll = () => {
    setDraftFilters(DEFAULTS);
    setAppliedFilters(DEFAULTS);
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
        <Button variant={activeFiltersCount > 0 ? "default" : "outline"} className="relative gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <span
              style={{
                position: "absolute", top: -8, right: -8, background: "#ef4444", color: "#fff",
                fontSize: 11, fontWeight: 700, width: 20, height: 20, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff",
              }}
            >
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-100 sm:w-120 p-0 bg-sidebar flex flex-col h-full max-h-screen">
        <SheetHeader className="p-6 pb-5 shrink-0" style={{ borderBottom: "1px solid var(--sidebar-border, #e8edf3)" }}>
          <div className="flex items-center gap-3">
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,137,4,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <SlidersHorizontal size={18} color="#ff8904" />
            </div>
            <div>
              <SheetTitle className="text-base font-semibold text-sidebar-foreground">
                Filter Opleidingen (Cohorts)
              </SheetTitle>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>Narrow down the cohorts list</p>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            <FilterSection label="Familie (Family)">
              <ArchiveFacetSelect
                items={facets?.cohort_families || []}
                value={draftFilters.family}
                onChange={(v) => setDraftFilters((prev) => ({ ...prev, family: v }))}
                placeholder="All families"
                searchPlaceholder="Search families..."
              />
            </FilterSection>

            <FilterSection label="Studiejaar (Academic year)">
              <ArchiveFacetSelect
                items={facets?.academic_years || []}
                value={draftFilters.academic_year}
                onChange={(v) => setDraftFilters((prev) => ({ ...prev, academic_year: v }))}
                placeholder="All academic years"
                searchPlaceholder="Search years..."
              />
            </FilterSection>

            <FilterSection label="Doeljaar (Target year)">
              <ArchiveFacetSelect
                items={facets?.cohort_target_years || []}
                value={draftFilters.target_year}
                onChange={(v) => setDraftFilters((prev) => ({ ...prev, target_year: v }))}
                placeholder="All target years"
                searchPlaceholder="Search years..."
              />
            </FilterSection>

            <FilterSection label="Plaats (City)">
              <ArchiveFacetSelect
                items={facets?.cohort_locations || []}
                value={draftFilters.location}
                onChange={(v) => setDraftFilters((prev) => ({ ...prev, location: v }))}
                placeholder="All cities"
                searchPlaceholder="Search cities..."
              />
            </FilterSection>

            <FilterSection label="Online">
              <Select value={draftFilters.is_online} onValueChange={(v) => setDraftFilters((prev) => ({ ...prev, is_online: v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value="false">Nee (No)</SelectItem>
                  <SelectItem value="true">Ja (Yes)</SelectItem>
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection label="Eerste sessie van (First session from)">
              <Input
                type="date"
                value={draftFilters.from}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, from: e.target.value }))}
              />
            </FilterSection>
            <FilterSection label="Eerste sessie tot (First session to)">
              <Input
                type="date"
                value={draftFilters.to}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, to: e.target.value }))}
              />
            </FilterSection>
          </div>
        </div>

        <SheetFooter
          className="mt-auto shrink-0"
          style={{ background: "var(--sidebar, #fff)", borderTop: "1px solid var(--sidebar-border, #e8edf3)", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 12 }}
        >
          <Button variant="outline" className="w-full border-sidebar-border" onClick={handleClearAll}>Clear All</Button>
          <Button className="w-full" onClick={handleApply}>Apply Filters</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export { DEFAULTS as COHORTS_FILTER_DEFAULTS };
export default CohortsFilterDrawer;
