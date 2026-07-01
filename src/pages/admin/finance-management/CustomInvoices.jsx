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
import { useEffect, useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";
import StatusBadge from "@/components/StatusBadge";
import { useGetPayments, useGetTransactionLogs } from "@/store/usePaymentStore";
import moment from "moment";
import { Download, Plus } from "lucide-react";
import { getInvoicePrintHtml } from "@/api/paymentApi";
import CreateInvoice from "./CreateInvoice";

const CustomInvoices = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, error, refetch, isFetching } = useGetTransactionLogs({
    page,
    limit: rowsPerPage,
    purpose: "custom-invoice",
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const payments = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleDownloadReceipt = async (payment) => {
    try {
      const html = await getInvoicePrintHtml(payment._id);
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      document.body.appendChild(iframe);
      iframe.contentDocument.open();
      iframe.contentDocument.write(html);
      iframe.contentDocument.close();
      iframe.contentWindow.focus();
      iframe.contentWindow.onafterprint = () => document.body.removeChild(iframe);
      setTimeout(() => iframe.contentWindow.print(), 500);
    } catch (err) {
      console.error("Failed to download invoice:", err);
    }
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          {t("finance.reports.customInvoices.title")}
        </h2>
        <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
          <Plus size={16} />
          {t("sidebar.admin.createInvoice")}
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder={t("studentManagement.search")}
            className="max-w-xs"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.paymentId")}</TableHead>
              <TableHead>{t("common.studentName")}</TableHead>
              <TableHead>{t("common.amount")}</TableHead>
              <TableHead>{t("common.date")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody
            className={isFetching ? "opacity-50 pointer-events-none" : ""}
          >
            {isLoading ? (
              <TableSkeleton rows={rowsPerPage} columns={6} />
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center p-8">
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
                  <TableCell className={"capitalize"}>
                    {payment?.user
                      ? `${payment.user.last_name || ""} ${payment.user.first_name || ""}`.trim() ||
                      t("common.notAvailable")
                      : t("common.notAvailable")}
                  </TableCell>
                  <TableCell>
                    {payment?.currency || "EUR"}{" "}
                    {payment.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {payment?.createdAt
                      ? moment(payment.createdAt).format("DD-MM-YYYY")
                      : t("common.notAvailable")}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={payment?.status} />
                  </TableCell>
                  <TableCell>
                    {payment?.status !== "pending" && (
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
                <TableCell colSpan={6} className="text-center">
                  {t("finance.messages.noCustomInvoicesFound")}
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

      <CreateInvoice 
        open={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
};

export default CustomInvoices;
