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
import { toast } from "sonner";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import StatusBadge from "@/components/StatusBadge";
import { Pagination } from "@/components/ui/table/Pagination";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import DeleteConfirm from "@/components/DeleteConfirm";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import CreateAdmin from "@/components/admin/admin-management/CreateAdmin";
import { useGetAdmins, useDeleteAdmin, useUpdateAdminStatus, useBulkDeleteAdmins } from "@/store/useAdminStore";
import { Switch } from "@/components/ui/switch";

const AdminManagement = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [deleteIds, setDeleteIds] = useState([]);

  const debouncedSearch = useDebounce(search, 500);

  const { data, isFetching, error, refetch } = useGetAdmins({
    page_no: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });
  const { mutateAsync: deleteAdmin, isPending: isDeleting } = useDeleteAdmin();
  const { mutateAsync: bulkDeleteAdmins, isPending: isBulkDeleting } = useBulkDeleteAdmins();
  const { mutate: updateAdminStatus } = useUpdateAdminStatus();

  const admins = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleCheckboxChange = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelected(admins?.map((p) => p._id));
    } else {
      setSelected([]);
    }
  };

  const handleOpenCreate = () => {
    setSelectedAdmin(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (admin) => {
    setSelectedAdmin(admin);
    setIsModalOpen(true);
  };

  const handleBulkDeleteClick = () => {
    if (selected.length === 0) {
      toast.error("Please select at least one Admin");
      return;
    }
    setDeleteIds(selected);
    setOpenDelete(true);
  };

  const handleRowDeleteClick = (id) => {
    setDeleteIds([id]);
    setOpenDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteIds.length > 1) {
      await bulkDeleteAdmins(deleteIds);
    } else {
      await deleteAdmin(deleteIds[0]);
    }
    setSelected([]);
    setDeleteIds([]);
    setOpenDelete(false);
  };

  const handleStatusToggle = (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    updateAdminStatus({ id, status: newStatus });
  };

  return (
    <div className="space-y-6 mt-4">
      <h2 className="text-xl font-semibold text-dashboard-text">Admin Management</h2>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 w-full">
          <Input
            placeholder="Search..."
            className="max-w-xs"
            value={search}
            whiteBg
            onChange={(e) => setSearch(e.target.value)}
          />

          {selected.length > 0 && (
            <Button variant="destructive" onClick={handleBulkDeleteClick}>
              <Trash2 size={16} className="mr-1" />
              Delete
            </Button>
          )}
        </div>
        <Button onClick={handleOpenCreate}>Create Admin</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <input
                type="checkbox"
                checked={
                  selected.length === admins?.length && admins.length > 0
                }
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </TableHead>
            <TableHead>First Name</TableHead>
            <TableHead>Last Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Role Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isFetching ? (
            <TableSkeleton rows={rowsPerPage} columns={8} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center p-8">
                <ErrorMessage
                  message={error?.message || "Failed to load admins"}
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : admins?.length > 0 ? (
            admins?.map((i) => (
              <TableRow key={i._id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selected.includes(i._id)}
                    onChange={() => handleCheckboxChange(i._id)}
                  />
                </TableCell>
                <TableCell>{i?.first_name}</TableCell>
                <TableCell>{i?.last_name}</TableCell>
                <TableCell>{i?.email}</TableCell>
                <TableCell>{i?.phone}</TableCell>
                <TableCell>{i?.role_name}</TableCell>
                <TableCell>
                  <Switch
                    checked={i?.status === "active"}
                    onCheckedChange={() => handleStatusToggle(i._id, i?.status)}
                  />
                </TableCell>
                <TableCell>
                  <RowActionMenu
                    actions={[
                      {
                        label: "Edit",
                        icon: Edit,
                        onClick: () => handleOpenEdit(i),
                      },
                      {
                        label: "Delete",
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
              <TableCell colSpan={8} className="text-center">
                No Admins found
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
        selected={selected?.length}
      />

      <CreateAdmin
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        adminData={selectedAdmin}
      />
      <DeleteConfirm
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        count={deleteIds.length}
        isLoading={isDeleting || isBulkDeleting}
        data={deleteIds.length > 1 ? "Admins" : "Admin"}
      />
    </div>
  );
};

export default AdminManagement;
