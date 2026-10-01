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
import { useMemo, useState } from "react";
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

const EMPTY = {
  program_type: "all",
  program_id: "all",
  component_id: "all",
};

export default function ProformaInvoicesFilterDrawer({
  draftFilters,
  setDraftFilters,
  appliedFilters,
  setAppliedFilters,
  setPage,
  filterOptions = { programs: [], modules: [] },
}) {
  const [isOpen, setIsOpen] = useState(false);

  const activeFiltersCount = Object.values(appliedFilters || {}).filter(
    (val) => val && val !== "all"
  ).length;

  const programs = useMemo(() => {
    const list = filterOptions.programs || [];
    if (draftFilters.program_type === "all") return list;
    return list.filter((p) => p.program_type === draftFilters.program_type);
  }, [filterOptions.programs, draftFilters.program_type]);

  const modules = useMemo(() => {
    const list = filterOptions.modules || [];
    if (draftFilters.program_id !== "all") {
      return list.filter((m) => String(m.program_id) === String(draftFilters.program_id));
    }
    if (draftFilters.program_type !== "all") {
      const programIds = new Set(programs.map((p) => String(p._id)));
      return list.filter((m) => programIds.has(String(m.program_id)));
    }
    return list;
  }, [filterOptions.modules, draftFilters.program_id, draftFilters.program_type, programs]);

  const handleClearAll = () => {
    setDraftFilters({ ...EMPTY });
    setAppliedFilters({ ...EMPTY });
    setPage?.(1);
  };

  const handleApply = () => {
    setAppliedFilters({ ...draftFilters });
    setPage?.(1);
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
                Filter invoices
              </SheetTitle>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                Program type, program, and module
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
                  setDraftFilters((prev) => ({
                    ...prev,
                    program_type: val,
                    program_id: "all",
                    component_id: "all",
                  }))
                }
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {PROGRAM_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection label="Program">
              <Select
                value={draftFilters.program_id}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    program_id: val,
                    component_id: "all",
                  }))
                }
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue placeholder="All programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All programs</SelectItem>
                  {programs.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection label="Module">
              <Select
                value={draftFilters.component_id}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, component_id: val }))
                }
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue placeholder="All modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All modules</SelectItem>
                  {modules.map((m) => (
                    <SelectItem key={m._id} value={m._id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

export const EMPTY_PROFORMA_FILTERS = EMPTY;
