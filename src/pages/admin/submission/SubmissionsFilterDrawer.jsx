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
import { Filter, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import {
  useGetAllPrograms,
  useGetAllCities,
  useGetAllLanguages,
  useGetBatches,
} from "@/store/useDropdownStore";

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

const Divider = () => (
  <div style={{ height: 1, background: "var(--sidebar-border, #e8edf3)" }} />
);

const SubmissionsFilterDrawer = ({
  draftFilters,
  setDraftFilters,
  appliedFilters,
  setAppliedFilters,
  setPage,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const { data: programsData } = useGetAllPrograms({}, { enabled: isOpen });
  const programs = programsData?.data || [];

  const { data: citiesData } = useGetAllCities({}, { enabled: isOpen });
  const cities = citiesData?.data || [];

  const { data: languagesData } = useGetAllLanguages({}, { enabled: isOpen });
  const languages = languagesData?.data || [];

  const selectedProgramId =
    draftFilters.program !== "all" ? draftFilters.program : null;
  const { data: batchesData } = useGetBatches(
    selectedProgramId,
    {},
    { enabled: !!selectedProgramId },
  );
  const batches = batchesData?.data || [];

  const activeFiltersCount = Object.entries(appliedFilters).filter(
    ([, val]) => val !== "all",
  ).length;

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
        {/* Header */}
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
                Filter Submissions
              </SheetTitle>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                Narrow down the submissions list
              </p>
            </div>
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          {/* Submission filters group */}
          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "#94a3b8" }}
            >
              Submission
            </p>
            <div className="grid grid-cols-1 gap-4">
              <FilterSection label="Type">
                <Select
                  value={draftFilters.submission_type}
                  onValueChange={(val) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      submission_type: val,
                    }))
                  }
                >
                  <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="scientific_research_intro">Scientific Research Intro</SelectItem>
                    <SelectItem value="peer_groups">Peer Groups</SelectItem>
                    <SelectItem value="internships">Internship</SelectItem>
                    <SelectItem value="essays">Essay</SelectItem>
                    <SelectItem value="case_studies">Case Study</SelectItem>
                  </SelectContent>
                </Select>
              </FilterSection>
            </div>
          </div>

          {/* Academic filters group */}
          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "#94a3b8" }}
            >
              Academic
            </p>
            <div className="space-y-4">
              <FilterSection label="Program">
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
                    <span className="block truncate max-w-[90%] text-left">
                      <SelectValue placeholder="All Programs" />
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {programs.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.name} {p.city?.name ? `- ${p.city.name}` : ""} {p.language?.name ? `(${p.language.name})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterSection>

              <FilterSection label="Batch">
                <Select
                  value={draftFilters.batch}
                  onValueChange={(val) =>
                    setDraftFilters((prev) => ({ ...prev, batch: val }))
                  }
                  disabled={!selectedProgramId}
                >
                  <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                    <SelectValue
                      placeholder={
                        selectedProgramId
                          ? "All Batches"
                          : "Select a Program first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Batches</SelectItem>
                    {batches.map((b) => (
                      <SelectItem key={b._id} value={b._id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterSection>
            </div>
          </div>

          {/* Location & Language filters group */}
          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "#94a3b8" }}
            >
              Location & Language
            </p>
            <div className="space-y-4">
              <FilterSection label="City">
                <Select
                  value={draftFilters.city}
                  onValueChange={(val) =>
                    setDraftFilters((prev) => ({ ...prev, city: val }))
                  }
                >
                  <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterSection>

              <FilterSection label="Language">
                <Select
                  value={draftFilters.language}
                  onValueChange={(val) =>
                    setDraftFilters((prev) => ({ ...prev, language: val }))
                  }
                >
                  <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                    <SelectValue placeholder="All Languages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    {languages.map((l) => (
                      <SelectItem key={l._id} value={l._id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterSection>
            </div>
          </div>
        </div>

        {/* Footer */}
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
            onClick={() => {
              const resetObj = {
                submission_type: "all",
                program: "all",
                batch: "all",
                city: "all",
                language: "all",
              };
              setDraftFilters(resetObj);
              setAppliedFilters(resetObj);
              setPage(1);
            }}
          >
            Clear All
          </Button>
          <SheetClose asChild>
            <Button
              className="w-full"
              onClick={() => {
                setAppliedFilters(draftFilters);
                setPage(1);
              }}
            >
              Apply Filters
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default SubmissionsFilterDrawer;
