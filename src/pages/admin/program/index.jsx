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
import { useDeleteProgram, useGetPrograms } from "@/store/useProgramStore";
import CreateProgram from "@/components/admin/programs/CreateProgram";

const Programs = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [programId, setProgramId] = useState(null);
  const [deleteIds, setDeleteIds] = useState([]);

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error, refetch } = useGetPrograms({
    page_no: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });
  const { mutateAsync: deleteProgram, isLoading: isDeleting } =
    useDeleteProgram();

  const programs = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleCheckboxChange = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelected(programs?.map((p) => p._id));
    } else {
      setSelected([]);
    }
  };

  const handleOpenCreate = () => {
    setProgramId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (id) => {
    setProgramId(id);
    setIsModalOpen(true);
  };

  const handleBulkDeleteClick = () => {
    if (selected.length === 0) {
      toast.error("Please select at least one Program");
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
    try {
      if (deleteIds.length > 1) {
        await Promise.all(deleteIds.map((id) => deleteProgram(id)));
        toast.success("Selected Programs deleted successfully");
      } else {
        await deleteProgram(deleteIds[0]);
        toast.success("Program deleted successfully");
      }
    } catch (e) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setSelected([]);
      setDeleteIds([]);
      setOpenDelete(false);
    }
  };

  return (
    <div className="space-y-6 mt-4">
      <h2 className="text-xl font-semibold text-dashboard-text">Programs</h2>
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
        <Button onClick={handleOpenCreate}>Create Program</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <input
                type="checkbox"
                checked={
                  selected.length === programs?.length && programs.length > 0
                }
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </TableHead>
            <TableHead>Program Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Level</TableHead>
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
                  message={error?.message || "Failed to load programs"}
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : programs?.length > 0 ? (
            programs?.map((i) => (
              <TableRow key={i._id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selected.includes(i._id)}
                    onChange={() => handleCheckboxChange(i._id)}
                  />
                </TableCell>
                <TableCell>{i?.name}</TableCell>
                <TableCell>{i?.description}</TableCell>
                <TableCell>{i?.duration}</TableCell>
                <TableCell>{i?.level}</TableCell>
                <TableCell>
                  <StatusBadge status={i?.status} />
                </TableCell>
                <TableCell>
                  <RowActionMenu
                    actions={[
                      {
                        label: "Edit",
                        icon: Edit,
                        onClick: () => handleOpenEdit(i._id),
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
              <TableCell colSpan={7} className="text-center">
                No Programs found
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
        programId={programId}
      />
      <DeleteConfirm
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        count={deleteIds.length}
        isLoading={isDeleting}
        data={deleteIds.length > 1 ? "Programs" : "Program"}
      />
    </div>
  );
};

export default Programs;
