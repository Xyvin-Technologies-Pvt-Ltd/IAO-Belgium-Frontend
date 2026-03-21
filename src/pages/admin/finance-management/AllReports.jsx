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
import StatusBadge from "@/components/StatusBadge";
import { useGetPayments } from "@/store/usePaymentStore";
import moment from "moment";
import AllReportsFilterDrawer from "./AllReportsFilterDrawer";

const AllReports = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ status: "all", purpose: "all", from: "", to: "" });
  const [draftFilters, setDraftFilters] = useState({ status: "all", purpose: "all", from: "", to: "" });

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error, refetch, isFetching } = useGetPayments({
    page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(appliedFilters.status !== "all" ? { status: appliedFilters.status } : {}),
    ...(appliedFilters.purpose !== "all" ? { purpose: appliedFilters.purpose } : {}),
    ...(appliedFilters.from ? { from: appliedFilters.from } : {}),
    ...(appliedFilters.to ? { to: appliedFilters.to } : {}),
  });

  const payments = data?.data || [];
  const totalRows = data?.total_count || 0;

  const getActualAmount = (payment) => {
    if (payment.purpose === "module-purchase" && payment.convenience_fee) {
      return payment.amount - payment.convenience_fee;
    }
    return payment.amount;
  };

  const getPurposeColor = (purpose) => {
    switch (purpose) {
      case "admission-fee":
        return "text-blue-600 dark:text-blue-400";
      case "module-purchase":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const formatPurpose = (purpose) => {
    if (!purpose) return "N/A";
    return purpose
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          All Reports
        </h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Input
            placeholder={t("studentManagement.search")}
            className="max-w-xs"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <AllReportsFilterDrawer
            draftFilters={draftFilters}
            setDraftFilters={setDraftFilters}
            appliedFilters={appliedFilters}
            setAppliedFilters={setAppliedFilters}
            setPage={setPage}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment ID</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Intake</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Component</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Convenience Fee</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody
            className={isFetching ? "opacity-50 pointer-events-none" : ""}
          >
            {isLoading ? (
              <TableSkeleton rows={rowsPerPage} columns={10} />
            ) : error ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center p-8">
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
            ) : payments?.length > 0 ? (
              payments?.map((payment) => (
                <TableRow key={payment._id}>
                  <TableCell>{payment?.uid || "N/A"}</TableCell>
                  <TableCell>
                    {payment?.user
                      ? `${payment.user.first_name || ""} ${payment.user.last_name || ""}`.trim() ||
                        "N/A"
                      : "N/A"}
                  </TableCell>
                  <TableCell>{payment?.intake_name || "N/A"}</TableCell>
                  <TableCell>{payment?.program_name || "N/A"}</TableCell>
                  <TableCell>{payment?.component?.name || "N/A"}</TableCell>
                  <TableCell>
                    <span
                      className={`font-medium ${getPurposeColor(payment?.purpose)}`}
                    >
                      {formatPurpose(payment?.purpose)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {payment?.currency || "EUR"}{" "}
                    {getActualAmount(payment).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {payment.purpose === "module-purchase" &&
                    payment.convenience_fee
                      ? `${payment?.currency || "EUR"} ${payment.convenience_fee.toFixed(2)}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {payment?.createdAt
                      ? moment(payment.createdAt).format("DD MMM YYYY")
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={payment?.status} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="text-center">
                  No payments found
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

export default AllReports;
