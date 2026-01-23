import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const PaginatedMultiSelect = ({
  label,
  placeholder,
  items = [],
  selected = [],
  onChange,
  page,
  setPage,
  total = 0,
  limit = 10,
  error,
}) => {
  const totalPages = Math.ceil(total / limit);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const toggleItem = (item) => {
    const exists = selected.some((s) => s._id === item._id);
    onChange(
      exists
        ? selected.filter((s) => s._id !== item._id)
        : [...selected, item]
    );
  };

  const removeItem = (id) => {
    onChange(selected.filter((s) => s._id !== id));
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label} <span className="text-red-500">*</span>
      </Label>

      <Select
        value=""
        onValueChange={(id) => {
          const item = items.find((i) => i._id === id);
          if (item) toggleItem(item);
        }}
      >
        <SelectTrigger className={error ? "border-red-500" : ""}>
          <div className="flex flex-wrap gap-1 w-full">
            {selected.length > 0 ? (
              <>
                {selected.map((item) => (
                  <Badge
                    key={item._id}
                    variant="secondary"
                    className="flex items-center gap-1 text-xs px-2 py-1"
                  >
                    {item.name}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-3 w-3 p-0 hover:bg-transparent ml-1"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeItem(item._id);
                      }}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                ))}
                <span className="text-sm text-muted-foreground ml-2 self-center">
                  Click to add more...
                </span>
              </>
            ) : (
              <SelectValue placeholder={placeholder} />
            )}
          </div>
        </SelectTrigger>

        <SelectContent
          position="popper"
          sideOffset={4}
          className="w-[var(--radix-select-trigger-width)]"
        >
          <div className="max-h-[300px] overflow-y-auto">
            {items.length > 0 ? (
              items.map((item) => {
                const isSelected = selected.some((s) => s._id === item._id);
                return (
                  <SelectItem key={item._id} value={item._id} className="cursor-pointer">
                    <div className="flex items-center justify-between w-full">
                      <span>{item.name}</span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400 ml-2" />
                      )}
                    </div>
                  </SelectItem>
                );
              })
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No items available
              </div>
            )}
          </div>

          {total > limit && (
            <div className="flex items-center justify-center gap-2 px-2 py-2 border-t bg-background sticky bottom-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  setPage((prev) => Math.max(1, prev - 1));
                }}
                disabled={!hasPrev}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  setPage((prev) => prev + 1);
                }}
                disabled={!hasNext}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </SelectContent>
      </Select>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default PaginatedMultiSelect;
