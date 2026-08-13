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
  useGetBatches,
  useGetAllPrograms,
  useGetAllAcademicYears,
} from "@/store/useDropdownStore";
import { useGetComponentFilterOptions } from "@/store/useComponentStore";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";

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

const moduleOrdinalLabel = (n) => {
  const num = Number(n);
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return `${num}st Module`;
  if (j === 2 && k !== 12) return `${num}nd Module`;
  if (j === 3 && k !== 13) return `${num}rd Module`;
  return `${num}th Module`;
};

const DEFAULT_FILTERS = {
  module_number: "all",
  status: "active",
  program: "all",
  batch: "all",
  academic: "all",
};

const PlanningFilterDrawer = ({
  draftFilters,
  setDraftFilters,
  appliedFilters,
  setAppliedFilters,
  setPage,
  activeCity,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const [programSearchTerm, setProgramSearchTerm] = useState("");
  const [batchSearchTerm, setBatchSearchTerm] = useState("");

  const { data: programsData, isLoading: programsLoading } = useGetAllPrograms(
    {
      ...(programSearchTerm && { search: programSearchTerm }),
      ...(activeCity && activeCity !== "all" && { city: activeCity }),
    },
    { enabled: isOpen }
  );

  const selectedProgramId = draftFilters.program !== "all" ? draftFilters.program : null;

  const { data: batchesData, isLoading: batchesLoading } = useGetBatches(
    selectedProgramId,
    {
      include_closed: true,
      ...(batchSearchTerm && { search: batchSearchTerm }),
    },
    { enabled: isOpen && !!selectedProgramId }
  );

  const { data: filterOptionsRes, isLoading: moduleOptionsLoading } =
    useGetComponentFilterOptions(
      { program: selectedProgramId, type: "module" },
      { enabled: isOpen && !!selectedProgramId }
    );

  const moduleNumbers = filterOptionsRes?.data?.module_numbers || [];

  const { data: academicYearsData } = useGetAllAcademicYears({}, { enabled: isOpen });

  const activeFiltersCount = Object.entries(appliedFilters).filter(([key, val]) => {
    if (key === "status" && val === "active") return false;
    return val !== "all" && val !== "";
  }).length;

  const handleClearAll = () => {
    const resetObj = { ...DEFAULT_FILTERS };
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
                Filter Plannings
              </SheetTitle>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                Narrow down the plannings list
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
                items={
                  programsData?.data?.map((p) => ({
                    ...p,
                    name: `${p.name} - ${p.language?.name || ""} - ${p.city?.name || ""}`,
                  })) || []
                }
                value={draftFilters.program === "all" ? "" : draftFilters.program || ""}
                onChange={(val) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    program: val || "all",
                    batch: "all",
                    module_number: "all",
                  }))
                }
                onSearch={setProgramSearchTerm}
                isLoading={programsLoading}
              />
            </FilterSection>

            <FilterSection label="Batch">
              <SearchableSelect
                placeholder={selectedProgramId ? "All Batches" : "Select a Program First"}
                searchPlaceholder="Search batches..."
                items={batchesData?.data || []}
                value={draftFilters.batch === "all" ? "" : draftFilters.batch || ""}
                onChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, batch: val || "all" }))
                }
                onSearch={setBatchSearchTerm}
                isLoading={batchesLoading}
                disabled={!selectedProgramId}
              />
            </FilterSection>

            <FilterSection label="Academic Year">
              <Select
                value={draftFilters.academic || "all"}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, academic: val }))
                }
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue placeholder="All Academic Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Academic Years</SelectItem>
                  {(academicYearsData?.data || []).map((ay) => (
                    <SelectItem key={ay._id} value={ay._id}>
                      {ay.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection label="Module Sequence">
              <Select
                value={draftFilters.module_number}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, module_number: val }))
                }
                disabled={!selectedProgramId}
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue
                    placeholder={
                      selectedProgramId ? "All Modules" : "Select a Program First"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {moduleOptionsLoading
                    ? null
                    : moduleNumbers.map((n) => (
                        <SelectItem key={String(n)} value={String(n)}>
                          {moduleOrdinalLabel(n)}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection label="Status">
              <Select
                value={draftFilters.status || "all"}
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
                </SelectContent>
              </Select>
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

export default PlanningFilterDrawer;
export { DEFAULT_FILTERS };
