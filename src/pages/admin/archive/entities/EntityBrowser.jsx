import { Fragment, useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { useDebounce } from "@/hooks/useDebounce";
import { useArchiveEntityRows } from "@/store/useArchiveStore";
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

  const { data, isLoading, isFetching, error, refetch } = useArchiveEntityRows(entity, {
    page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });
  const rows = data?.data || [];
  const totalRows = data?.total_count || 0;

  return (
    <ArchiveGate>
      <div className="space-y-6 mt-4">
        <div>
          <h2 className="text-xl font-semibold text-dashboard-text dark:text-white capitalize">{entity}</h2>
          <p className="text-sm text-gray-500 dark:text-white/60">Raw CoachView JSON, captured verbatim. Click a row to expand it.</p>
        </div>

        <Input placeholder="Search raw JSON..." className="max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead />
              <TableHead>Key</TableHead>
              <TableHead>Last changed (CoachView)</TableHead>
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
