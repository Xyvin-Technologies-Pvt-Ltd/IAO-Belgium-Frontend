import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import DeleteConfirm from "@/components/DeleteConfirm";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDeleteProgram, useGetPrograms } from "@/store/useProgramStore";

const ListView = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState([]);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteIds, setDeleteIds] = useState([]);

  const { data, isLoading, error, refetch } = useGetPrograms({
    page_no: page,
    limit: rowsPerPage,
  });
  const { mutateAsync: deleteCourse, isLoading: isDeleting } =
    useDeleteProgram();

  const schedules = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleCheckboxChange = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelected(schedules?.map((p) => p._id));
    } else {
      setSelected([]);
    }
  };

  const handleBulkDeleteClick = () => {
    if (selected.length === 0) {
      toast.error("Please select at least one schedule");
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
        await Promise.all(deleteIds.map((id) => deleteCourse(id)));
        toast.success("Selected schedules deleted successfully");
      } else {
        await deleteCourse(deleteIds[0]);
        toast.success("Schedule deleted successfully");
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
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 w-full">
          {selected.length > 0 && (
            <Button variant="destructive" onClick={handleBulkDeleteClick}>
              <Trash2 size={16} className="mr-1" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <input
                type="checkbox"
                checked={
                  selected.length === schedules?.length && schedules.length > 0
                }
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </TableHead>
            <TableHead>Course ID</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Module Name</TableHead>
            <TableHead>Language</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={8} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center p-8">
                <ErrorMessage
                  message={error?.message || "Failed to load schedules"}
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : schedules?.length > 0 ? (
            schedules?.map((i) => (
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
                <TableCell>{i?.time}</TableCell>
                <TableCell>{i?.date}</TableCell>
                <TableCell>{i?.location}</TableCell>
                <TableCell>
                  <RowActionMenu
                    actions={[
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
                No schedules found
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

      <DeleteConfirm
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        count={deleteIds.length}
        isLoading={isDeleting}
        data={deleteIds.length > 1 ? "schedules" : "schedule"}
      />
    </div>
  );
};

export default ListView;
