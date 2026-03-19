import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useGetAllPrograms } from "@/store/useDropdownStore";
import { useGetBatches } from "@/store/useDropdownStore";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";

const FilterSection = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>
      {label}
    </label>
    {children}
  </div>
);

const ModuleScheduleFilterDrawer = ({
  draftFilters,
  setDraftFilters,
  appliedFilters,
  setAppliedFilters,
  setPage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [programSearch, setProgramSearch] = useState("");
  const [batchSearch, setBatchSearch] = useState("");

  const selectedProgram = draftFilters.program !== "all" ? draftFilters.program : null;

  const { data: programsData, isLoading: programsLoading } = useGetAllPrograms(
    { ...(programSearch && { search: programSearch }) },
    { enabled: isOpen }
  );

  const { data: batchesData, isLoading: batchesLoading } = useGetBatches(
    selectedProgram,
    { ...(batchSearch && { search: batchSearch }) },
    { enabled: isOpen && !!selectedProgram }
  );

  const activeFiltersCount = Object.entries(appliedFilters).filter(
    ([key, val]) => key !== "program" && val !== "all"
  ).length;

  const handleClearAll = () => {
    const reset = { program: "all", batch: "all" };
    setDraftFilters(reset);
    setAppliedFilters(reset);
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

      <SheetContent side="right" className="w-100 sm:w-120 p-0 bg-sidebar flex flex-col h-full max-h-screen">
        <SheetHeader
          className="p-6 pb-5 shrink-0"
          style={{ borderBottom: "1px solid var(--sidebar-border, #e8edf3)" }}
        >
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
                Filter Modules
              </SheetTitle>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                Narrow down the module list
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            <FilterSection label="Program">
              <SearchableSelect
                placeholder="All Programs"
                searchPlaceholder="Search programs..."
                items={(programsData?.data || []).map((p) => ({
                  ...p,
                  name: `${p.name} - ${p.city?.name || "N/A"} - ${p.language?.name || "N/A"}`,
                }))}
                value={draftFilters.program === "all" ? "" : draftFilters.program}
                onChange={(val) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    program: val || "all",
                    batch: "all",
                  }))
                }
                onSearch={setProgramSearch}
                isLoading={programsLoading}
              />
            </FilterSection>

            <FilterSection label="Batch">
              <SearchableSelect
                placeholder="All Batches"
                searchPlaceholder="Search batches..."
                items={batchesData?.data || []}
                value={draftFilters.batch === "all" ? "" : draftFilters.batch}
                onChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, batch: val || "all" }))
                }
                onSearch={setBatchSearch}
                isLoading={batchesLoading}
                disabled={!selectedProgram}
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
            display: "flex", flexDirection: "column", gap: 12,
          }}
        >
          <Button variant="outline" className="w-full border-sidebar-border" onClick={handleClearAll}>
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

export default ModuleScheduleFilterDrawer;
