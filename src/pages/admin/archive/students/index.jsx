import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { useArchivePersons } from "@/store/useArchiveStore";
import { getArchivePersons } from "@/api/archiveApi";
import { buildCsv, downloadCsv } from "@/utils/exportCsv";
import ArchiveGate from "../components/ArchiveGate";

const ArchiveStudents = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [inactief, setInactief] = useState("all");
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, inactief]);

  const params = {
    page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(inactief !== "all" ? { inactief: inactief === "true" } : {}),
  };

  const { data, isLoading, isFetching, error, refetch } = useArchivePersons(params);
  const persons = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleRowClick = (id) => {
    navigate({ to: "/admin/archive/students/$id", params: { id } });
  };

  const handleExport = async () => {
    const toastId = toast.loading("Preparing CSV export...");
    try {
      const response = await getArchivePersons({
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(inactief !== "all" ? { inactief: inactief === "true" } : {}),
        export: true,
      });
      const rows = response?.data || [];
      if (rows.length === 0) {
        toast.error("No students to export matching applied filters.", { id: toastId });
        return;
      }
      const csv = buildCsv(
        ["Name", "Email", "Phone", "City", "Country", "Status", "Last changed (CoachView)"],
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
          <Select value={inactief} onValueChange={setInactief}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="false">Active</SelectItem>
              <SelectItem value="true">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last changed (CoachView)</TableHead>
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
                      {p.inactief ? "Inactive" : "Active"}
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
