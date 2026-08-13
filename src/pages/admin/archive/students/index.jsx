import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { useDebounce } from "@/hooks/useDebounce";
import { useTableSort } from "@/hooks/useTableSort";
import { toast } from "sonner";
import { useArchivePersons } from "@/store/useArchiveStore";
import { getArchivePersons } from "@/api/archiveApi";
import { buildCsv, downloadCsv } from "@/utils/exportCsv";
import { buildCsvHeaders } from "../labels/archiveLabels";
import ArchiveGate from "../components/ArchiveGate";
import StudentsFilterDrawer, { STUDENTS_FILTER_DEFAULTS } from "./StudentsFilterDrawer";

const ArchiveStudents = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const [appliedFilters, setAppliedFilters] = useState(STUDENTS_FILTER_DEFAULTS);
  const [draftFilters, setDraftFilters] = useState(STUDENTS_FILTER_DEFAULTS);

  const { sortBy, sortOrder, handleSort, sortParams } = useTableSort("name", "asc", { setPage });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, appliedFilters]);

  //* Single source for both the list query and the CSV export — the two used
  //* to be built separately and could drift.
  const filterParams = useMemo(
    () => ({
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(appliedFilters.category !== "all" ? { category: appliedFilters.category } : {}),
      ...(appliedFilters.land_code !== "all" ? { land_code: appliedFilters.land_code } : {}),
      ...(appliedFilters.plaats ? { plaats: appliedFilters.plaats } : {}),
      ...(appliedFilters.inactief !== "all" ? { inactief: appliedFilters.inactief === "true" } : {}),
      ...(appliedFilters.verwijderd !== "all" ? { verwijderd: appliedFilters.verwijderd === "true" } : {}),
      ...sortParams,
    }),
    [debouncedSearch, appliedFilters, sortParams],
  );

  const { data, isLoading, isFetching, error, refetch } = useArchivePersons({
    page,
    limit: rowsPerPage,
    ...filterParams,
  });
  const persons = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleRowClick = (id) => {
    navigate({ to: "/admin/archive/students/$id", params: { id } });
  };

  const handleExport = async () => {
    const toastId = toast.loading("Preparing CSV export...");
    try {
      const response = await getArchivePersons({ ...filterParams, export: true });
      const rows = response?.data || [];
      if (rows.length === 0) {
        toast.error("No students to export matching applied filters.", { id: toastId });
        return;
      }
      const csv = buildCsv(
        buildCsvHeaders("students", ["name", "email", "phone", "city", "country", "status", "changed"]),
        rows,
        (r) => [
          r.full_name,
          r.email1,
          r.tel1,
          r.plaats,
          r.land_code,
          r.inactief ? "Inactive" : "Active",
          r.gewijzigd_at,
        ],
      );
      downloadCsv(csv, "coachview_archive_students");
      toast.success("Students exported successfully!", { id: toastId });
    } catch (err) {
      toast.error(err?.message || "Failed to export students.", { id: toastId });
    }
  };

  return (
    <ArchiveGate>
      <div className="space-y-6 mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
              Personen <span className="text-sm font-normal text-gray-400">(Students — CoachView archive)</span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-white/60">
              Read-only history from the legacy CoachView system. Search a student to see their full CoachView record.
            </p>
          </div>
          <Button onClick={handleExport} className="flex items-center gap-2 self-start sm:self-auto">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by name or email..."
            className="max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <StudentsFilterDrawer
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
              <SortableTableHead sortKey="name" activeKey={sortBy} order={sortOrder} onSort={handleSort}>
                Naam <span className="opacity-60">(Name)</span>
              </SortableTableHead>
              <SortableTableHead sortKey="email" activeKey={sortBy} order={sortOrder} onSort={handleSort}>
                E-mail <span className="opacity-60">(Email)</span>
              </SortableTableHead>
              <TableHead>
                Telefoon <span className="opacity-60">(Phone)</span>
              </TableHead>
              <SortableTableHead sortKey="city" activeKey={sortBy} order={sortOrder} onSort={handleSort}>
                Plaats <span className="opacity-60">(City)</span>
              </SortableTableHead>
              <SortableTableHead sortKey="country" activeKey={sortBy} order={sortOrder} onSort={handleSort}>
                Land <span className="opacity-60">(Country)</span>
              </SortableTableHead>
              <SortableTableHead sortKey="status" activeKey={sortBy} order={sortOrder} onSort={handleSort}>
                Status
              </SortableTableHead>
              <SortableTableHead sortKey="changed" activeKey={sortBy} order={sortOrder} onSort={handleSort}>
                Gewijzigd <span className="opacity-60">(Last changed)</span>
              </SortableTableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
            {isLoading ? (
              <TableSkeleton rows={rowsPerPage} columns={7} />
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center p-8">
                  <ErrorMessage message={error?.message || "Failed to load students"} onRetry={refetch} variant="inline" />
                </TableCell>
              </TableRow>
            ) : persons.length > 0 ? (
              persons.map((p) => (
                <TableRow key={p.cv_id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleRowClick(p.cv_id)}>
                  <TableCell className="font-medium">{p.full_name}</TableCell>
                  <TableCell>{p.email1 || "—"}</TableCell>
                  <TableCell>{p.tel1 || "—"}</TableCell>
                  <TableCell>{p.plaats || "—"}</TableCell>
                  <TableCell>{p.land_code || "—"}</TableCell>
                  <TableCell>
                    <span className={p.inactief ? "text-red-500 font-medium" : "text-green-600 font-medium"}>
                      {p.inactief ? "Inactief (Inactive)" : "Actief (Active)"}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-500 dark:text-white/60">
                    {p.gewijzigd_at ? new Date(p.gewijzigd_at).toLocaleDateString() : "—"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                  No students found.
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

export default ArchiveStudents;
