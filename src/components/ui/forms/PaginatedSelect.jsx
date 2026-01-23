import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const PaginatedSelect = ({
  label,
  placeholder,
  items = [],
  value,
  onChange,
  page,
  setPage,
  total = 0,
  limit = 10,
  error,
  required = false,
  disabled = false,
  emptyMessage = "No items available",
}) => {
  const totalPages = Math.ceil(total / limit);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      <Select
        key={value || "empty"}
        value={value || ""}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger className={error ? "border-red-500" : ""}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent
          position="popper"
          sideOffset={4}
          className="w-[var(--radix-select-trigger-width)]"
        >
          <div className="max-h-[300px] overflow-y-auto">
            {items.length > 0 ? (
              items.map((item) => (
                <SelectItem key={item._id} value={item._id}>
                  {item.name}
                </SelectItem>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {emptyMessage}
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

export default PaginatedSelect;