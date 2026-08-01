import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useDebounce } from "@/hooks/useDebounce";
import { useArchiveCohorts } from "@/store/useArchiveStore";
import ArchiveGate from "../components/ArchiveGate";

const ArchiveCohorts = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [isCohort, setIsCohort] = useState("1");
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, isCohort]);

  const params = {
    page,
    limit: rowsPerPage,
    is_cohort: isCohort,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  const { data, isLoading, isFetching, error, refetch } = useArchiveCohorts(params);
  const cohorts = data?.data || [];
  const totalRows = data?.total_count || 0;

  return (
    <ArchiveGate>
      <div className="space-y-6 mt-4">
        <div>
          <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
            Opleidingen <span className="text-sm font-normal text-gray-400">(Cohorts — CoachView archive)</span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-white/60">
            Genuine cohorts (intakes) by default. CoachView also stores module deliveries under this same entity — switch below to see them.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by code or name..."
            className="max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={isCohort} onValueChange={setIsCohort}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Genuine cohorts (intakes)</SelectItem>
              <SelectItem value="0">Module deliveries</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Academic year</TableHead>
              <TableHead>Sessions</TableHead>
              <TableHead>Students</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
            {isLoading ? (
              <TableSkeleton rows={rowsPerPage} columns={6} />
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center p-8">
                  <ErrorMessage message={error?.message || "Failed to load cohorts"} onRetry={refetch} variant="inline" />
                </TableCell>
              </TableRow>
            ) : cohorts.length > 0 ? (
              cohorts.map((c) => (
                <TableRow
                  key={c.opleiding_id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate({ to: "/admin/archive/cohorts/$id", params: { id: c.opleiding_id } })}
                >
                  <TableCell className="font-medium">{c.code}</TableCell>
                  <TableCell>{c.location_name || c.location_code || "—"}</TableCell>
                  <TableCell>{c.cohort_group || "—"}</TableCell>
                  <TableCell>{c.academic_year || "—"}</TableCell>
                  <TableCell>{c.session_count ?? 0}</TableCell>
                  <TableCell>{c.enrollment_count ?? 0}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                  No cohorts found.
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

export default ArchiveCohorts;
