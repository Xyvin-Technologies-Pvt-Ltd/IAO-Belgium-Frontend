import { Fragment, useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import SortableTableHead from "@/components/ui/table/SortableTableHead";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { useDebounce } from "@/hooks/useDebounce";
import { useTableSort } from "@/hooks/useTableSort";
import { useArchiveEntities, useArchiveEntityRows } from "@/store/useArchiveStore";
import ArchiveGate from "../components/ArchiveGate";

const EntityBrowser = () => {
  const params = useParams({ strict: false });
  const entity = params.entity;
  const { updateBreadcrumbs } = useBreadcrumb();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const debouncedSearch = useDebounce(search, 500);

  const { sortBy, sortOrder, handleSort, sortParams } = useTableSort("changed", "desc", { setPage });

  //* label_en for the title — the entities list is already cached, so this
  //* doesn't add a real network call.
  const { data: entitiesData } = useArchiveEntities();
  const meta = entitiesData?.data?.find((e) => e.entity === entity);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    updateBreadcrumbs([
      { label: "CoachView Archive", path: "/admin/archive/entities", navigable: true },
      { label: "All entities", path: "/admin/archive/entities", navigable: true },
      { label: entity, path: "/admin/archive/entities", navigable: false },
    ]);
    return () => updateBreadcrumbs([]);
  }, [entity]);

  const search_disabled = meta?.search_disabled;

  const { data, isLoading, isFetching, error, refetch } = useArchiveEntityRows(entity, {
    page,
    limit: rowsPerPage,
    ...(debouncedSearch && !search_disabled ? { search: debouncedSearch } : {}),
    ...sortParams,
  });
  const rows = data?.data || [];
  const totalRows = data?.total_count || 0;

  return (
    <ArchiveGate>
      <div className="space-y-6 mt-4">
        <div>
          <h2 className="text-xl font-semibold text-dashboard-text dark:text-white capitalize">
            {entity} {meta?.label_en && <span className="text-sm font-normal text-gray-400">({meta.label_en})</span>}
          </h2>
          <p className="text-sm text-gray-500 dark:text-white/60">
            {meta?.description_en || "Raw CoachView JSON, captured verbatim."} Click a row to expand it.
          </p>
        </div>

        {search_disabled ? (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Search is disabled on this table — {totalRows.toLocaleString()} rows makes a full-text scan too slow. Use the
            dedicated Students / Cohorts pages instead, or page through manually.
          </div>
        ) : (
          <Input placeholder="Search raw JSON..." className="max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <SortableTableHead sortKey="key" activeKey={sortBy} order={sortOrder} onSort={handleSort}>
                Sleutel <span className="opacity-60">(Key)</span>
              </SortableTableHead>
              <SortableTableHead sortKey="changed" activeKey={sortBy} order={sortOrder} onSort={handleSort}>
                Gewijzigd <span className="opacity-60">(Last changed)</span>
              </SortableTableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
            {isLoading ? (
              <TableSkeleton rows={rowsPerPage} columns={3} />
            ) : error ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center p-8">
                  <ErrorMessage message={error?.message || "Failed to load rows"} onRetry={refetch} variant="inline" />
                </TableCell>
              </TableRow>
            ) : rows.length > 0 ? (
              rows.map((row) => (
                <Fragment key={row.cv_key}>
                  <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => setExpanded(expanded === row.cv_key ? null : row.cv_key)}>
                    <TableCell className="w-8">
                      {expanded === row.cv_key ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.cv_key}</TableCell>
                    <TableCell className="text-gray-500 dark:text-white/60">
                      {row.gewijzigd_at ? new Date(row.gewijzigd_at).toLocaleString() : "—"}
                    </TableCell>
                  </TableRow>
                  {expanded === row.cv_key && (
                    <TableRow className="bg-gray-50/60 dark:bg-white/5">
                      <TableCell colSpan={3}>
                        <pre className="max-h-96 overflow-auto rounded-lg bg-gray-50 dark:bg-black/40 p-3 text-xs whitespace-pre-wrap break-all">
                          {JSON.stringify(row.payload, null, 2)}
                        </pre>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-gray-400">
                  No rows found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Pagination page={page} setPage={setPage} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} totalRows={totalRows} />
      </div>
    </ArchiveGate>
  );
};

export default EntityBrowser;
