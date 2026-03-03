import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Input } from "@/components/ui/input";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useGetTeacherSubmissions } from "@/store/useSubmission";
import StatusBadge from "@/components/StatusBadge";
import { useTranslation } from "react-i18next";
import moment from "moment";
import { useNavigate } from "@tanstack/react-router";

const TeacherSubmissionsTable = ({ submissionType }) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error, refetch, isFetching } = useGetTeacherSubmissions({
    page: page,
    limit: rowsPerPage,
    submission_type: submissionType,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const submissionsData = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleRowClick = (submission) => {
    // navigate({ to: "/teacher/evaluations/$id", params: { id: submission._id } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Input
          placeholder={t("applicationReview.search", {
            defaultValue: "Search student name, email...",
          })}
          className="max-w-xs bg-white dark:bg-sidebar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Submission Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
            {isLoading ? (
              <TableSkeleton rows={rowsPerPage} columns={6} />
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center p-8">
                  <ErrorMessage
                    message={error?.message || "Failed to load submissions"}
                    onRetry={refetch}
                    variant="inline"
                  />
                </TableCell>
              </TableRow>
            ) : submissionsData?.length > 0 ? (
              submissionsData?.map((item) => (
                <TableRow 
                  key={item._id} 
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => handleRowClick(item)}
                >
                  <TableCell>
                    {item?.student ? `${item.student.first_name || ''} ${item.student.last_name || ''}` : 
                     item?.application?.user ? `${item.application.user.first_name || ''} ${item.application.user.last_name || ''}` : "-"}
                  </TableCell>
                  <TableCell
                    className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap"
                    title={item?.component?.name}
                  >
                    {item?.component?.name || "-"}
                  </TableCell>
                  <TableCell
                    className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap"
                    title={item?.program?.name}
                  >
                    {item?.program?.name || "-"}
                  </TableCell>
                  <TableCell
                    className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap"
                    title={item?.batch?.name}
                  >
                    {item?.batch?.name || "-"}
                  </TableCell>
                  <TableCell>
                    {moment(item?.createdAt).format("MMM DD, YYYY")}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item?.status} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center p-4">
                  No submissions found.
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
    </div>
  );
};

export default TeacherSubmissionsTable;
