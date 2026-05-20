import { useState, useEffect } from "react";
import { SearchIcon, X, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

const SearchableMultiSelect = ({
  label,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  items = [],
  selected = [],
  onChange,
  onSearch,
  error,
  required = false,
  className,
  disabled = false,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Call onSearch when debounced search term changes
  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, onSearch]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm("");
      }
    }
  };

  const handleSelect = (item) => {
    const isSelected = selected.some(s => s._id === item._id);
    let newSelected;
    
    if (isSelected) {
      newSelected = selected.filter(s => s._id !== item._id);
    } else {
      newSelected = [...selected, item];
    }
    
    onChange(newSelected);
  };

  const handleRemove = (itemId) => {
    const newSelected = selected.filter(s => s._id !== itemId);
    onChange(newSelected);
  };

  const handleClickOutside = (e) => {
    if (!e.target.closest('.searchable-multiselect')) {
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={cn("space-y-2 searchable-multiselect", className)}>
      {label && (
        <Label
          className={
            required ? "after:content-['*'] after:text-red-500 after:ml-1" : ""
          }
        >
          {label}
        </Label>
      )}
      
      <div className="relative">
        {/* Trigger */}
        <div
          onClick={handleToggle}
          className={cn(
            "min-h-9 w-full px-3 py-2 bg-white dark:bg-input/30 border border-input rounded-[6px] transition-colors cursor-pointer flex items-center justify-between gap-2",
            "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive ring-destructive/20",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <div className="flex flex-wrap gap-1 min-h-5 flex-1">
            {selected.length === 0 ? (
              <span className="text-muted-foreground text-sm">{placeholder}</span>
            ) : (
              selected.map((item) => (
                <Badge
                  key={item._id}
                  variant="secondary"
                  className="text-xs flex items-center gap-1"
                >
                  {item.name}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(item._id);
                    }}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50 transition-transform duration-200" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-popover border border-input rounded-md shadow-lg">
           
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
                  autoFocus
                />
              </div>
            </div>

            {isLoading && (
              <div className="p-2 text-sm text-muted-foreground text-center">
                Loading...
              </div>
            )}

            {!isLoading && items.length === 0 && (
              <div className="p-2 text-sm text-muted-foreground text-center">
                No options found
              </div>
            )}

            {!isLoading && items.length > 0 && (
              <div className="max-h-60 overflow-y-auto">
                {items.map((item) => {
                  const isSelected = selected.some(s => s._id === item._id);
                  return (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                        "focus:bg-accent focus:text-accent-foreground focus:outline-none",
                        "flex items-center justify-between",
                        isSelected && "bg-accent/50"
                      )}
                    >
                      <span>{item.name}</span>
                      {isSelected && <Check className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};

export default SearchableMultiSelect;