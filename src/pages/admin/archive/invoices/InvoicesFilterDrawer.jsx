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
import FilterSection from "../components/FilterSection";

const DEFAULTS = { betaald: "all", from: "", to: "", amount_min: "", amount_max: "" };

const InvoicesFilterDrawer = ({ draftFilters, setDraftFilters, appliedFilters, setAppliedFilters, setPage }) => {
  const [isOpen, setIsOpen] = useState(false);

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
                Filter Facturen (Invoices)
              </SheetTitle>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>Narrow down the invoices list</p>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            <FilterSection label="Status">
              <Select value={draftFilters.betaald} onValueChange={(v) => setDraftFilters((prev) => ({ ...prev, betaald: v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="true">Betaald (Paid)</SelectItem>
                  <SelectItem value="false">Openstaand (Open)</SelectItem>
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection label="Datum van (Date from)">
              <Input
                type="date"
                value={draftFilters.from}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, from: e.target.value }))}
              />
            </FilterSection>
            <FilterSection label="Datum tot (Date to)">
              <Input
                type="date"
                value={draftFilters.to}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, to: e.target.value }))}
              />
            </FilterSection>

            <FilterSection label="Bedrag min (Amount min, €)">
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={draftFilters.amount_min}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, amount_min: e.target.value }))}
              />
            </FilterSection>
            <FilterSection label="Bedrag max (Amount max, €)">
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={draftFilters.amount_max}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, amount_max: e.target.value }))}
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

export { DEFAULTS as INVOICES_FILTER_DEFAULTS };
export default InvoicesFilterDrawer;
