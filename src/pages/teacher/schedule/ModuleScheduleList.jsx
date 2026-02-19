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
import { useGetPlanningByModule } from "@/store/usePlanningStore";
import { useNavigate } from "@tanstack/react-router";

const ModuleScheduleList = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { data, isLoading, error, refetch, isFetching } =
    useGetPlanningByModule({
      page: page,
      limit: rowsPerPage,
    });

  const sessions = data?.data || [];
  const totalRows = data?.total_count || 0;
  const handleView = (id) => {
    navigate({
      to: "/teacher/schedules/$id",
      params: { id: id },
    });
  };
  return (
    <div className="space-y-6 mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Batch</TableHead>
            <TableHead>Program</TableHead>
            <TableHead>Module Name</TableHead>
            <TableHead>Location</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody
          className={isFetching ? "opacity-50 pointer-events-none" : ""}
        >
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={4} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center p-8">
                <ErrorMessage
                  message={error?.message || "Failed to load schedules"}
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : sessions?.length > 0 ? (
            sessions?.map((session) => (
              <TableRow
                key={session._id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleView(session?.planning_id)}
              >
                <TableCell>{session?.batch_name || "N/A"}</TableCell>
                <TableCell>{session?.program_name || "N/A"}</TableCell>
                <TableCell>{session?.component_name || "N/A"}</TableCell>
                <TableCell>{session?.venue || "N/A"}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
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

export default ModuleScheduleList;
