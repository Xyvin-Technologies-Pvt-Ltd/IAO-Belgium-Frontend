import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";
import { useGetLocationChanges } from "@/store/useStudentStore";
import moment from "moment";

const LocationChanges = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, error } = useGetLocationChanges({
    page,
    limit: rowsPerPage,
    search: debouncedSearch,
  });

  const locationOverrides = data?.data || [];
  const totalRows = data?.total_count || 0;

  const columnCount = 5;

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          {t("studentManagement.locationChangesTitle", "Student Location Changes")}
        </h2>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder={t("studentManagement.search", "Search student...")}
            className="max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <ErrorMessage error={error} />
      ) : (
        <div className="rounded-md border border-border bg-card">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold text-dashboard-text/80 dark:text-white/80">
                    {t("studentManagement.student", "Student")}
                  </TableHead>
                  <TableHead className="font-semibold text-dashboard-text/80 dark:text-white/80">
                    {t("studentManagement.module", "Module")}
                  </TableHead>
                  <TableHead className="font-semibold text-dashboard-text/80 dark:text-white/80">
                    {t("studentManagement.originalBatch", "Original Batch")}
                  </TableHead>
                  <TableHead className="font-semibold text-dashboard-text/80 dark:text-white/80">
                    {t("studentManagement.switchedBatch", "Switched Batch")}
                  </TableHead>
                  <TableHead className="font-semibold text-dashboard-text/80 dark:text-white/80">
                    {t("studentManagement.switchDate", "Switch Date")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton columnCount={columnCount} rowCount={rowsPerPage} />
                ) : locationOverrides.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columnCount} className="h-24 text-center text-muted-foreground">
                      {t("studentManagement.noLocationChanges", "No location changes found.")}
                    </TableCell>
                  </TableRow>
                ) : (
                  locationOverrides.map((override) => {
                    const student = override.student || {};
                    const moduleName = override.module?.name || "-";
                    const originalBatchName = override.original_batch?.name || "-";
                    const originalCity = override.original_batch?.city?.name || "";
                    const switchedBatchName = override.switched_batch?.name || "-";
                    const switchedCity = override.switched_batch?.city?.name || "";

                    return (
                      <TableRow key={override._id} className="hover:bg-muted/50 cursor-pointer">
                        <TableCell>
                          <div className="font-medium text-dashboard-text dark:text-white">
                            {student.first_name} {student.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground">{student.email}</div>
                        </TableCell>
                        <TableCell className="text-dashboard-text dark:text-white">
                          {moduleName}
                        </TableCell>
                        <TableCell>
                          <div className="text-dashboard-text dark:text-white">{originalBatchName}</div>
                          {originalCity && (
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-300/10">
                              {originalCity}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-dashboard-text dark:text-white">{switchedBatchName}</div>
                          {switchedCity && (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-700/10 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-300/10">
                              {switchedCity}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-dashboard-text dark:text-white">
                          {override.createdAt ? moment(override.createdAt).format("DD-MM-YYYY HH:mm") : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {!isLoading && locationOverrides.length > 0 && (
            <Pagination
              page={page}
              totalRows={totalRows}
              rowsPerPage={rowsPerPage}
              setPage={setPage}
              setRowsPerPage={setRowsPerPage}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default LocationChanges;
