import { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useTableSort } from "@/hooks/useTableSort";
import { useArchivePersonAttendance, useArchivePersonEnrolments } from "@/store/useArchiveStore";

const StatPill = ({ label, value, tone }) => (
  <div className="rounded-lg border border-sidebar-border bg-sidebar px-4 py-2 text-center">
    <p className="text-xs text-gray-400">{label}</p>
    <p className={`text-lg font-semibold ${tone}`}>{value}</p>
  </div>
);

//* `aanwezig IS NULL` means "not yet marked" in CoachView — it is intentionally
//* excluded from the present/absent percentage, never coerced to absent.
const AttendanceTab = ({ personId }) => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [vraagId, setVraagId] = useState("all");
  const [aanwezig, setAanwezig] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { sortBy, sortOrder, handleSort, sortParams } = useTableSort("date", "desc", { setPage });

  //* Options for "which enrolment" come from the enrolments the student
  //* already has — no dedicated facet endpoint needed for this.
  const { data: enrolmentsData } = useArchivePersonEnrolments(personId, { limit: 100 });
  const enrolmentOptions = enrolmentsData?.data || [];

  useEffect(() => {
    setPage(1);
  }, [vraagId, aanwezig, from, to]);

  const filterParams = useMemo(
    () => ({
      ...(vraagId !== "all" ? { vraagId } : {}),
      ...(aanwezig !== "all" ? { aanwezig } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...sortParams,
    }),
    [vraagId, aanwezig, from, to, sortParams],
  );

  const { data, isLoading, error, refetch } = useArchivePersonAttendance(personId, {
    page,
    limit: rowsPerPage,
    ...filterParams,
  });
  const rows = data?.data || [];
  const totalRows = data?.total_count || 0;
  const summary = data?.summary;

  return (
    <div className="space-y-4">
      {summary && (
        <div className="flex flex-wrap gap-3">
          <StatPill label="Aanwezig (Present)" value={summary.present} tone="text-green-600" />
          <StatPill label="Afwezig (Absent)" value={summary.absent} tone="text-red-600" />
          <StatPill label="Niet gemarkeerd (Not marked)" value={summary.unmarked} tone="text-gray-500" />
          <StatPill label="Aanwezigheidspercentage (Attendance rate)" value={summary.pct != null ? `${summary.pct}%` : "—"} tone="text-[#ff8904]" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Select value={vraagId} onValueChange={setVraagId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="All enrolments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All enrolments</SelectItem>
            {enrolmentOptions.map((e) => (
              <SelectItem key={e.cv_id} value={e.cv_id}>
                {e.soort_code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={aanwezig} onValueChange={setAanwezig}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Aanwezig &amp; afwezig (All)</SelectItem>
            <SelectItem value="present">Aanwezig (Present)</SelectItem>
            <SelectItem value="absent">Afwezig (Absent)</SelectItem>
            <SelectItem value="unmarked">Niet gemarkeerd (Not marked)</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" className="w-40" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" className="w-40" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead sortKey="date" activeKey={sortBy} order={sortOrder} onSort={handleSort}>
              Sessiedatum <span className="opacity-60">(Session date)</span>
            </SortableTableHead>
            <SortableTableHead sortKey="session" activeKey={sortBy} order={sortOrder} onSort={handleSort}>
              Sessie <span className="opacity-60">(Session)</span>
            </SortableTableHead>
            <SortableTableHead sortKey="present" activeKey={sortBy} order={sortOrder} onSort={handleSort}>
              Aanwezig <span className="opacity-60">(Present)</span>
            </SortableTableHead>
            <SortableTableHead sortKey="passed" activeKey={sortBy} order={sortOrder} onSort={handleSort}>
              Geslaagd <span className="opacity-60">(Passed)</span>
            </SortableTableHead>
            <SortableTableHead sortKey="exam" activeKey={sortBy} order={sortOrder} onSort={handleSort}>
              Examen <span className="opacity-60">(Exam)</span>
            </SortableTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={5} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center p-8">
                <ErrorMessage message={error?.message || "Failed to load attendance"} onRetry={refetch} variant="inline" />
              </TableCell>
            </TableRow>
          ) : rows.length > 0 ? (
            rows.map((a) => (
              <TableRow key={a.cv_id}>
                <TableCell className="text-gray-500 dark:text-white/60">
                  {a.sessie_datum ? new Date(a.sessie_datum).toLocaleDateString() : "—"}
                </TableCell>
                <TableCell className="max-w-70 truncate" title={a.sessie_naam}>
                  {a.sessie_naam || a.sessie_code || "—"}
                </TableCell>
                <TableCell>
                  {a.aanwezig === 1 ? (
                    <span className="text-green-600 font-medium">Aanwezig (Present)</span>
                  ) : a.aanwezig === 0 ? (
                    <span className="text-red-600 font-medium">Afwezig (Absent)</span>
                  ) : (
                    <span className="text-gray-400">Niet gemarkeerd (Not marked)</span>
                  )}
                </TableCell>
                <TableCell>
                  {a.geslaagd === 1 ? (
                    <span className="text-green-600 font-medium">Ja (Yes)</span>
                  ) : a.geslaagd === 0 ? (
                    <span className="text-red-600 font-medium">Nee (No)</span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell>{a.sessie_examen ? "Examen (Exam)" : "—"}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                No attendance records for this student.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Pagination page={page} setPage={setPage} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} totalRows={totalRows} />
    </div>
  );
};

export default AttendanceTab;
