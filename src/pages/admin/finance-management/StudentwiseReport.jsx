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
import CityReportsFilterDrawer from "./CityReportsFilterDrawer";

const defaultFilters = { status: "all", purpose: "all", from: "", to: "" };

const buildQueryFilters = (filters) => {
  const query = {};
  if (filters.status && filters.status !== "all") query.status = filters.status;
  if (filters.purpose && filters.purpose !== "all") query.purpose = filters.purpose;
  if (filters.from) query.from = filters.from;
  if (filters.to) query.to = filters.to;
  return query;
};

const StudentwiseReport = () => {
  const { t } = useTranslation();
  const { updateBreadcrumbs } = useBreadcrumb();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    updateBreadcrumbs([
      { label: t("common.dashboard"), path: "/admin/dashboard", navigable: false },
      {
        label: t("common.financeReports"),
        path: "/admin/finance-reports",
        navigable: true,
      },
      { label: t("common.studentReports") },
    ]);

    return () => {
      updateBreadcrumbs([]);
    };
  }, [t]);

  const { data, isLoading, error, refetch, isFetching } =
    useGetAnalyticsByStudent({
      page,
      limit: rowsPerPage,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...buildQueryFilters(appliedFilters),
    });

  const students = data?.data || [];
  const totalRows = data?.total_count || 0;

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          {t("common.studentReports")}
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
          <CityReportsFilterDrawer
            draftFilters={draftFilters}
            setDraftFilters={setDraftFilters}
            appliedFilters={appliedFilters}
            setAppliedFilters={setAppliedFilters}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.studentName")}</TableHead>
              <TableHead>{t("common.email")}</TableHead>
              <TableHead>{t("finance.fields.totalRevenue")}</TableHead>
              <TableHead>{t("common.trxCount")}</TableHead>
              <TableHead>{t("common.paid")}</TableHead>
              <TableHead>{t("common.pending")}</TableHead>
              <TableHead>{t("common.failed")}</TableHead>
              <TableHead>{t("finance.purposes.admissionFee")}</TableHead>
              <TableHead>{t("finance.purposes.modulePurchase")}</TableHead>
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
                  <TableCell className="capitalize">
                    {student.last_name || ""} {student.first_name || ""}
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
                  {t("finance.messages.noPaymentAnalyticsFound")}
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
