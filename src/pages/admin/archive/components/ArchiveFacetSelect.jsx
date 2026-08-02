import { useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BilingualLabel from "./BilingualLabel";

const MAX_RENDERED = 200;

//* Modelled on src/components/ui/forms/SearchableSelect.jsx, with two
//* deliberate differences:
//*   1. No `key={items.length}-${value}` on <Select> — that remounts the
//*      component on every keystroke once filtering changes items.length,
//*      which closes the dropdown mid-type. Facet lists are frozen for the
//*      session (staleTime: Infinity), so there's nothing to guard against.
//*   2. Filtering is a client-side useMemo, not an onSearch round trip —
//*      the whole list already arrived in one cached call.
//* Items are the facet shape from GET /archive/facets: {value, label_nl, label_en}.
const ArchiveFacetSelect = ({
  items = [],
  value,
  onChange,
  placeholder = "All",
  searchPlaceholder = "Search...",
  disabled = false,
}) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (item) =>
        item.label_nl?.toLowerCase().includes(term) || item.label_en?.toLowerCase().includes(term),
    );
  }, [items, search]);

  const visible = filtered.slice(0, MAX_RENDERED);

  return (
    <Select
      value={value ?? "all"}
      onValueChange={(v) => onChange(v === "all" ? "all" : v)}
      onOpenChange={(open) => !open && setSearch("")}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>

      <SelectContent className="max-h-80" position="popper" sideOffset={4}>
        <div className="sticky top-0 z-10 border-b border-border bg-popover p-2">
          <div className="relative">
            <SearchIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded border border-input bg-transparent py-1.5 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        <SelectItem value="all">{placeholder}</SelectItem>

        {visible.length === 0 && (
          <div className="p-2 text-center text-sm text-muted-foreground">No options found</div>
        )}

        <div className="max-h-60 overflow-y-auto">
          {visible.map((item) => (
            <SelectItem key={item.value} value={String(item.value)}>
              <BilingualLabel nl={item.label_nl} en={item.label_en} />
            </SelectItem>
          ))}
        </div>

        {filtered.length > MAX_RENDERED && (
          <div className="border-t border-border p-2 text-center text-xs text-muted-foreground">
            {filtered.length - MAX_RENDERED} more — refine your search
          </div>
        )}
      </SelectContent>
    </Select>
  );
};

export default ArchiveFacetSelect;
