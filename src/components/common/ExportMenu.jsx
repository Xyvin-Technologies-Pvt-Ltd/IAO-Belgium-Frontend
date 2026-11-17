import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

//* Export button that lets the user pick CSV or Excel (.xlsx); calls onExport(format)
export default function ExportMenu({
  onExport,
  isPending = false,
  disabled = false,
  label,
  variant = "outline",
  className = "gap-2",
  ...buttonProps
}) {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button {...buttonProps} variant={variant} className={className} disabled={disabled || isPending}>
          <Download className="h-4 w-4" />
          {isPending ? t("common.exporting", "Exporting…") : label || t("common.export", "Export")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onExport("csv")}>CSV (.csv)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport("xlsx")}>Excel (.xlsx)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
