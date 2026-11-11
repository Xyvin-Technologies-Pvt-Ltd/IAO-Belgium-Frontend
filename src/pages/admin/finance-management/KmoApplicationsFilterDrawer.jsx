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
import { useCallback, useMemo, useState } from "react";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import { useGetAllPrograms, useGetBatches } from "@/store/useDropdownStore";

//* IPB-145: KMO applications filters — same layout / behaviour as the
//* "Filter invoices" panel on Teacher Proforma Expense Notes.

const FilterSection = ({ label, onReset, children }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between gap-2">
      <label
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: "#94a3b8" }}
      >
        {label}
      </label>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-medium text-primary hover:underline"
        >
          Reset
        </button>
      )}
    </div>
    {children}
  </div>
);

export const EMPTY_KMO_FILTERS = {
  status: "all",
  program: "all",
  batch: "all",
};

//* IPB-143 statuses (stored value → label)
const KMO_STATUS_FILTER_OPTIONS = [
  { value: "waiting", label: "Incomplete" },
  { value: "submitted", label: "Submitted" },
  { value: "contribution_received", label: "Student Paid" },
  { value: "paid", label: "Paid" },
  { value: "rejected", label: "Rejected" },
];

//* Static options with local search (SearchableSelect only searches via onSearch)
function OptionSelect({ items, value, onChange, placeholder, searchPlaceholder }) {
  const [term, setTerm] = useState("");
  const handleSearch = useCallback((next) => setTerm(next || ""), []);
  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    return q ? items.filter((item) => item.name.toLowerCase().includes(q)) : items;
  }, [items, term]);
  return (
    <SearchableSelect
      className="w-full"
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      items={filtered}
      value={value && value !== "all" ? String(value) : ""}
      onChange={(next) => onChange(next || "all")}
      onSearch={handleSearch}
    />
  );
}

export default function KmoApplicationsFilterDrawer({
  draftFilters,
  setDraftFilters,
  appliedFilters,
  setAppliedFilters,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: programsData } = useGetAllPrograms();
  const programItems = useMemo(
    () =>
      (programsData?.data || []).map((prog) => ({
        _id: prog._id,
        name: `${prog.name} - ${prog.city?.name || "N/A"} - ${prog.language?.name || "N/A"}`,
      })),
    [programsData],
  );

  //* Batches of the programme chosen in the panel; closed intakes included (IPB-144)
  const draftProgramId = draftFilters.program !== "all" ? draftFilters.program : null;
  const { data: batchesData } = useGetBatches(
    draftProgramId,
    { include_closed: true },
    { enabled: !!draftProgramId },
  );
  const batchItems = useMemo(
    () =>
      (batchesData?.data || []).map((b) => ({
        _id: b._id,
        //* Academic year tells apart groups that share a name
        name: b.intake?.academic?.name ? `${b.name} (${b.intake.academic.name})` : b.name,
      })),
    [batchesData],
  );

  const activeFiltersCount = Object.values(appliedFilters || {}).filter(
    (val) => val && val !== "all",
  ).length;

  const isSet = (key) =>
    (draftFilters?.[key] && draftFilters[key] !== "all") ||
    (appliedFilters?.[key] && appliedFilters[key] !== "all");

  const applyPatch = (patch) => {
    setDraftFilters((prev) => ({ ...prev, ...patch }));
    setAppliedFilters((prev) => ({ ...prev, ...patch }));
  };

  const handleClearAll = () => {
    setDraftFilters({ ...EMPTY_KMO_FILTERS });
    setAppliedFilters({ ...EMPTY_KMO_FILTERS });
  };

  const handleApply = () => {
    setAppliedFilters({ ...draftFilters });
    setIsOpen(false);
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        //* Open the panel on the filters that are currently applied
        if (open) setDraftFilters({ ...appliedFilters });
        setIsOpen(open);
      }}
    >
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
                Filter applications
              </SheetTitle>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                Status, program and batch
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            <FilterSection
              label="Status"
              onReset={isSet("status") ? () => applyPatch({ status: "all" }) : null}
            >
              <Select
                value={draftFilters.status || "all"}
                onValueChange={(val) => setDraftFilters((prev) => ({ ...prev, status: val }))}
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {KMO_STATUS_FILTER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection
              label="Program"
              onReset={
                isSet("program") || isSet("batch")
                  ? () => applyPatch({ program: "all", batch: "all" })
                  : null
              }
            >
              <OptionSelect
                items={programItems}
                value={draftFilters.program}
                placeholder="All programs"
                searchPlaceholder="Search programs..."
                onChange={(val) =>
                  //* A batch belongs to one programme — reset it when the programme changes
                  setDraftFilters((prev) => ({ ...prev, program: val, batch: "all" }))
                }
              />
            </FilterSection>

            <FilterSection
              label="Batch"
              onReset={isSet("batch") ? () => applyPatch({ batch: "all" }) : null}
            >
              {draftProgramId ? (
                <OptionSelect
                  items={batchItems}
                  value={draftFilters.batch}
                  placeholder="All batches"
                  searchPlaceholder="Search batches..."
                  onChange={(val) => setDraftFilters((prev) => ({ ...prev, batch: val }))}
                />
              ) : (
                <p className="text-xs" style={{ color: "#94a3b8" }}>
                  Select a program first
                </p>
              )}
            </FilterSection>
          </div>
        </div>

        <SheetFooter
          className="p-6 pt-4 shrink-0 flex-row gap-3 sm:space-x-0"
          style={{ borderTop: "1px solid var(--sidebar-border, #e8edf3)" }}
        >
          <Button variant="outline" className="flex-1" onClick={handleClearAll}>
            Clear all
          </Button>
          <SheetClose asChild>
            <Button className="flex-1" onClick={handleApply}>
              Apply filters
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
