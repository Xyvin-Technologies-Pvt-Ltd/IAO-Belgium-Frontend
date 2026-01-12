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
import { useDeleteCountry, useGetCountries } from "@/store/useCountryStore";
import CreateCountry from "@/components/admin/location/CreateCountry";

const Countries = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [countryId, setCountryId] = useState(null);
  const [deleteIds, setDeleteIds] = useState([]);

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error, refetch } = useGetCountries({
    offset: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });
  const { mutateAsync: deleteCountry, isLoading: isDeleting } =
    useDeleteCountry();

  const countries = data?.data || [];
  const totalRows = data?.pagination?.total || 0;

  const handleCheckboxChange = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelected(countries?.map((p) => p.id));
    } else {
      setSelected([]);
    }
  };

  const handleOpenCreate = () => {
    setCountryId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (id) => {
    setCountryId(id);
    setIsModalOpen(true);
  };

  const handleBulkDeleteClick = () => {
    if (selected.length === 0) {
      toast.error("Please select at least one Country");
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
        await Promise.all(deleteIds.map((id) => deleteCountry(id)));
        toast.success("Selected countries deleted successfully");
      } else {
        await deleteCountry(deleteIds[0]);
        toast.success("Country deleted successfully");
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
        <Button onClick={handleOpenCreate}>Create Country</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <input
                type="checkbox"
                checked={
                  selected.length === countries?.length && countries.length > 0
                }
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
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
                  message={error?.message || "Failed to load countries"}
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : countries?.length > 0 ? (
            countries?.map((i) => (
              <TableRow key={i.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selected.includes(i.id)}
                    onChange={() => handleCheckboxChange(i.id)}
                  />
                </TableCell>
                <TableCell>{i?.code}</TableCell>
                <TableCell>{i?.name}</TableCell>
                <TableCell>
                  <StatusBadge status={i?.is_active} />
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
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                No countries found
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

      <CreateCountry
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        countryId={countryId}
      />
      <DeleteConfirm
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        count={deleteIds.length}
        isLoading={isDeleting}
        data={deleteIds.length > 1 ? "Countries" : "Country"}
      />
    </div>
  );
};

export default Countries;
