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
import { Eye } from "lucide-react";
import { useEffect, useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useGetApplications } from "@/store/useApplication";
import ViewApplication from "@/components/admin/application-review/ViewApplication";
import StatusBadge from "@/components/StatusBadge";
import { useTranslation } from "react-i18next";

const ApplicationReview = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, error, refetch,isFetching } = useGetApplications({
    page: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const admins = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleViewApplication = (application) => {
    setSelectedApplication(application);
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsViewModalOpen(false);
    setSelectedApplication(null);
  };


  return (
    <div className="space-y-6 mt-4">
       <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
        {t("applicationReview.title")}
      </h2>
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder={t("applicationReview.search")}
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("applicationReview.table.uid")}</TableHead>
            <TableHead>{t("applicationReview.table.name")}</TableHead>
            <TableHead>{t("applicationReview.table.email")}</TableHead>
            <TableHead>{t("applicationReview.table.phone")}</TableHead>
            <TableHead>{t("applicationReview.table.previousEducation")}</TableHead>
            <TableHead>{t("applicationReview.table.address")}</TableHead>
            <TableHead>{t("applicationReview.table.postalCode")}</TableHead>
            <TableHead>{t("applicationReview.table.city")}</TableHead>
            <TableHead>{t("applicationReview.table.country")}</TableHead>
            <TableHead>{t("applicationReview.table.paymentStatus")}</TableHead>
            <TableHead>{t("applicationReview.table.status")}</TableHead>
            <TableHead>{t("applicationReview.table.action")}</TableHead>
          </TableRow>
        </TableHeader>
         <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={12} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={12} className="text-center p-8">
                <ErrorMessage
                  message={error?.message || t("applicationReview.messages.loadFailed")}
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : admins?.length > 0 ? (
            admins?.map((i) => (
              <TableRow 
                key={i._id} 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleViewApplication(i)}
              >
                <TableCell>
                  {i?.uid}
                </TableCell>
                <TableCell className={"capitalize"}>{i?.user?.last_name}{" "}{i?.user?.first_name}</TableCell>
                <TableCell>{i?.user?.email}</TableCell>
                <TableCell>{i?.user?.phone}</TableCell>
                <TableCell>{i?.user?.previous_education}</TableCell>
                <TableCell>{i?.user?.address}</TableCell>
                <TableCell>{i?.user?.postal_code}</TableCell>
                <TableCell>{i?.user?.city}</TableCell>
                <TableCell>{i?.user?.country}</TableCell>
                <TableCell><StatusBadge status={i?.payment_status} /></TableCell>
                <TableCell><StatusBadge status={i?.status} /></TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewApplication(i);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={12} className="text-center">
                {t("applicationReview.table.noApplications")}
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

      <ViewApplication
        open={isViewModalOpen}
        onClose={handleCloseModal}
        application={selectedApplication}
      />

    </div>
  );
};

export default ApplicationReview;
