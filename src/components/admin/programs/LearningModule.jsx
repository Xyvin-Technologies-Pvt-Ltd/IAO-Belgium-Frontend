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
import { useNavigate } from "@tanstack/react-router";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import DeleteConfirm from "@/components/DeleteConfirm";
import ErrorMessage from "@/components/common/ErrorMessage";
import CreateProgram from "@/components/admin/programs/CreateProgram";
import StatusChip from "@/components/ui/StatusChip";
import StatusBadge from "@/components/StatusBadge";

const LearningModule = ({
  modules = [],
  isLoading = false,
  error = null,
  refetch,
}) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [moduleId, setModuleId] = useState(null);
  const [deleteIds, setDeleteIds] = useState([]);
  const totalRows = modules?.length || 0;

  const handleCheckboxChange = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelected(modules?.map((p) => p.id));
    } else {
      setSelected([]);
    }
  };

  const handleOpenCreate = () => {
    setModuleId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (id) => {
    setModuleId(id);
    setIsModalOpen(true);
  };

  const handleBulkDeleteClick = () => {
    if (selected.length === 0) {
      toast.error("Please select at least one module to delete.");
      return;
    }
    setDeleteIds(selected);
    setOpenDelete(true);
  };

  const handleRowDeleteClick = (id) => {
    setDeleteIds([id]);
    setOpenDelete(true);
  };

  const handleConfirmDelete = async () => {};

  return (
    <div className="space-y-6 mt-4">
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
        <Button onClick={handleOpenCreate}>Create Module</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <input
                type="checkbox"
                checked={
                  selected.length === modules?.length && modules.length > 0
                }
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Sessions</TableHead>
            <TableHead>Available Seats per Batch</TableHead>
            <TableHead>Resources</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={7} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center p-8">
                <ErrorMessage
                  message={error?.message || "Failed to load modules"}
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : modules?.length > 0 ? (
            modules?.map((i) => (
              <TableRow
                key={i.id}
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selected.includes(i.id)}
                    onChange={() => handleCheckboxChange(i.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
                <TableHead>{i?.shortCode}</TableHead>
                <TableCell>{i?.name}</TableCell>
                <TableCell>{i?.numberOfSessions}</TableCell>
                <TableCell>{i?.duration}</TableCell>
                <TableCell>
                  {i?.resources?.length ? i?.resources.length + " items" : "-"}
                </TableCell>
                <TableCell>{i?.amount}</TableCell>
                <TableCell>
                  <StatusBadge status={i?.isActive} />
                </TableCell>
                <TableCell>
                  <RowActionMenu
                    actions={[
                      {
                        label: "Edit",
                        icon: Edit,
                        onClick: () => handleOpenEdit(i.id),
                      },
                      {
                        label: "Delete",
                        icon: Trash2,
                        onClick: () => handleRowDeleteClick(i.id),
                      },
                    ]}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                No modules found
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

      <CreateProgram
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        programId={moduleId}
      />
      <DeleteConfirm
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        count={deleteIds.length}
        data={deleteIds.length > 1 ? "Modules" : "Module"}
      />
    </div>
  );
};

export default LearningModule;
