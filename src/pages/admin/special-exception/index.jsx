import { useState } from "react";
import { useTranslation } from "react-i18next";
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
import { Label } from "@/components/ui/label";
import { Plus, X, Edit, Trash2 } from "lucide-react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import ErrorMessage from "@/components/common/ErrorMessage";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import DeleteConfirm from "@/components/DeleteConfirm";
import {
  useGetSpecialExceptions,
  useCreateSpecialException,
  useUpdateSpecialException,
  useDeleteSpecialException,
} from "@/store/useStudentStore";

const SpecialExceptions = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedException, setSelectedException] = useState(null);
  
  // Delete confirmation state
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  
  // Create/Edit Form State
  const [name, setName] = useState("");
  const [extraTimeMin, setExtraTimeMin] = useState(15);
  const [formError, setFormError] = useState("");

  const { data, isLoading, error, refetch, isFetching } = useGetSpecialExceptions();
  const createExceptionMutation = useCreateSpecialException();
  const updateExceptionMutation = useUpdateSpecialException();
  const deleteExceptionMutation = useDeleteSpecialException();

  const exceptions = data?.data || [];

  // Filter exceptions locally by search
  const filteredExceptions = exceptions.filter((ex) =>
    ex.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setSelectedException(null);
    setName("");
    setExtraTimeMin(15);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ex) => {
    setSelectedException(ex);
    setName(ex.name || "");
    setExtraTimeMin(ex.extra_time_min ?? 15);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenDelete = (id) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteExceptionMutation.mutateAsync(deleteId);
    } finally {
      setDeleteId(null);
      setOpenDelete(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      setFormError("Name is required");
      return;
    }

    if (extraTimeMin < 0) {
      setFormError("Extra time must be 0 or more minutes");
      return;
    }

    const payload = {
      name: name.trim(),
      extra_time_min: Number(extraTimeMin),
    };

    if (selectedException) {
      // Update
      updateExceptionMutation.mutate(
        {
          id: selectedException._id,
          data: payload,
        },
        {
          onSuccess: () => {
            setIsModalOpen(false);
          },
          onError: (err) => {
            setFormError(err.message || "Failed to update special exception");
          },
        }
      );
    } else {
      // Create
      createExceptionMutation.mutate(
        payload,
        {
          onSuccess: () => {
            setIsModalOpen(false);
          },
          onError: (err) => {
            setFormError(err.message || "Failed to create special exception");
          },
        }
      );
    }
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          Special Exceptions
        </h2>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="Search special exceptions..."
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button onClick={handleOpenCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Exception
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Condition Name</TableHead>
            <TableHead>Extra Time (Minutes)</TableHead>
            <TableHead className="w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={5} columns={3} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center p-8">
                <ErrorMessage
                  message={error?.message || "Failed to load special exceptions"}
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : filteredExceptions.length > 0 ? (
            filteredExceptions.map((ex) => (
              <TableRow key={ex._id}>
                <TableCell className="font-medium text-gray-900 dark:text-white">
                  {ex.name}
                </TableCell>
                <TableCell>
                  +{ex.extra_time_min} min
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <RowActionMenu
                    actions={[
                      {
                        label: "Edit",
                        icon: Edit,
                        onClick: () => handleOpenEdit(ex),
                      },
                      {
                        label: "Delete",
                        icon: Trash2,
                        onClick: () => handleOpenDelete(ex._id),
                      },
                    ]}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                No special exceptions found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Add/Edit Exception Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-full max-w-md flex flex-col p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {selectedException ? "Edit Special Exception" : "Add Special Exception"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-gray-700 dark:hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exception-name">Exception Name</Label>
                <Input
                  id="exception-name"
                  placeholder="e.g. Dyslexia, ADHD, Dyscalculia"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exception-time">Extra Time (Minutes)</Label>
                <Input
                  id="exception-time"
                  type="number"
                  min="0"
                  placeholder="e.g. 15"
                  value={extraTimeMin}
                  onChange={(e) => setExtraTimeMin(e.target.value)}
                />
              </div>

              {formError && (
                <p className="text-sm text-red-500 font-medium">
                  {formError}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-white bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={createExceptionMutation.isPending || updateExceptionMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-[#ff8904] rounded-lg hover:bg-[#e07b03] disabled:opacity-50 cursor-pointer"
              >
                {createExceptionMutation.isPending || updateExceptionMutation.isPending
                  ? "Saving..."
                  : selectedException
                  ? "Save Changes"
                  : "Create Exception"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirm
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        count={1}
        isLoading={deleteExceptionMutation.isPending}
        data="Special Exception"
      />
    </div>
  );
};

export default SpecialExceptions;
