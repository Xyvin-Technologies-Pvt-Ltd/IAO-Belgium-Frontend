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
import { useDeleteCity, useGetCities } from "@/store/useCityStore";
import CreateCity from "@/components/admin/location/CreateCity";

const Cities = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cityId, setCityId] = useState(null);
  const [deleteIds, setDeleteIds] = useState([]);

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error, refetch } = useGetCities({
    offset: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });
  const { mutateAsync: deleteCity, isLoading: isDeleting } =
    useDeleteCity();

  const cities = data?.data || [];
  const totalRows = data?.pagination?.total|| 0;

  const handleCheckboxChange = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelected(cities?.map((p) => p._id));
    } else {
      setSelected([]);
    }
  };

  const handleOpenCreate = () => {
    setCityId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (id) => {
    setCityId(id);
    setIsModalOpen(true);
  };

  const handleBulkDeleteClick = () => {
    if (selected.length === 0) {
      toast.error("Please select at least one City");
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
        await Promise.all(deleteIds.map((id) => deleteCity(id)));
        toast.success("Selected cities deleted successfully");
      } else {
        await deleteCity(deleteIds[0]);
        toast.success("City deleted successfully");
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
        <Button onClick={handleOpenCreate}>Create City</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <input
                type="checkbox"
                checked={
                  selected.length === cities?.length && cities.length > 0
                }
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={7} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center p-8">
                <ErrorMessage
                  message={error?.message || "Failed to load cities"}
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : cities?.length > 0 ? (
            cities?.map((i) => (
              <TableRow key={i._id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selected.includes(i._id)}
                    onChange={() => handleCheckboxChange(i._id)}
                  />
                </TableCell>
                <TableCell>{i?.name}</TableCell>
                <TableCell>{i?.country_name}</TableCell>
                <TableCell>
                  <StatusBadge status={i?.is_active} />
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
                No cities found
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

      <CreateCity
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cityId={cityId}
      />
      <DeleteConfirm
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        count={deleteIds.length}
        isLoading={isDeleting}
        data={deleteIds.length > 1 ? "Cities" : "City"}
      />
    </div>
  );
};

export default Cities;
