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
import { useNavigate } from "@tanstack/react-router";
import StatusBadge from "@/components/StatusBadge";
import { useGetStudents } from "@/store/useStudentStore";
import { resolvePreviousEducationLabel } from "@/utils/previousEducation";
import { useAuthStore } from "@/store/useAuthStore";
import StudentFilterDrawer from "./StudentFilterDrawer";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import StudentBulkUploadDialog from "@/components/admin/student-import/StudentBulkUploadDialog";
import {
  STUDENT_MANAGEMENT_FILTERS_KEY,
  STUDENT_MANAGEMENT_SEARCH_KEY,
  buildStudentQueryFilters,
  loadStoredStudentFilters,
  loadStoredStudentSearch,
} from "./studentFilterUtils";
import { exportStudents } from "@/api/studentApi";
import moment from "moment";
import { formatPaymentMethod } from "@/utils/paymentMethod";
import { useCanModify } from "@/hooks/useCanModify";

const BoolBadge = ({ value, t }) => (
  <span
    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
      value
        ? "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300"
        : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/70"
    }`}
  >
    {value ? t("common.yes", "Yes") : t("common.no", "No")}
  </span>
);

const AllStudents = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const canModify = useCanModify("academic");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState(loadStoredStudentSearch);
  const debouncedSearch = useDebounce(search, 500);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [exportPending, setExportPending] = useState(false);
  const profile = useAuthStore((state) => state.profile);
  const canBulkUpload = canModify && profile?.email === "ttj@duck.com";

  const [appliedFilters, setAppliedFilters] = useState(loadStoredStudentFilters);
  const [draftFilters, setDraftFilters] = useState(loadStoredStudentFilters);

  useEffect(() => {
    sessionStorage.setItem(
      STUDENT_MANAGEMENT_FILTERS_KEY,
      JSON.stringify(appliedFilters),
    );
  }, [appliedFilters]);

  useEffect(() => {
    sessionStorage.setItem(STUDENT_MANAGEMENT_SEARCH_KEY, search);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, appliedFilters]);

  const queryFilters = buildStudentQueryFilters(appliedFilters, {
    search: debouncedSearch,
  });

  const { data, isLoading, error, refetch, isFetching } = useGetStudents({
    page,
    limit: rowsPerPage,
    ...queryFilters,
  });

  const students = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleRowClick = (appId) => {
    navigate({
      to: "/admin/student-management/$id",
      params: { id: appId },
    });
  };

  const handleExportExcel = async () => {
    try {
      setExportPending(true);
      const blob = await exportStudents(queryFilters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `students_report_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Exporting students failed:", err);
    } finally {
      setExportPending(false);
    }
  };

  const columnCount = 15;

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          {t("studentManagement.title")}
        </h2>
        <Button
          disabled={exportPending}
          onClick={handleExportExcel}
          variant="outline"
          className="gap-2 shrink-0"
        >
          <Download className="h-4 w-4" />
          {exportPending
            ? t("studentManagement.exporting", "Exporting...")
            : t("studentManagement.exportExcel", "Export Excel")}
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder={t("studentManagement.search")}
            className="max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <StudentFilterDrawer
            draftFilters={draftFilters}
            setDraftFilters={setDraftFilters}
            appliedFilters={appliedFilters}
            setAppliedFilters={setAppliedFilters}
            setPage={setPage}
          />
        </div>
        {canBulkUpload && (
          <Button variant="outline" onClick={() => setBulkUploadOpen(true)}>
            <Upload className="h-4 w-4" />
            {t("studentImport.title", "Bulk Upload Students")}
          </Button>
        )}
      </div>
      {canBulkUpload && (
        <StudentBulkUploadDialog
          open={bulkUploadOpen}
          onClose={() => setBulkUploadOpen(false)}
        />
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("studentManagement.table.uid")}</TableHead>
              <TableHead>{t("studentManagement.table.name")}</TableHead>
              <TableHead>{t("studentManagement.table.email")}</TableHead>
              <TableHead>{t("studentManagement.table.phone")}</TableHead>
              <TableHead>{t("studentManagement.table.country")}</TableHead>
              <TableHead>{t("studentManagement.table.city")}</TableHead>
              <TableHead>
                {t("studentManagement.table.previousEducation")}
              </TableHead>
              <TableHead>{t("studentManagement.table.program")}</TableHead>
              <TableHead>{t("studentManagement.table.batch")}</TableHead>
              <TableHead>{t("studentManagement.table.status")}</TableHead>
              <TableHead>
                {t("studentManagement.table.paymentStatus", "Payment Status")}
              </TableHead>
              <TableHead>
                {t("studentManagement.table.paymentMethod", "Payment Method")}
              </TableHead>
              <TableHead>
                {t("studentManagement.table.lastLogin", "Last Login")}
              </TableHead>
              <TableHead>
                {t("studentManagement.table.idCard", "ID Card")}
              </TableHead>
              <TableHead>
                {t("studentManagement.table.qualificationCert", "Qual. Cert")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody
            className={isFetching ? "opacity-50 pointer-events-none" : ""}
          >
            {isLoading ? (
              <TableSkeleton rows={rowsPerPage} columns={columnCount} />
            ) : error ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="text-center p-8">
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
              students?.map((i) => (
                <TableRow
                  key={i._id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(i._id)}
                >
                  <TableCell className="capitalize">{i?.uid}</TableCell>
                  <TableCell className="capitalize">
                    {i?.last_name} {i?.first_name}
                  </TableCell>
                  <TableCell>{i?.email}</TableCell>
                  <TableCell>{i?.phone}</TableCell>
                  <TableCell>{i?.country}</TableCell>
                  <TableCell>{i?.city}</TableCell>
                  <TableCell>
                    {resolvePreviousEducationLabel(
                      i?.previous_education,
                      i?.previous_education_options || [],
                      i18n.language,
                    )}
                  </TableCell>
                  <TableCell>{i?.program_name || t("common.dash", "-")}</TableCell>
                  <TableCell>{i?.batch_name || t("common.dash", "-")}</TableCell>
                  <TableCell>
                    <StatusBadge status={i?.application_status} />
                  </TableCell>
                  <TableCell>
                    {i?.payment_status ? (
                      <StatusBadge status={i.payment_status} />
                    ) : (
                      t("common.dash", "-")
                    )}
                  </TableCell>
                  <TableCell>
                    {formatPaymentMethod(i?.payment_method, t)}
                  </TableCell>
                  <TableCell>
                    {i?.last_login
                      ? moment(i.last_login).format("DD MMM YYYY, HH:mm")
                      : t("common.notAvailable")}
                  </TableCell>
                  <TableCell>
                    <BoolBadge value={i?.has_id_card} t={t} />
                  </TableCell>
                  <TableCell>
                    <BoolBadge
                      value={i?.has_qualification_certificate}
                      t={t}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columnCount} className="text-center">
                  {t("studentManagement.table.noStudents")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
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

export default AllStudents;
