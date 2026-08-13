import { ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { TableHead } from "./table";
import { cn } from "@/lib/utils";

//* A clickable, keyboard-accessible column header. Wraps the existing bare
//* TableHead (unmodified) with a real <button> inside — the previous
//* one-off sort implementation (question-bank) put onClick on the <th>
//* itself, which a keyboard user can't reach.
//*
//* No third "unsorted" state on click: ORDER BY must stay deterministic for
//* stable pagination, so every column always resolves to *some* direction.
//* The neutral chevron only means "you haven't clicked this one yet".
const SortableTableHead = ({
  sortKey,
  activeKey,
  order, // "asc" | "desc"
  onSort, // (key, nextOrder) => void
  defaultOrder = "asc",
  align = "left",
  className,
  children,
}) => {
  const is_active = activeKey === sortKey;
  const aria_sort = is_active ? (order === "asc" ? "ascending" : "descending") : "none";

  const handle_click = () => {
    if (is_active) {
      onSort(sortKey, order === "asc" ? "desc" : "asc");
    } else {
      onSort(sortKey, defaultOrder);
    }
  };

  return (
    <TableHead aria-sort={aria_sort} className={cn("p-0", className)}>
      <button
        type="button"
        onClick={handle_click}
        aria-label={`Sort by ${typeof children === "string" ? children : sortKey}, currently ${aria_sort}`}
        className={cn(
          "group flex h-12 w-full items-center gap-1 px-2 font-normal transition-colors hover:text-dashboard-text dark:hover:text-white",
          align === "right" ? "justify-end" : "justify-start",
        )}
      >
        {children}
        {is_active ? (
          order === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          )
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-30 group-hover:opacity-60" />
        )}
      </button>
    </TableHead>
  );
};

export default SortableTableHead;
