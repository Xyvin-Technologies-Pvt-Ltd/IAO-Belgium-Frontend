import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "@tanstack/react-router";
import StatusBadge from "@/components/StatusBadge";
import { useGetEnrolledStudentsByIntake } from "@/store/useIntakeStore";
import moment from "moment";

const StudentList = () => {
  const params = useParams({ strict: false });
  const id = params.id;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error, refetch } = useGetEnrolledStudentsByIntake(
    id,
    {
      page: page,
      limit: rowsPerPage,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    },
  );

  const students = data?.data || [];
  const totalRows = data?.total_count || 0;
  const handleRowClick = (appId) => {
    navigate({
      to: "/admin/admission-administration/academics/intakes/student/$id",
      params: { id: appId },
    });
  };
  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder={t("studentManagement.search")}
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("studentManagement.table.studentId")}</TableHead>
            <TableHead>{t("studentManagement.table.studentName")}</TableHead>
            <TableHead>{t("studentManagement.table.email")}</TableHead>
            <TableHead>{t("studentManagement.table.batch")}</TableHead>
            <TableHead>{t("studentManagement.table.enrolledDate")}</TableHead>
            <TableHead>{t("studentManagement.table.status")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={6} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center p-8">
                <ErrorMessage
                  message={
                    error?.message || t("studentManagement.messages.loadFailed")
                  }
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : students?.length > 0 ? (
            students?.map((i) => (
              <TableRow
                key={i._id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(i._id)}
              >
                <TableCell>{i?.uid}</TableCell>
                <TableCell>
                  {i?.first_name} {i?.last_name}
                </TableCell>
                <TableCell>{i?.email}</TableCell>
                <TableCell>{i?.batch_name}</TableCell>
                <TableCell>
                  {moment(i?.enrolled_date).format("DD-MM-YYYY")}
                </TableCell>
                <TableCell>
                  <StatusBadge status={i?.status} />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                {t("studentManagement.table.noStudents")}
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

export default StudentList;
