import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useArchivePersonAttendance } from "@/store/useArchiveStore";

const StatPill = ({ label, value, tone }) => (
  <div className="rounded-lg border border-sidebar-border bg-sidebar px-4 py-2 text-center">
    <p className="text-xs text-gray-400">{label}</p>
    <p className={`text-lg font-semibold ${tone}`}>{value}</p>
  </div>
);

//* `aanwezig IS NULL` means "not yet marked" in CoachView — it is intentionally
//* excluded from the present/absent percentage, never coerced to absent.
const AttendanceTab = ({ personId }) => {
  const { data, isLoading, error, refetch } = useArchivePersonAttendance(personId, { limit: 100 });
  const rows = data?.data || [];
  const summary = data?.summary;

  return (
    <div className="space-y-4">
      {summary && (
        <div className="flex flex-wrap gap-3">
          <StatPill label="Present" value={summary.present} tone="text-green-600" />
          <StatPill label="Absent" value={summary.absent} tone="text-red-600" />
          <StatPill label="Not marked" value={summary.unmarked} tone="text-gray-500" />
          <StatPill label="Attendance rate" value={summary.pct != null ? `${summary.pct}%` : "—"} tone="text-[#ff8904]" />
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Session date</TableHead>
            <TableHead>Session</TableHead>
            <TableHead>Present</TableHead>
            <TableHead>Passed</TableHead>
            <TableHead>Exam</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton rows={5} columns={5} />
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
                <TableCell className="max-w-[280px] truncate" title={a.sessie_naam}>
                  {a.sessie_naam || a.sessie_code || "—"}
                </TableCell>
                <TableCell>
                  {a.aanwezig === 1 ? (
                    <span className="text-green-600 font-medium">Present</span>
                  ) : a.aanwezig === 0 ? (
                    <span className="text-red-600 font-medium">Absent</span>
                  ) : (
                    <span className="text-gray-400">Not marked</span>
                  )}
                </TableCell>
                <TableCell>
                  {a.geslaagd === 1 ? (
                    <span className="text-green-600 font-medium">Yes</span>
                  ) : a.geslaagd === 0 ? (
                    <span className="text-red-600 font-medium">No</span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell>{a.sessie_examen ? "Exam" : "—"}</TableCell>
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
    </div>
  );
};

export default AttendanceTab;
