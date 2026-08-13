import { useState, useEffect } from "react";
import { SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SearchableSelect = ({
  label,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  items = [],
  value,
  onChange,
  onSearch,
  onLoadMore,
  hasMore = false,
  isFetchingMore = false,
  error,
  required = false,
  className,
  disabled = false,
  isLoading = false,
  renderItem = null, // optional: (item) => ReactNode
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, onSearch]);

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) {
      setSearchTerm("");
      if (onSearch) {
        onSearch("");
      }
    }
  };

  const handleScroll = (e) => {
    if (!onLoadMore || !hasMore || isFetchingMore) return;
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 48) {
      onLoadMore();
    }
  };

  const showEmptyState = !isLoading && items.length === 0;

  return (
    <div className={cn("min-w-0 space-y-2", className)}>
      {label && (
        <Label
          className={
            required ? "after:content-['*'] after:text-red-500 after:ml-1" : ""
          }
        >
          {label}
        </Label>
      )}

      <Select
        open={isOpen}
        value={value || ""}
        onValueChange={onChange}
        onOpenChange={handleOpenChange}
        disabled={disabled}
      >
        <SelectTrigger
          className={cn(
            "w-full min-w-0 overflow-hidden [&_[data-slot=select-value]]:block [&_[data-slot=select-value]]:truncate",
            error && "border-destructive aria-invalid:ring-destructive/20",
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent
          className="max-h-80 w-[var(--radix-select-trigger-width)] max-w-[var(--radix-select-trigger-width)]"
          position="popper"
          sideOffset={4}
        >
          {/* Search Input */}
          <div className="p-2 border-b border-border sticky top-0 bg-popover z-10">
            <div className="relative">
              <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full min-w-0 pl-8 pr-3 py-1.5 text-sm bg-transparent border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Loading State */}
          {isLoading && items.length === 0 && (
            <div className="p-2 text-sm text-muted-foreground text-center">
              Loading...
            </div>
          )}

          {/* No Results */}
          {showEmptyState && (
            <div className="p-2 text-sm text-muted-foreground text-center">
              No options found
            </div>
          )}

          {/* Options */}
          {items.length > 0 && (
            <div className="max-h-60 overflow-y-auto" onScroll={handleScroll}>
              {isLoading && (
                <div className="p-2 text-sm text-muted-foreground text-center border-b border-border">
                  Loading...
                </div>
              )}
              {items.map((item) => (
                <SelectItem
                  key={item._id}
                  value={String(item._id)}
                  className="whitespace-normal break-words py-2"
                  title={typeof item.name === "string" ? item.name : undefined}
                >
                  {renderItem ? renderItem(item) : item.name}
                </SelectItem>
              ))}
              {(hasMore || isFetchingMore) && (
                <div className="p-2 text-xs text-muted-foreground text-center">
                  {isFetchingMore ? "Loading more..." : "Scroll for more"}
                </div>
              )}
            </div>
          )}
        </SelectContent>
      </Select>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

export default SearchableSelect;
