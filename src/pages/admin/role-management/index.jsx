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
import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import DeleteConfirm from "@/components/DeleteConfirm";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useDeleteRole,
  useGetRoles,
  useUpdateRole,
} from "@/store/useRoleStore";
import CreateRole from "@/components/admin/role-management/CreateRole";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";

const RoleManagement = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const debouncedSearch = useDebounce(search, 500);

  const { data, isFetching, error, refetch } = useGetRoles({
    page_no: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });
  const { mutateAsync: deleteRole, isPending: isDeleting } = useDeleteRole();
  const { mutate: updateRole } = useUpdateRole();

  const roles = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleOpenCreate = () => {
    setSelectedRole(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (role) => {
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const handleRowDeleteClick = (id) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteRole(deleteId);
    } finally {
      setDeleteId(null);
      setOpenDelete(false);
    }
  };

  const handleStatusToggle = (id, currentStatus) => {
    updateRole({ id, data: { status: !currentStatus } });
  };

  return (
    <div className="space-y-6 mt-4">
      <h2 className="text-xl font-semibold text-dashboard-text">
        {t("roleManagement.title")}
      </h2>
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder={t("roleManagement.search")}
          className="max-w-xs"
          value={search}
          whiteBg
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button onClick={handleOpenCreate}>
          {t("roleManagement.createRole")}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("roleManagement.table.name")}</TableHead>
            <TableHead>{t("roleManagement.table.description")}</TableHead>
            <TableHead>{t("roleManagement.table.status")}</TableHead>
            <TableHead>{t("roleManagement.table.action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isFetching ? (
            <TableSkeleton rows={rowsPerPage} columns={4} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center p-8">
                <ErrorMessage
                  message={
                    error?.message || t("roleManagement.messages.loadFailed")
                  }
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : roles?.length > 0 ? (
            roles?.map((i) => (
              <TableRow key={i._id}>
                <TableCell>{i?.name}</TableCell>
                <TableCell>{i?.description}</TableCell>
                <TableCell>
                  <Switch
                    checked={i?.status}
                    onCheckedChange={() => handleStatusToggle(i._id, i?.status)}
                  />
                </TableCell>
                <TableCell>
                  <RowActionMenu
                    actions={[
                      {
                        label: t("roleManagement.table.edit"),
                        icon: Edit,
                        onClick: () => handleOpenEdit(i),
                      },
                      {
                        label: t("roleManagement.delete"),
                        icon: Trash2,
                        onClick: () => handleRowDeleteClick(i._id),
                      },
                    ]}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                {t("roleManagement.table.noRoles")}
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

      <CreateRole
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        roleData={selectedRole}
      />
      <DeleteConfirm
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        count={1}
        isLoading={isDeleting}
        data={t("roleManagement.deleteConfirm.role")}
      />
    </div>
  );
};

export default RoleManagement;
