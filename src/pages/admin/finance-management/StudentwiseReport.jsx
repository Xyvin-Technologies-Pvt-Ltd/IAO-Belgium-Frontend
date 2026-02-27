import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";
import { useGetAnalyticsByStudent } from "@/store/usePaymentStore";
import { useBreadcrumb } from "@/context/BreadCrumbContext";

const StudentwiseReport = () => {
  const { t } = useTranslation();
   const { updateBreadcrumbs } = useBreadcrumb();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  useEffect(() => {
    updateBreadcrumbs([
      { label: "Dashboard", path: "/admin/dashboard", navigable: false },
      {
        label: "Finance Reports",
        path: "/admin/finance-reports",
        navigable: true,
      },
      { label: "Student Reports" },
    ]);

    return () => {
      updateBreadcrumbs([]);
    };
  }, []);
  const { data, isLoading, error, refetch, isFetching } =
    useGetAnalyticsByStudent({
      page: page,
      limit: rowsPerPage,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    });

  const students = data?.data || [];
  const totalRows = data?.total_count || 0;

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          Student Reports
        </h2>
      </div>

      <div className="space-y-4">
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
              <TableHead>Student Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Total Revenue</TableHead>
              <TableHead>Trx Count</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Pending</TableHead>
              <TableHead>Failed</TableHead>
              <TableHead>Admission Fee</TableHead>
              <TableHead>Module Purchase</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody
            className={isFetching ? "opacity-50 pointer-events-none" : ""}
          >
            {isLoading ? (
              <TableSkeleton rows={rowsPerPage} columns={9} />
            ) : error ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center p-8">
                  <ErrorMessage
                    message={
                      error?.message ||
                      t("studentManagement.messages.loadFailed")
                    }
                    onRetry={refetch}
                    variant="inline"
                  />
                </TableCell>
              </TableRow>
            ) : students?.length > 0 ? (
              students?.map((student) => (
                <TableRow key={student._id}>
                  <TableCell className="font-medium">
                    {student.first_name || ""} {student.last_name || ""}
                  </TableCell>
                  <TableCell>{student.email || "-"}</TableCell>
                  <TableCell>
                    EUR {student.total_amount?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell>{student.total_count || 0}</TableCell>
                  <TableCell className="text-green-600">
                    {student.paid_count || 0}
                  </TableCell>
                  <TableCell style={{ color: "#ff8904" }}>
                    {student.pending_count || 0}
                  </TableCell>
                  <TableCell className="text-red-600">
                    {student.failed_count || 0}
                  </TableCell>
                  <TableCell>
                    EUR {(student.admission_fee_amount || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    EUR {(student.module_purchase_amount || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  No payment analytics found
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

export default StudentwiseReport;
