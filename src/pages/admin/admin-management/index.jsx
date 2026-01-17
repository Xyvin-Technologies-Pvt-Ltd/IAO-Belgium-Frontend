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
import { useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import CreateAdmin from "@/components/admin/admin-management/CreateAdmin";
import { useGetAdmins, useUpdateAdminStatus } from "@/store/useAdminStore";
import { Switch } from "@/components/ui/switch";

const AdminManagement = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error, refetch } = useGetAdmins({
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
      <h2 className="text-xl font-semibold text-dashboard-text">
        Admin Management
      </h2>
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="Search..."
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button onClick={handleOpenCreate}>Create Admin</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Role Name</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={5} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center p-8">
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
                  {i?.first_name} {i?.last_name}
                </TableCell>
                <TableCell>{i?.email}</TableCell>
                <TableCell>{i?.phone}</TableCell>
                <TableCell>{i?.role_name}</TableCell>
                <TableCell>
                  <Switch
                    checked={i?.status === "active"}
                    onCheckedChange={() => handleStatusToggle(i._id, i?.status)}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
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
      />

      <CreateAdmin open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default AdminManagement;
