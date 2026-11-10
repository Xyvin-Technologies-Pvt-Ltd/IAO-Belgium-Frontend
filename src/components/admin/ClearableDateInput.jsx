import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

//* Date input with a clear (×) button that clears only this date
//* (filter drawers: proforma invoices IPB-142, module reports IPB-151)
const ClearableDateInput = ({ value, onChange, min, invalid }) => (
  <div className="relative">
    <Input
      type="date"
      className={`bg-sidebar border-sidebar-border pr-9 ${invalid ? "border-red-500" : ""}`}
      value={value || ""}
      min={min || undefined}
      onChange={(e) => onChange(e.target.value)}
    />
    {value && (
      <button
        type="button"
        aria-label="Clear date"
        onClick={() => onChange("")}
        className="absolute right-8 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    )}
  </div>
);

export default ClearableDateInput;
