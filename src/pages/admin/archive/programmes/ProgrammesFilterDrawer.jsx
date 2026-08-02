import { useState } from "react";
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
import { useArchiveFacets } from "@/store/useArchiveStore";
import ArchiveFacetSelect from "../components/ArchiveFacetSelect";
import FilterSection from "../components/FilterSection";

const LEVEL_LABELS = {
  programme_year: "Opleidingsjaar (Programme year)",
  module: "Module",
  programme: "Opleiding (Programme)",
  other: "Overig (Other)",
};

const DEFAULTS = { level: "all", family: "all", target_year: "all", inactief: "all", retake: "all" };

const ProgrammesFilterDrawer = ({ draftFilters, setDraftFilters, appliedFilters, setAppliedFilters, setPage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: facetsData } = useArchiveFacets();
  const facets = facetsData?.data;

  const activeFiltersCount = Object.entries(appliedFilters).filter(([, val]) => val !== "all").length;

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
                Filter Opleidingssoorten (Programmes)
              </SheetTitle>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>Narrow down the programmes list</p>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            <FilterSection label="Niveau (Level)">
              <Select value={draftFilters.level} onValueChange={(v) => setDraftFilters((prev) => ({ ...prev, level: v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection label="Familie (Family)">
              <ArchiveFacetSelect
                items={facets?.programme_families || []}
                value={draftFilters.family}
                onChange={(v) => setDraftFilters((prev) => ({ ...prev, family: v }))}
                placeholder="All families"
                searchPlaceholder="Search families..."
              />
            </FilterSection>

            <FilterSection label="Jaar (Year)">
              <ArchiveFacetSelect
                items={facets?.programme_years || []}
                value={draftFilters.target_year}
                onChange={(v) => setDraftFilters((prev) => ({ ...prev, target_year: v }))}
                placeholder="All years"
                searchPlaceholder="Search years..."
              />
            </FilterSection>

            <FilterSection label="Status">
              <Select value={draftFilters.inactief} onValueChange={(v) => setDraftFilters((prev) => ({ ...prev, inactief: v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="false">Actief (Active)</SelectItem>
                  <SelectItem value="true">Inactief (Inactive)</SelectItem>
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection label="Herkansing (Retake)">
              <Select value={draftFilters.retake} onValueChange={(v) => setDraftFilters((prev) => ({ ...prev, retake: v }))}>
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

export { DEFAULTS as PROGRAMMES_FILTER_DEFAULTS };
export default ProgrammesFilterDrawer;
