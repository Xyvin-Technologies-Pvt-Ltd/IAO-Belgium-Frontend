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
import { useEffect, useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import DeleteConfirm from "@/components/DeleteConfirm";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";
import {
  useDeleteCity,
  useGetCities,
  useUpdateCity,
} from "@/store/useCityStore";
import CreateCity from "@/components/admin/location/CreateCity";

const Cities = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const debouncedSearch = useDebounce(search, 500);
  useEffect(() => {
    setPage(1);
  }, [rowsPerPage]);
  const { data, isLoading, error, refetch,isFetching } = useGetCities({
    page: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });
  const { mutateAsync: deleteCity, isPending: isDeleting } = useDeleteCity();
  const { mutate: updateCity } = useUpdateCity();

  const cities = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleOpenCreate = () => {
    setSelectedCity(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (city) => {
    setSelectedCity(city);
    setIsModalOpen(true);
  };

  const handleRowDeleteClick = (id) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteCity(deleteId);
    } finally {
      setDeleteId(null);
      setOpenDelete(false);
    }
  };

  const handleStatusToggle = (id, currentStatus) => {
    updateCity({ id, data: { status: !currentStatus } });
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder={t("cityManagement.search")}
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button onClick={handleOpenCreate}>
          {t("cityManagement.createCity")}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("cityManagement.table.name")}</TableHead>
            <TableHead>{t("cityManagement.table.country")}</TableHead>
            <TableHead>{t("cityManagement.table.times")}</TableHead>
            <TableHead>{t("cityManagement.table.venues")}</TableHead>
            <TableHead>{t("cityManagement.table.status")}</TableHead>
            <TableHead>{t("cityManagement.table.action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={6} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center p-8">
                <ErrorMessage
                  message={
                    error?.message || t("cityManagement.messages.loadFailed")
                  }
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : cities?.length > 0 ? (
            cities?.map((i) => (
              <TableRow key={i._id}>
                <TableCell>{i?.name}</TableCell>
                <TableCell>{i?.country?.name}</TableCell>
                <TableCell>
                  {i?.times?.length > 0 ? (
                    i.times.map((time, index) => (
                      <span key={index} className="inline-block bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-xs mr-2 mb-1">
                        {time.start}-{time.end}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No times</span>
                  )}
                </TableCell>
                <TableCell>
                  {i?.venue?.length > 0 ? (
                    i.venue.join(", ")
                  ) : (
                    <span className="text-gray-500 text-sm">No venues</span>
                  )}
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
                        label: t("cityManagement.table.edit"),
                        icon: Edit,
                        onClick: () => handleOpenEdit(i),
                      },
                      {
                        label: t("cityManagement.delete"),
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
              <TableCell colSpan={6} className="text-center">
                {t("cityManagement.table.noCities")}
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

      <CreateCity
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cityData={selectedCity}
      />

      <DeleteConfirm
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        count={1}
        isLoading={isDeleting}
        data="City"
      />
    </div>
  );
};

export default Cities;
