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
import CreateAdmin from "@/components/admin/admin-management/CreateAdmin";
import { useGetAdmins, useUpdateAdminStatus } from "@/store/useAdminStore";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";
import { useCanModify } from "@/hooks/useCanModify";

const AdminManagement = () => {
  const { t } = useTranslation();
  const canModify = useCanModify("admin");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, error, refetch,isFetching } = useGetAdmins({
    page: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });
  const { mutate: updateAdminStatus } = useUpdateAdminStatus();

  const admins = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleOpenCreate = () => {
    setIsModalOpen(true);
  };

  const handleStatusToggle = (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    updateAdminStatus({ id, status: newStatus });
  };

  return (
    <div className="space-y-6 mt-4">
      <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
        {t("adminManagement.title")}
      </h2>
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder={t("adminManagement.search")}
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {canModify && (
          <Button onClick={handleOpenCreate}>
            {t("adminManagement.createAdmin")}
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("adminManagement.table.name")}</TableHead>
            <TableHead>{t("adminManagement.table.email")}</TableHead>
            <TableHead>{t("adminManagement.table.phone")}</TableHead>
            <TableHead>{t("adminManagement.table.roleName")}</TableHead>
            <TableHead>{t("adminManagement.table.status")}</TableHead>
          </TableRow>
        </TableHeader>
         <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={5} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center p-8">
                <ErrorMessage
                  message={error?.message || t("adminManagement.messages.loadFailed")}
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : admins?.length > 0 ? (
            admins?.map((i) => (
              <TableRow key={i._id}>
                <TableCell className={"capitalize"}>
                  {i?.last_name} {i?.first_name}
                </TableCell>
                <TableCell>{i?.email}</TableCell>
                <TableCell>{i?.phone}</TableCell>
                <TableCell>{i?.role_name}</TableCell>
                <TableCell>
                  <Switch
                    checked={i?.status === "active"}
                    onCheckedChange={() => handleStatusToggle(i._id, i?.status)}
                    disabled={!canModify}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                {t("adminManagement.table.noAdmins")}
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

      <CreateAdmin open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default AdminManagement;
