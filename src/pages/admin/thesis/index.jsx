import { useState, useEffect } from "react";
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
import { Edit, Power, PowerOff } from "lucide-react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import StatusBadge from "@/components/StatusBadge";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { useCanModify } from "@/hooks/useCanModify";
import { useGetTheses, useUpdateThesisStatus } from "@/store/useThesisStore";
import CreateThesis from "@/components/admin/thesis/CreateThesis";
import DeactivateThesisConfirm from "@/components/admin/thesis/DeactivateThesisConfirm";

const ThesesList = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const canModify = useCanModify("operations");

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedThesis, setSelectedThesis] = useState(null);

  const [openDeactivate, setOpenDeactivate] = useState(false);
  const [thesisToDeactivate, setThesisToDeactivate] = useState(null);

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, error, refetch, isFetching } = useGetTheses({
    page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const updateThesisStatus = useUpdateThesisStatus();

  const theses = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleOpenCreate = () => {
    setSelectedThesis(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (thesis) => {
    setSelectedThesis(thesis);
    setIsModalOpen(true);
  };

  const handleOpenDeactivate = (thesis) => {
    setThesisToDeactivate(thesis);
    setOpenDeactivate(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!thesisToDeactivate) return;
    try {
      await updateThesisStatus.mutateAsync({
        id: thesisToDeactivate._id,
        status: false,
      });
    } finally {
      setOpenDeactivate(false);
      setThesisToDeactivate(null);
    }
  };

  const handleActivate = (thesis) => {
    updateThesisStatus.mutate({
      id: thesis._id,
      status: true,
    });
  };

  const handleRowClick = (id) => {
    navigate({
      to: "/admin/thesis/$id",
      params: { id },
    });
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Title */}
      <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
        {t("thesisManagement.title", "Thesis Catalog")}
      </h2>

      {/* Top Bar: Search & Action Buttons */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 flex items-center gap-2">
          <Input
            placeholder={t("thesisManagement.search", "Search by thesis name...")}
            className="max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {canModify && (
            <Button onClick={handleOpenCreate}>
              {t("thesisManagement.createThesis", "Create Thesis")}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("thesisManagement.table.uid", "UID")}</TableHead>
            <TableHead>{t("thesisManagement.table.name", "Thesis Name")}</TableHead>
            <TableHead>{t("thesisManagement.table.academic", "Academic Year")}</TableHead>
            <TableHead>{t("thesisManagement.table.program", "Programme")}</TableHead>
            <TableHead>{t("thesisManagement.table.price", "Price")}</TableHead>
            <TableHead>{t("thesisManagement.table.status", "Status")}</TableHead>
            <TableHead>{t("thesisManagement.table.action", "Action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={7} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center p-8">
                <ErrorMessage
                  message={
                    error?.message ||
                    t("thesisManagement.messages.loadFailed", "Failed to load theses")
                  }
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : theses.length > 0 ? (
            theses.map((i) => (
              <TableRow
                key={i._id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(i._id)}
              >
                <TableCell className="font-medium">{i?.uid}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{i?.name}</span>
                    {i?.current_year && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 shrink-0">
                        Year {i.current_year}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {Array.isArray(i?.academic) && i.academic.length > 0 ? (
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {i.academic.map((a, idx) => (
                        <span
                          key={a._id || idx}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-foreground"
                        >
                          {a.name || a}
                        </span>
                      ))}
                    </div>
                  ) : (
                    i?.academic?.name || "-"
                  )}
                </TableCell>
                <TableCell>
                  {Array.isArray(i?.program) && i.program.length > 0 ? (
                    <div className="space-y-1.5 max-w-[320px]">
                      {i.program.map((p, idx) => (
                        <div key={p._id || idx} className="min-w-0">
                          <span className="block font-medium truncate">{p.name || "-"}</span>
                          {(p.city?.name || p.is_online || p.language?.name) && (
                            <span className="block text-xs text-muted-foreground truncate">
                              {[p.is_online ? "Online" : p.city?.name, p.language?.name].filter(Boolean).join(" • ")}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="min-w-0">
                      <span className="block truncate">{i?.program?.name || "-"}</span>
                      {(i?.program?.city?.name || i?.program?.is_online || i?.program?.language?.name) && (
                        <span className="block text-xs text-muted-foreground truncate">
                          {[i?.program?.is_online ? "Online" : i?.program?.city?.name, i?.program?.language?.name].filter(Boolean).join(" • ")}
                        </span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  €{Number(i?.price ?? 0).toFixed(2)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={i?.status} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {canModify && (
                    <RowActionMenu
                      actions={[
                        {
                          label: t("thesisManagement.table.edit", "Edit"),
                          icon: Edit,
                          onClick: () => handleOpenEdit(i),
                        },
                        i?.status
                          ? {
                              label: t("thesisManagement.table.deactivate", "Deactivate"),
                              icon: PowerOff,
                              onClick: () => handleOpenDeactivate(i),
                              className: "text-red-600 dark:text-red-400",
                            }
                          : {
                              label: t("thesisManagement.table.activate", "Activate"),
                              icon: Power,
                              onClick: () => handleActivate(i),
                              className: "text-green-600 dark:text-green-400",
                            },
                      ]}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center p-8 text-muted-foreground">
                {t("thesisManagement.table.noTheses", "No theses found")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <Pagination
        page={page}
        setPage={setPage}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
        totalRows={totalRows}
      />

      {/* Create / Edit Modal */}
      <CreateThesis
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        thesisData={selectedThesis}
      />

      {/* Deactivate Confirmation Dialog */}
      <DeactivateThesisConfirm
        open={openDeactivate}
        onClose={() => setOpenDeactivate(false)}
        onConfirm={handleConfirmDeactivate}
        thesisName={thesisToDeactivate?.name}
        isLoading={updateThesisStatus.isPending}
      />
    </div>
  );
};

export default ThesesList;
