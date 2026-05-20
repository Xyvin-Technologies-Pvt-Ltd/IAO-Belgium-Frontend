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
  error,
  required = false,
  className,
  disabled = false,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, onSearch]);

  const handleOpenChange = (open) => {
    if (!open) {
      setSearchTerm("");
      if (onSearch) {
        onSearch("");
      }
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
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
        key={`${items.length}-${value}`}
        value={value || ""}
        onValueChange={onChange}
        onOpenChange={handleOpenChange}
        disabled={disabled}
      >
        <SelectTrigger
          className={cn(
            error && "border-destructive aria-invalid:ring-destructive/20",
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent className="max-h-80" position="popper" sideOffset={4}>
          {/* Search Input */}
          <div className="p-2 border-b border-border sticky top-0 bg-popover z-10">
            <div className="relative">
              <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-transparent border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="p-2 text-sm text-muted-foreground text-center">
              Loading...
            </div>
          )}

          {/* No Results */}
          {!isLoading && items.length === 0 && (
            <div className="p-2 text-sm text-muted-foreground text-center">
              No options found
            </div>
          )}

          {/* Options */}
          {!isLoading && items.length > 0 && (
            <div className="max-h-60 overflow-y-auto">
              {items.map((item) => (
                <SelectItem key={item._id} value={item._id}>
                  {item.name}
                </SelectItem>
              ))}
            </div>
          )}
        </SelectContent>
      </Select>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

export default SearchableSelect;
