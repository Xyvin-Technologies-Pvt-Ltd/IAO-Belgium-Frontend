import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import SortableTableHead from "@/components/ui/table/SortableTableHead";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useTableSort } from "@/hooks/useTableSort";
import { useArchiveProgrammes } from "@/store/useArchiveStore";
import ArchiveGate from "../components/ArchiveGate";
import ProgrammesFilterDrawer, { PROGRAMMES_FILTER_DEFAULTS } from "./ProgrammesFilterDrawer";

const LEVEL_LABELS = {
  programme_year: "Opleidingsjaar (Programme year)",
  module: "Module",
  programme: "Opleiding (Programme)",
  other: "Overig (Other)",
};

const ArchiveProgrammes = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const [appliedFilters, setAppliedFilters] = useState(PROGRAMMES_FILTER_DEFAULTS);
  const [draftFilters, setDraftFilters] = useState(PROGRAMMES_FILTER_DEFAULTS);

  const { sortBy, sortOrder, handleSort, sortParams } = useTableSort("code", "asc", { setPage });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, appliedFilters]);

  const filterParams = useMemo(
    () => ({
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(appliedFilters.level !== "all" ? { level: appliedFilters.level } : {}),
      ...(appliedFilters.family !== "all" ? { family: appliedFilters.family } : {}),
      ...(appliedFilters.target_year !== "all" ? { target_year: appliedFilters.target_year } : {}),
      ...(appliedFilters.inactief !== "all" ? { inactief: appliedFilters.inactief === "true" } : {}),
      ...(appliedFilters.retake !== "all" ? { retake: appliedFilters.retake === "true" } : {}),
      ...sortParams,
    }),
    [debouncedSearch, appliedFilters, sortParams],
  );

  const { data, isLoading, isFetching, error, refetch } = useArchiveProgrammes({
    page,
    limit: rowsPerPage,
    ...filterParams,
  });
  const programmes = data?.data || [];
  const totalRows = data?.total_count || 0;

  return (
    <ArchiveGate>
      <div className="space-y-6 mt-4">
        <div>
          <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
            Opleidingssoorten <span className="text-sm font-normal text-gray-400">(Programmes — CoachView archive)</span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-white/60">Programme years and modules from the legacy catalogue.</p>
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by code or name..."
            className="max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ProgrammesFilterDrawer
            draftFilters={draftFilters}
            setDraftFilters={setDraftFilters}
            appliedFilters={appliedFilters}
            setAppliedFilters={setAppliedFilters}
            setPage={setPage}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead sortKey="code" activeKey={sortBy} order={sortOrder} onSort={handleSort}>Code</SortableTableHead>
              <SortableTableHead sortKey="name" activeKey={sortBy} order={sortOrder} onSort={handleSort}>
                Naam <span className="opacity-60">(Name)</span>
              </SortableTableHead>
              <SortableTableHead sortKey="level" activeKey={sortBy} order={sortOrder} onSort={handleSort}>
                Niveau <span className="opacity-60">(Level)</span>
              </SortableTableHead>
              <SortableTableHead sortKey="family" activeKey={sortBy} order={sortOrder} onSort={handleSort}>
                Familie <span className="opacity-60">(Family)</span>
              </SortableTableHead>
              <SortableTableHead sortKey="year" activeKey={sortBy} order={sortOrder} onSort={handleSort}>
                Jaar <span className="opacity-60">(Year)</span>
              </SortableTableHead>
              <SortableTableHead sortKey="status" activeKey={sortBy} order={sortOrder} onSort={handleSort}>Status</SortableTableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
            {isLoading ? (
              <TableSkeleton rows={rowsPerPage} columns={6} />
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center p-8">
                  <ErrorMessage message={error?.message || "Failed to load programmes"} onRetry={refetch} variant="inline" />
                </TableCell>
              </TableRow>
            ) : programmes.length > 0 ? (
              programmes.map((p) => (
                <TableRow
                  key={p.cv_id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate({ to: "/admin/archive/programmes/$id", params: { id: p.cv_id } })}
                >
                  <TableCell className="font-medium">{p.code}</TableCell>
                  <TableCell className="max-w-[320px] truncate" title={p.naam}>
                    {p.naam}
                  </TableCell>
                  <TableCell>{LEVEL_LABELS[p.level] || p.level || "—"}</TableCell>
                  <TableCell>{p.cv_family || "—"}</TableCell>
                  <TableCell>{p.target_year ?? "—"}</TableCell>
                  <TableCell>
                    <span className={p.inactief ? "text-red-500 font-medium" : "text-green-600 font-medium"}>
                      {p.inactief ? "Inactief (Inactive)" : "Actief (Active)"}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                  No programmes found.
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

export default ArchiveProgrammes;
