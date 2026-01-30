import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useGetPlanningByTeacher } from "@/store/usePlanningStore";
import moment from "moment";

const ListView = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data, isLoading, error, refetch } = useGetPlanningByTeacher({
    page: page,
    limit: rowsPerPage,
    status: "accepted",
  });

  const sessions = data?.data || [];
  const totalRows = data?.total_count || 0;

  return (
    <div className="space-y-6 mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Program UID</TableHead>
            <TableHead>Program</TableHead>
            <TableHead>Module Name</TableHead>
            <TableHead>Session Name</TableHead>
            <TableHead>Batch</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Location</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={7} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center p-8">
                <ErrorMessage
                  message={error?.message || "Failed to load schedules"}
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : sessions?.length > 0 ? (
            sessions?.map((session) => (
              <TableRow key={session._id}>
                <TableCell>{session?.program_uid || "N/A"}</TableCell>
                <TableCell>{session?.program_name || "N/A"}</TableCell>
                <TableCell>{session?.module_name || "N/A"}</TableCell>
                <TableCell>{session?.name || "N/A"}</TableCell>
                <TableCell
                  className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap"
                  title={session?.batch_name}
                >
                  {session?.batch_name || "N/A"}
                </TableCell>
                <TableCell>
                  {session.session_date
                    ? moment(session.session_date).format("MMM DD, YYYY")
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {session.start_time && session.end_time
                    ? `${moment(session.start_time).format("HH:mm")} - ${moment(session.end_time).format("HH:mm")}`
                    : "N/A"}
                </TableCell>
                <TableCell>{session?.venue || "N/A"}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                No accepted sessions found
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

export default ListView;
