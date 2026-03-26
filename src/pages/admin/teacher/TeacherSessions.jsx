import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/table/Pagination";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import ErrorMessage from "@/components/common/ErrorMessage";
import StatusBadge from "@/components/StatusBadge";
import { useGetSessionsByTeacherId } from "@/store/useTeacherStore";
import { useDebounce } from "@/hooks/useDebounce";
import { formatTZ } from "@/utils/dateUtils";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const TeacherSessions = ({ teacherId }) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, error, refetch, isFetching } =
    useGetSessionsByTeacherId(teacherId, {
      page,
      limit: rowsPerPage,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    });

  const sessions = data?.data || [];
  const totalRows = data?.total_count || 0;

  return (
    <div className="space-y-4">
      <Input
        placeholder={t("planningManagement.search", "Search sessions...")}
        className="max-w-xs"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("planningManagement.table.program", "Program")}</TableHead>
            <TableHead>{t("planningManagement.view.moduleLabel", "Module")}</TableHead>
            <TableHead>{t("planningManagement.view.sessionNameLabel", "Session")}</TableHead>
            <TableHead>{t("planningManagement.view.dateLabel", "Date")}</TableHead>
            <TableHead>{t("planningManagement.view.timeFromLabel", "From")}</TableHead>
            <TableHead>{t("planningManagement.view.timeTillLabel", "Till")}</TableHead>
            <TableHead>{t("planningManagement.view.venueLabel", "Venue")}</TableHead>
            <TableHead>{t("planningManagement.teacher.language", "Language")}</TableHead>
            <TableHead>{t("planningManagement.teacher.location", "Location")}</TableHead>
            <TableHead>{t("planningManagement.table.status", "Status")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={10} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center p-8">
                <ErrorMessage
                  message={error?.message || t("planningManagement.messages.loadFailed", "Failed to load sessions")}
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : sessions.length > 0 ? (
            sessions.map((session) => (
              <TableRow key={session._id}>
                <TableCell>{session.program_name || "N/A"}</TableCell>
                <TableCell
                  className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap"
                  title={session.module_name}
                >
                  {session.module_name || "N/A"}
                </TableCell>
                <TableCell
                  className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap"
                  title={session.name}
                >
                  {session.name || "N/A"}
                </TableCell>
                <TableCell>{formatTZ(session.session_date, "MMM DD, YYYY") || "N/A"}</TableCell>
                <TableCell>{formatTZ(session.start_time, "HH:mm") || "N/A"}</TableCell>
                <TableCell>{formatTZ(session.end_time, "HH:mm") || "N/A"}</TableCell>
                <TableCell>{session.venue || "N/A"}</TableCell>
                <TableCell>{session.language || "N/A"}</TableCell>
                <TableCell>{session.location || "N/A"}</TableCell>
                <TableCell>
                  <StatusBadge status={session.teacher_status || "pending"} />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-sidebar-foreground/60">
                {t("planningManagement.table.noPlannings", "No sessions found")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Pagination
        page={page}
        setPage={setPage}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
        totalRows={totalRows}
      />
    </div>
  );
};

export default TeacherSessions;
