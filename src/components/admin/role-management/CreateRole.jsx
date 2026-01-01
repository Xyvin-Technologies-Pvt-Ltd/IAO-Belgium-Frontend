import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import { LoadingState, ErrorMessage } from "@/components/common";
import { useCreateRole, useRoleById, useUpdateRole } from "@/store/useRoleStore";


const CreateRole = ({ open, onClose, roleId }) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const isEdit = !!roleId;
  const { data: role, isLoading, error, refetch } = useRoleById(roleId);
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();

  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (role?.data && isEdit) {
      const roleData = role.data;
      Object.keys(roleData).forEach((key) => {
        setValue(key, roleData[key]);
      });
    }
  }, [role, isEdit, setValue]);

  const onSubmit = (formData) => {
    const mutation = isEdit ? updateRole : createRole;
    const mutationData = isEdit ? { id: roleId, data: formData } : formData;

    mutation.mutate(mutationData, {
      onSuccess: () => {
        toast.success(`Role ${isEdit ? "updated" : "created"} successfully!`);
        handleClose();
      },
    });
  };

  if (!open) return null;

  const isSubmitting = createRole.isLoading || updateRole.isLoading;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-xl shadow-lg w-100 p-6">
        <h2 className="text-xl font-bold">
          {isEdit ? "Edit Role" : "Create a new Role"}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {isEdit ? "Update the role details" : "Let's create a new role"}
        </p>

        {isEdit && isLoading ? (
          <LoadingState text="Loading role details..." />
        ) : isEdit && error ? (
          <ErrorMessage
            message={error?.message || "Failed to load role details"}
            onRetry={refetch}
            variant="card"
          />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              label="Name"
              placeholder="Enter Role Name"
              error={errors.name?.message}
              required
              {...register("name", { required: "Role name is required" })}
            />

            <FormField
              label="Description"
              placeholder="Enter Description"
              error={errors.description?.message}
              required
              {...register("description", {
                required: "Description is required",
              })}
            />

          
            <FormActions
              onCancel={handleClose}
              isLoading={isSubmitting}
              isEdit={isEdit}
            />
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateRole;
