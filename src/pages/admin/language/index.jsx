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
  useDeleteLanguage,
  useGetLanguages,
  useUpdateLanguage,
} from "@/store/useLanguageStore";
import CreateLanguage from "@/components/admin/language/CreateLanguage";
import { useCanModify } from "@/hooks/useCanModify";

const Language = () => {
  const { t } = useTranslation();
  const canModify = useCanModify("master_data");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);
  const { data, isLoading, error, refetch,isFetching } = useGetLanguages({
    page: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });
  const { mutateAsync: deleteLanguage, isPending: isDeleting } =
    useDeleteLanguage();
  const { mutate: updateLanguage } = useUpdateLanguage();

  const languages = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleOpenCreate = () => {
    setSelectedLang(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lang) => {
    setSelectedLang(lang);
    setIsModalOpen(true);
  };

  const handleRowDeleteClick = (id) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteLanguage(deleteId);
    } finally {
      setDeleteId(null);
      setOpenDelete(false);
    }
  };

  const handleStatusToggle = (id, currentStatus) => {
    updateLanguage({ id, data: { status: !currentStatus } });
  };

  return (
    <div className="space-y-6 mt-4">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
       {t("languageManagement.title")}
      </h2>
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder={t("languageManagement.search")}
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {canModify && (
          <Button onClick={handleOpenCreate}>
            {t("languageManagement.createLanguage")}
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("languageManagement.table.name")}</TableHead>
            <TableHead>{t("languageManagement.table.emailCode")}</TableHead>
            <TableHead>{t("languageManagement.table.status")}</TableHead>
            <TableHead>{t("languageManagement.table.action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={4} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center p-8">
                <ErrorMessage
                  message={
                    error?.message ||
                    t("languageManagement.messages.loadFailed")
                  }
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : languages?.length > 0 ? (
            languages?.map((i) => (
              <TableRow key={i._id}>
                <TableCell>{i?.name}</TableCell>
                <TableCell className="uppercase text-muted-foreground">
                  {i?.code || "—"}
                </TableCell>
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
                          label: t("languageManagement.table.edit"),
                          icon: Edit,
                          onClick: () => handleOpenEdit(i),
                        },
                        {
                          label: t("languageManagement.delete"),
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
              <TableCell colSpan={4} className="text-center">
                {t("languageManagement.table.noLanguages")}
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

      <CreateLanguage
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        languageData={selectedLang}
      />

      <DeleteConfirm
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        count={1}
        isLoading={isDeleting}
        data={t("common.language")}
      />
    </div>
  );
};

export default Language;
