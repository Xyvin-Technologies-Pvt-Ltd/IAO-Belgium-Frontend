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
  useDeleteCountry,
  useGetCountries,
  useUpdateCountry,
} from "@/store/useCountryStore";
import CreateCountry from "@/components/admin/location/CreateCountry";
import { useCanModify } from "@/hooks/useCanModify";

const Countries = () => {
  const { t } = useTranslation();
  const canModify = useCanModify("master_data");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);
  const { data, isLoading, error, refetch,isFetching } = useGetCountries({
    page: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });
  const { mutateAsync: deleteCountry, isPending: isDeleting } =
    useDeleteCountry();
  const { mutate: updateCountry } = useUpdateCountry();

  const countries = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleOpenCreate = () => {
    setSelectedCountry(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (country) => {
    setSelectedCountry(country);
    setIsModalOpen(true);
  };

  const handleRowDeleteClick = (id) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteCountry(deleteId);
    } finally {
      setDeleteId(null);
      setOpenDelete(false);
    }
  };

  const handleStatusToggle = (id, currentStatus) => {
    updateCountry({ id, data: { status: !currentStatus } });
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder={t("countryManagement.search")}
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {canModify && (
          <Button onClick={handleOpenCreate}>
            {t("countryManagement.createCountry")}
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("countryManagement.table.name")}</TableHead>
            <TableHead>{t("countryManagement.table.code")}</TableHead>
            <TableHead>{t("countryManagement.table.currency")}</TableHead>
            <TableHead>{t("countryManagement.table.status")}</TableHead>
            <TableHead>{t("countryManagement.table.action")}</TableHead>
          </TableRow>
        </TableHeader>
       <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={5} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center p-8">
                <ErrorMessage
                  message={
                    error?.message || t("countryManagement.messages.loadFailed")
                  }
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : countries?.length > 0 ? (
            countries?.map((i) => (
              <TableRow key={i._id}>
                <TableCell>{i?.name}</TableCell>
                <TableCell>{i?.code}</TableCell>
                <TableCell>{i?.currency}</TableCell>
                <TableCell>
                  <Switch
                    checked={i?.status}
                    onCheckedChange={(checked) => {
                      handleStatusToggle(i._id, i?.status);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    disabled={!canModify}
                  />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {canModify && (
                    <RowActionMenu
                      actions={[
                        {
                          label: t("countryManagement.table.edit"),
                          icon: Edit,
                          onClick: () => handleOpenEdit(i),
                        },
                        {
                          label: t("countryManagement.delete"),
                          icon: Trash2,
                          onClick: () => handleRowDeleteClick(i._id),
                        },
                      ]}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                {t("countryManagement.table.noCountries")}
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

      <CreateCountry
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        countryData={selectedCountry}
      />

      <DeleteConfirm
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        count={1}
        isLoading={isDeleting}
        data={t("common.country")}
      />
    </div>
  );
};

export default Countries;
