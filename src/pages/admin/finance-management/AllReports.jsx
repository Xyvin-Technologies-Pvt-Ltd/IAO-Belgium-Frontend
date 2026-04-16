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
import StatusBadge from "@/components/StatusBadge";
import { useGetPayments } from "@/store/usePaymentStore";
import moment from "moment";
import { Download } from "lucide-react";
import { getInvoiceHtml } from "@/api/paymentApi";
import AllReportsFilterDrawer from "./AllReportsFilterDrawer";

const AllReports = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    status: "all",
    purpose: "all",
    from: "",
    to: "",
  });
  const [draftFilters, setDraftFilters] = useState({
    status: "all",
    purpose: "all",
    from: "",
    to: "",
  });

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, appliedFilters]);

  const { data, isLoading, error, refetch, isFetching } = useGetPayments({
    page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(appliedFilters.status !== "all"
      ? { status: appliedFilters.status }
      : {}),
    ...(appliedFilters.purpose !== "all"
      ? { purpose: appliedFilters.purpose }
      : {}),
    ...(appliedFilters.from ? { from: appliedFilters.from } : {}),
    ...(appliedFilters.to ? { to: appliedFilters.to } : {}),
  });

  const payments = data?.data || [];
  const totalRows = data?.total_count || 0;
  const handleDownloadReceipt = async (payment) => {
    try {
      const html = await getInvoiceHtml(payment._id);
      const win = window.open("", "_blank");
      win.document.open();
      win.document.write(html);
      win.document.close();
    } catch (err) {
      console.error("Failed to open invoice:", err);
    }
  };

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
    if (!purpose) return t("common.notAvailable");
    switch (purpose) {
      case "admission-fee":
        return t("finance.purposes.admissionFee");
      case "module-purchase":
        return t("finance.purposes.modulePurchase");
      default:
        return purpose
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
    }
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          {t("finance.reports.all.title")}
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
              <TableHead>{t("common.paymentId")}</TableHead>
              <TableHead>{t("common.studentName")}</TableHead>
              <TableHead>{t("common.intake")}</TableHead>
              <TableHead>{t("common.program")}</TableHead>
              <TableHead>{t("common.component")}</TableHead>
              <TableHead>{t("common.purpose")}</TableHead>
              <TableHead>{t("common.amount")}</TableHead>
              <TableHead>{t("common.convenienceFee")}</TableHead>
              <TableHead>{t("common.date")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead></TableHead>
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
                  <TableCell>{payment?.uid || t("common.notAvailable")}</TableCell>
                  <TableCell>
                    {payment?.user
                      ? `${payment.user.first_name || ""} ${payment.user.last_name || ""}`.trim() ||
                      t("common.notAvailable")
                      : t("common.notAvailable")}
                  </TableCell>
                  <TableCell>{payment?.intake_name || t("common.notAvailable")}</TableCell>
                  <TableCell>{payment?.program_name || t("common.notAvailable")}</TableCell>
                  <TableCell>{payment?.component?.name || t("common.notAvailable")}</TableCell>
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
                      : t("common.notAvailable")}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={payment?.status} />
                  </TableCell>
                  <TableCell>
                    {payment?.status === "paid" && (
                      <button
                        onClick={() => handleDownloadReceipt(payment)}
                        title="Download receipt"
                        className="p-1.5 rounded-md text-sidebar-foreground/60 hover:text-green-500 hover:bg-green-500/10 transition-colors cursor-pointer"
                      >
                        <Download size={15} />
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="text-center">
                  {t("finance.messages.noPaymentsFound")}
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
