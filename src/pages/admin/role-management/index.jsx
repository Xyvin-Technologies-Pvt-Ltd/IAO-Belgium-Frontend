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
import { Edit, Trash2, Eye } from "lucide-react";
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
import ViewRole from "@/components/admin/role-management/ViewRole";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";

const RoleManagement = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error, refetch } = useGetRoles({
    page: page,
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

  const handleOpenView = (role) => {
    setSelectedRole(role);
    setIsViewModalOpen(true);
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
            <TableHead>{t("roleManagement.table.permissions")}</TableHead>
            <TableHead>{t("roleManagement.table.status")}</TableHead>
            <TableHead>{t("roleManagement.table.action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={5} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center p-8">
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
              <TableRow
                key={i._id}
                className="cursor-pointer"
                onClick={() => handleOpenView(i)}
              >
                <TableCell>{i?.name}</TableCell>
                <TableCell
                  title={i?.description}
                  className="max-w-38 overflow-hidden text-ellipsis whitespace-nowrap"
                >
                  {i?.description}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-md">
                    {i?.permissions?.length > 0 ? (
                      <>
                        {i.permissions.slice(0, 2).map((permission, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[#F4F4F5]  dark:bg-gray-600 dark:text-white"
                          >
                            {permission.replace(/_/g, " ")}
                          </span>
                        ))}
                        {i.permissions.length > 2 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium   dark:text-white">
                            +{i.permissions.length - 2} more
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">
                        No permissions
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={i?.status}
                    onCheckedChange={(checked) => {
                      handleStatusToggle(i._id, i?.status);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <RowActionMenu
                    actions={[
                      {
                        label: t("roleManagement.table.view"),
                        icon: Eye,
                        onClick: () => handleOpenView(i),
                      },
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
              <TableCell colSpan={5} className="text-center">
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
      <ViewRole
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        roleData={selectedRole}
      />
      <DeleteConfirm
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        count={1}
        isLoading={isDeleting}
        data="Role"
      />
    </div>
  );
};

export default RoleManagement;
