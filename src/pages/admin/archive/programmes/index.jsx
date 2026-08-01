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
import { useArchiveProgrammes } from "@/store/useArchiveStore";
import ArchiveGate from "../components/ArchiveGate";

const LEVEL_LABELS = {
  programme_year: "Programme year",
  module: "Module",
  programme: "Programme",
  other: "Other",
};

const ArchiveProgrammes = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, level]);

  const params = {
    page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(level !== "all" ? { level } : {}),
  };

  const { data, isLoading, isFetching, error, refetch } = useArchiveProgrammes(params);
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
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Family</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Status</TableHead>
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
                      {p.inactief ? "Inactive" : "Active"}
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
