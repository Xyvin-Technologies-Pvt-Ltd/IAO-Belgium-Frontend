import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  setPage,
  rowsPerPage,
  setRowsPerPage,
  totalRows,
  selected,
}) {
  const totalPages = totalRows > 0 ? Math.ceil(totalRows / rowsPerPage) : 1;

  return (
    <div className="flex items-center justify-between px-2 py-2">
      {selected > 0 && (
        <div className="text-sm text-muted-foreground">
          {selected} of {totalRows} row(s) selected.
        </div>
      )}

      <div
        className={`flex items-center space-x-4 ${selected ? "" : "ml-auto"}`}
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm">Rows per page</span>
          <Select
            value={String(rowsPerPage)}
            onValueChange={(value) => {
              setRowsPerPage(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-17.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm">
          {totalRows > 0 ? `Page ${page} of ${totalPages}` : 'No data'}
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage(1)}
            disabled={page === 1 || totalRows === 0}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1 || totalRows === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages || totalRows === 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages || totalRows === 0}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
