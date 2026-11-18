import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

//* Finance report export: lets the user pick CSV or Excel (.xlsx)
export default function ReportExportButton({ mutation, filters }) {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={mutation.isPending}>
          <Download className="h-4 w-4" />
          {mutation.isPending
            ? t("common.exporting", "Exporting…")
            : t("common.export", "Export")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => mutation.mutate({ ...filters, format: "csv" })}>
          CSV (.csv)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => mutation.mutate({ ...filters, format: "xlsx" })}>
          Excel (.xlsx)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
