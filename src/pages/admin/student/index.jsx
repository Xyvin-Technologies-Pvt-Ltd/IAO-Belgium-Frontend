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
import { useAuthStore } from "@/store/useAuthStore";
import StudentFilterDrawer from "./StudentFilterDrawer";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import StudentBulkUploadDialog from "@/components/admin/student-import/StudentBulkUploadDialog";

const AllStudents = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const profile = useAuthStore((state) => state.profile);
  const canBulkUpload = profile?.email === "ttj@duck.com";

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);
  
  const [appliedFilters, setAppliedFilters] = useState({
    program: "all",
    batch: "all",
    status: "all",
    city: "all",
  });

  const [draftFilters, setDraftFilters] = useState({
    program: "all",
    batch: "all",
    status: "all",
    city: "all",
  });

  const { data, isLoading, error, refetch, isFetching } = useGetStudents({
    page: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(appliedFilters.batch !== "all" && { batch: appliedFilters.batch }),
    ...(appliedFilters.status !== "all" && { status: appliedFilters.status }),
    ...(appliedFilters.city !== "all" && { city: appliedFilters.city }),
  });

  const students = data?.data || [];
  const totalRows = data?.total_count || 0;
  const handleRowClick = (appId) => {
    navigate({
      to: "/admin/student-management/$id",
      params: { id: appId },
    });
  };
  return (
    <div className="space-y-6 mt-4">
      <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
        {t("studentManagement.title")}
      </h2>
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
          </TableRow>
        </TableHeader>
      <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={9} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center p-8">
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
                 <TableCell className={"capitalize"}>
                  {i?.uid}
                </TableCell>
                <TableCell className={"capitalize"}>
                  {i?.last_name} {i?.first_name}
                </TableCell>
                <TableCell>{i?.email}</TableCell>
                <TableCell>{i?.phone}</TableCell>
                <TableCell>{i?.country}</TableCell>
                <TableCell>{i?.city}</TableCell>
                <TableCell>{i?.previous_education}</TableCell>
                <TableCell>{i?.program_name}</TableCell>
                <TableCell>{i?.batch_name}</TableCell>
                <TableCell>
                  <StatusBadge status={i?.status} />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="text-center">
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

export default AllStudents;
