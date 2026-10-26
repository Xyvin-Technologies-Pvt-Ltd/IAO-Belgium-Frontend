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
import { useCallback, useEffect, useState } from "react";
import { PROGRAM_TYPES } from "@/constants/programTypes";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import { useGetProformaFilterOptions } from "@/store/useProformaStore";

const OPTION_LIMIT = 20;

function NoteFilterSelect({
  field,
  value,
  selectedLabel,
  onChange,
  placeholder,
  searchPlaceholder,
  programType,
  programId,
  enabled,
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);

  const query = {
    field,
    page,
    limit: OPTION_LIMIT,
    ...(search ? { search } : {}),
    ...(field === "program" || field === "module"
      ? {
          ...(programType && programType !== "all" ? { program_type: programType } : {}),
          ...(field === "module" && programId && programId !== "all" ? { program_id: programId } : {}),
        }
      : {}),
  };

  const { data, isFetching } = useGetProformaFilterOptions(query, { enabled });

  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [search, field, programType, programId]);

  useEffect(() => {
    if (!data || Number(data.page) !== page) return;
    const rows = data.data || [];
    setItems((prev) => {
      if (page === 1) return rows;
      const seen = new Set(prev.map((item) => String(item._id)));
      return [...prev, ...rows.filter((item) => !seen.has(String(item._id)))];
    });
  }, [data, page]);

  const total = Number(data?.total_count || 0);
  const hasMore = Number(data?.page) === page && page * OPTION_LIMIT < total;
  const chosen = value && value !== "all" ? String(value) : "";
  const displayItems =
    chosen && !items.some((item) => String(item._id) === chosen)
      ? [{ _id: chosen, name: selectedLabel || chosen }, ...items]
      : items;

  const handleSearch = useCallback((term) => {
    const next = term || "";
    setSearch((current) => (current === next ? current : next));
  }, []);

  return (
    <SearchableSelect
      className="w-full"
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      items={displayItems}
      value={chosen}
      onChange={(next) => {
        const match = displayItems.find((item) => String(item._id) === String(next));
        onChange(next || "all", match?.name || "");
      }}
      onSearch={handleSearch}
      onLoadMore={() => {
        if (!isFetching && hasMore) setPage((current) => current + 1);
      }}
      hasMore={hasMore}
      isFetchingMore={isFetching && page > 1}
      isLoading={isFetching && items.length === 0}
    />
  );
}

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

const EMPTY = {
  program_type: "all",
  program_id: "all",
  component_id: "all",
  role: "all",
  location: "all",
  region: "all",
  payment_status: "all",
};

export default function ProformaInvoicesFilterDrawer({
  draftFilters,
  setDraftFilters,
  appliedFilters,
  setAppliedFilters,
  setPage,
  showPaymentFilter = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState({});

  const activeFiltersCount = Object.entries(appliedFilters || {}).filter(([key, val]) => {
    if (!showPaymentFilter && key === "payment_status") return false;
    return val && val !== "all";
  }).length;

  const rememberLabel = (key, value, name) => {
    setSelectedLabels((prev) => ({
      ...prev,
      [key]: value && value !== "all" ? name || value : "",
    }));
  };

  const isSet = (key) =>
    (draftFilters?.[key] && draftFilters[key] !== "all") ||
    (appliedFilters?.[key] && appliedFilters[key] !== "all");

  const applyPatch = (patch) => {
    setDraftFilters((prev) => ({ ...prev, ...patch }));
    setAppliedFilters((prev) => ({ ...prev, ...patch }));
    setSelectedLabels((prev) => {
      const next = { ...prev };
      Object.keys(patch).forEach((key) => {
        if (!patch[key] || patch[key] === "all") next[key] = "";
      });
      return next;
    });
    setPage?.(1);
  };

  const handleClearAll = () => {
    setDraftFilters({ ...EMPTY });
    setAppliedFilters({ ...EMPTY });
    setSelectedLabels({});
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
                Program, role, location, and region
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            {showPaymentFilter && (
              <FilterSection
                label="Payment status"
                onReset={isSet("payment_status") ? () => applyPatch({ payment_status: "all" }) : null}
              >
                <Select
                  value={draftFilters.payment_status || "all"}
                  onValueChange={(val) =>
                    setDraftFilters((prev) => ({ ...prev, payment_status: val }))
                  }
                >
                  <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </FilterSection>
            )}

            <FilterSection
              label="Program Type"
              onReset={
                isSet("program_type")
                  ? () =>
                      applyPatch({
                        program_type: "all",
                        program_id: "all",
                        component_id: "all",
                      })
                  : null
              }
            >
              <Select
                value={draftFilters.program_type}
                onValueChange={(val) => {
                  setDraftFilters((prev) => ({
                    ...prev,
                    program_type: val,
                    program_id: "all",
                    component_id: "all",
                  }));
                  rememberLabel("program_id", "all", "");
                  rememberLabel("component_id", "all", "");
                }}
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

            <FilterSection
              label="Program"
              onReset={
                isSet("program_id")
                  ? () => applyPatch({ program_id: "all", component_id: "all" })
                  : null
              }
            >
              <NoteFilterSelect
                field="program"
                value={draftFilters.program_id}
                selectedLabel={selectedLabels.program_id}
                placeholder="All programs"
                searchPlaceholder="Search programs..."
                programType={draftFilters.program_type}
                enabled={isOpen}
                onChange={(val, name) => {
                  setDraftFilters((prev) => ({
                    ...prev,
                    program_id: val,
                    component_id: "all",
                  }));
                  rememberLabel("program_id", val, name);
                  rememberLabel("component_id", "all", "");
                }}
              />
            </FilterSection>

            <FilterSection
              label="Module"
              onReset={isSet("component_id") ? () => applyPatch({ component_id: "all" }) : null}
            >
              <NoteFilterSelect
                field="module"
                value={draftFilters.component_id}
                selectedLabel={selectedLabels.component_id}
                placeholder="All modules"
                searchPlaceholder="Search modules..."
                programType={draftFilters.program_type}
                programId={draftFilters.program_id}
                enabled={isOpen}
                onChange={(val, name) => {
                  setDraftFilters((prev) => ({ ...prev, component_id: val }));
                  rememberLabel("component_id", val, name);
                }}
              />
            </FilterSection>

            <FilterSection
              label="Role"
              onReset={isSet("role") ? () => applyPatch({ role: "all" }) : null}
            >
              <NoteFilterSelect
                field="role"
                value={draftFilters.role}
                selectedLabel={selectedLabels.role}
                placeholder="All roles"
                searchPlaceholder="Search roles..."
                enabled={isOpen}
                onChange={(val, name) => {
                  setDraftFilters((prev) => ({ ...prev, role: val }));
                  rememberLabel("role", val, name);
                }}
              />
            </FilterSection>

            <FilterSection
              label="Location"
              onReset={isSet("location") ? () => applyPatch({ location: "all" }) : null}
            >
              <NoteFilterSelect
                field="location"
                value={draftFilters.location}
                selectedLabel={selectedLabels.location}
                placeholder="All locations"
                searchPlaceholder="Search locations..."
                enabled={isOpen}
                onChange={(val, name) => {
                  setDraftFilters((prev) => ({ ...prev, location: val }));
                  rememberLabel("location", val, name);
                }}
              />
            </FilterSection>

            <FilterSection
              label="Region"
              onReset={isSet("region") ? () => applyPatch({ region: "all" }) : null}
            >
              <NoteFilterSelect
                field="region"
                value={draftFilters.region}
                selectedLabel={selectedLabels.region}
                placeholder="All regions"
                searchPlaceholder="Search regions..."
                enabled={isOpen}
                onChange={(val, name) => {
                  setDraftFilters((prev) => ({ ...prev, region: val }));
                  rememberLabel("region", val, name);
                }}
              />
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
