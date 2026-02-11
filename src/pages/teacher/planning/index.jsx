import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";
import {
  useGetPlanningByTeacher,
  useUpdateTeacherStatus,
} from "@/store/usePlanningStore";
import StatusBadge from "@/components/StatusBadge";
import { Check, X } from "lucide-react";
import moment from "moment";

const Plannings = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error, refetch,isFetching } = useGetPlanningByTeacher({
    page: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const updateStatusMutation = useUpdateTeacherStatus();

  const sessions = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleStatusUpdate = async (sessionId, status) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: sessionId,
        data: { status },
      });
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder={t("planningManagement.search")}
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("planningManagement.table.program")}</TableHead>
            <TableHead>{t("planningManagement.view.moduleLabel")}</TableHead>
            <TableHead>
              {t("planningManagement.view.sessionNameLabel")}
            </TableHead>
            <TableHead>{t("planningManagement.view.dateLabel")}</TableHead>
            <TableHead>{t("planningManagement.view.timeFromLabel")}</TableHead>
            <TableHead>{t("planningManagement.view.timeTillLabel")}</TableHead>
            <TableHead>{t("planningManagement.view.venueLabel")}</TableHead>
            <TableHead>{t("planningManagement.teacher.language")}</TableHead>
            <TableHead>{t("planningManagement.teacher.location")}</TableHead>
            <TableHead>{t("planningManagement.table.status")}</TableHead>
            <TableHead>{t("planningManagement.teacher.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={11} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center p-8">
                <ErrorMessage
                  message={
                    error?.message ||
                    t("planningManagement.messages.loadFailed")
                  }
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : sessions?.length > 0 ? (
            sessions?.map((session) => (
              <TableRow key={session._id}>
                <TableCell>{session.program_name}</TableCell>
                <TableCell
                  className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap"
                  title={session.module_name}
                >
                  {session.module_name}
                </TableCell>
                <TableCell
                  className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap"
                  title={session.name}
                >
                  {session.name}
                </TableCell>
                <TableCell>
                  {session.session_date
                    ? moment(session.session_date).format("MMM DD, YYYY")
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {session.start_time
                    ? moment(session.start_time).format("HH:mm")
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {session.end_time
                    ? moment(session.end_time).format("HH:mm")
                    : "N/A"}
                </TableCell>
                <TableCell>{session.venue || "N/A"}</TableCell>
                <TableCell>{session.language || "N/A"}</TableCell>
                <TableCell>{session.location || "N/A"}</TableCell>
                <TableCell>
                  <StatusBadge status={session.teacher_status || "pending"} />
                </TableCell>
                <TableCell>
                  {session.teacher_status === "pending" ||
                  !session.teacher_status ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[#49BA6C] bg-[#49BA6C]/10 hover:bg-[#49BA6C]/20 border-none"
                        onClick={() =>
                          handleStatusUpdate(session._id, "accepted")
                        }
                        disabled={updateStatusMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {t("planningManagement.teacher.accept")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[#E7000B] border-none bg-[#E7000B]/10 dark:bg-[#E7000B] hover:bg-[#E7000B]/20"
                        onClick={() =>
                          handleStatusUpdate(session._id, "rejected")
                        }
                        disabled={updateStatusMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-1" />
                        {t("planningManagement.teacher.reject")}
                      </Button>
                    </div>
                  ) : null}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={11} className="text-center">
                {t("planningManagement.table.noPlannings")}
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

export default Plannings;
