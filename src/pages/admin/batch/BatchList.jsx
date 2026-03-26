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
import { useEffect, useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useGetBatchesByIntake } from "@/store/useIntakeStore";
import { useCreateBatch, useDeleteBatch } from "@/store/useBatchStore";
import StatusBadge from "@/components/StatusBadge";
import { Plus, Eye, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import DeleteConfirm from "@/components/DeleteConfirm";

const BatchList = () => {
  const params = useParams({ strict: false });
  const id = params.id;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, error, refetch,isFetching } = useGetBatchesByIntake(id, {
    page: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const createBatchMutation = useCreateBatch();
  const deleteBatchMutation = useDeleteBatch();

  const batches = data?.data || [];
  const totalRows = data?.total_count || 0;
  const handleRowClick = (batchId) => {
    navigate({
      to: "/admin/admission-administration/academics/intakes/batch/$id",
      params: { id: batchId },
    });
  };

  const handleCreateBatch = () => {
    createBatchMutation.mutate(
      { intake_id: id },
      {
        onSuccess: () => {
          setIsCreateDialogOpen(false);
        },
      }
    );
  };

  const handleDeleteBatch = () => {
    if (selectedBatch) {
      deleteBatchMutation.mutate(selectedBatch._id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setSelectedBatch(null);
        },
      });
    }
  };
  const getRowActions = (batch) => [
    {
      label: t("batchManagement.actions.view"),
      icon: Eye,
      onClick: () => handleRowClick(batch._id),
    },
    {
      label: t("batchManagement.actions.delete"),
      icon: Trash2,
      onClick: () => {
        setSelectedBatch(batch);
        setIsDeleteDialogOpen(true);
      },
    },
  ];
  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder={t("batchManagement.search")}
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t("batchManagement.createBatch")}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("batchManagement.table.batchId")}</TableHead>
            <TableHead>{t("batchManagement.table.batchName")}</TableHead>
            <TableHead>{t("batchManagement.table.capacity")}</TableHead>
            <TableHead>{t("batchManagement.table.enrolled")}</TableHead>
            <TableHead>{t("batchManagement.table.available")}</TableHead>
            <TableHead>{t("batchManagement.table.status")}</TableHead>
            <TableHead className="w-[50px]">{t("batchManagement.actions.actions")}</TableHead>
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
                    error?.message || t("batchManagement.messages.loadFailed")
                  }
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : batches?.length > 0 ? (
            batches?.map((i) => (
              <TableRow
                key={i._id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(i._id)}
              >
                <TableCell>{i?.uid}</TableCell>
                <TableCell>{i?.name}</TableCell>
                <TableCell>{i?.intake?.student_per_batch}</TableCell>
                <TableCell>{i?.student_count}</TableCell>
                <TableCell>
                  {i?.intake?.student_per_batch - i?.student_count}
                </TableCell>
                <TableCell>
                  <StatusBadge status={i?.status} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <RowActionMenu actions={getRowActions(i)} />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                {t("batchManagement.table.noBatches")}
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

      {/* Create Batch Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("batchManagement.createBatch")}</DialogTitle>
            <DialogDescription>
              {t("batchManagement.createBatchConfirmation")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={createBatchMutation.isPending}
            >
              {t("batchManagement.actions.cancel")}
            </Button>
            <Button
              onClick={handleCreateBatch}
              disabled={createBatchMutation.isPending}
            >
              {createBatchMutation.isPending
                ? t("batchManagement.actions.creating")
                : t("batchManagement.actions.createBatch")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Batch Dialog */}
      <DeleteConfirm
        open={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedBatch(null);
        }}
        onConfirm={handleDeleteBatch}
        count={1}
        data={selectedBatch?.name || "batch"}
        isLoading={deleteBatchMutation.isPending}
      />
    </div>
  );
};

export default BatchList;
