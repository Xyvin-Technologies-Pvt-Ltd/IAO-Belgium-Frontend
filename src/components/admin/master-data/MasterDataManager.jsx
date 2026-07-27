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
import { Edit, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import DeleteConfirm from "@/components/DeleteConfirm";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import axiosInstance from "@/api/axiosintercepter";
import { useCanModify } from "@/hooks/useCanModify";

/**
 * Generic CRUD manager for simple "name + status" master data lists.
 * Reused by Contract Type, Department, Region and Teaching Region admin pages.
 */
const MasterDataManager = ({ endpoint, queryKey, i18nPrefix }) => {
  const { t } = useTranslation();
  const canModify = useCanModify("master_data");
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const debouncedSearch = useDebounce(search, 500);
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const tk = (key, fallback) => t(`${i18nPrefix}.${key}`, fallback);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: [queryKey, { page, limit: rowsPerPage, search: debouncedSearch }],
    queryFn: async () => {
      const response = await axiosInstance.get(endpoint, {
        params: {
          page,
          limit: rowsPerPage,
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
        },
      });
      return response.data;
    },
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: [queryKey] });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await axiosInstance.post(endpoint, payload);
      return response.data;
    },
    onSuccess: (response) => {
      invalidate();
      toast.success(response?.message || tk("messages.created", "Created successfully"));
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || tk("messages.createFailed", "Failed to create"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const response = await axiosInstance.put(`${endpoint}/${id}`, payload);
      return response.data;
    },
    onSuccess: (response) => {
      invalidate();
      toast.success(response?.message || tk("messages.updated", "Updated successfully"));
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || tk("messages.updateFailed", "Failed to update"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await axiosInstance.delete(`${endpoint}/${id}`);
      return response.data;
    },
    onSuccess: (response) => {
      invalidate();
      toast.success(response?.message || tk("messages.deleted", "Deleted successfully"));
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || tk("messages.deleteFailed", "Failed to delete"));
    },
  });

  const items = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleOpenCreate = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };
  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };
  const handleRowDeleteClick = (id) => {
    setDeleteId(id);
    setOpenDelete(true);
  };
  const handleConfirmDelete = async () => {
    try {
      await deleteMutation.mutateAsync(deleteId);
    } finally {
      setDeleteId(null);
      setOpenDelete(false);
    }
  };
  const handleStatusToggle = (id, currentStatus) => {
    updateMutation.mutate({ id, payload: { status: !currentStatus } });
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder={tk("search", "Search...")}
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {canModify && (
          <Button onClick={handleOpenCreate}>{tk("create", "Create")}</Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tk("table.name", "Name")}</TableHead>
            <TableHead>{tk("table.status", "Status")}</TableHead>
            <TableHead>{tk("table.action", "Action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={3} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center p-8">
                <ErrorMessage
                  message={error?.message || tk("messages.loadFailed", "Failed to load")}
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : items?.length > 0 ? (
            items.map((i) => (
              <TableRow key={i._id}>
                <TableCell>{i?.name}</TableCell>
                <TableCell>
                  <Switch
                    checked={i?.status}
                    onCheckedChange={() => handleStatusToggle(i._id, i?.status)}
                    onClick={(e) => e.stopPropagation()}
                    disabled={!canModify}
                  />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {canModify && (
                    <RowActionMenu
                      actions={[
                        {
                          label: t("common.edit", "Edit"),
                          icon: Edit,
                          onClick: () => handleOpenEdit(i),
                        },
                        {
                          label: t("common.delete", "Delete"),
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
              <TableCell colSpan={3} className="text-center">
                {tk("table.noItems", "No items found")}
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

      <MasterDataModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedItem}
        tk={tk}
        createMutation={createMutation}
        updateMutation={updateMutation}
      />

      <DeleteConfirm
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        count={1}
        isLoading={deleteMutation.isPending}
        data={tk("entity", "Item")}
      />
    </div>
  );
};

const MasterDataModal = ({ open, onClose, item, tk, createMutation, updateMutation }) => {
  const isEdit = !!item;
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues: { name: "" } });

  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (item && isEdit && open) {
      setValue("name", item.name || "");
    }
  }, [item, isEdit, setValue, open]);

  const onSubmit = (formData) => {
    const payload = { name: formData.name };
    const mutation = isEdit ? updateMutation : createMutation;
    const mutationData = isEdit ? { id: item._id, payload } : payload;
    mutation.mutate(mutationData, { onSuccess: handleClose });
  };

  if (!open) return null;

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-96 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEdit ? tk("modal.editTitle", "Edit") : tk("modal.createTitle", "Create")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-white/70">
              {isEdit
                ? tk("modal.editSubtitle", "Update the details below")
                : tk("modal.createSubtitle", "Fill in the details below")}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground dark:text-white/70 hover:text-gray-700 dark:hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            label={tk("modal.nameLabel", "Name")}
            placeholder={tk("modal.namePlaceholder", "Enter name")}
            error={errors.name?.message}
            required
            {...register("name", {
              required: tk("modal.nameRequired", "Name is required"),
            })}
          />

          <FormActions onCancel={handleClose} isLoading={isSubmitting} isEdit={isEdit} />
        </form>
      </div>
    </div>
  );
};

export default MasterDataManager;
