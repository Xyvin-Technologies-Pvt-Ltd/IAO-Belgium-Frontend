import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import { LoadingState, ErrorMessage } from "@/components/common";
import {
  useCreateProgram,
  useProgramById,
  useUpdateProgram,
} from "@/store/useProgramStore";

const CreateAdmin = ({ open, onClose, adminId }) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const isEdit = !!adminId;
  const { data: admin, isLoading, error, refetch } = useProgramById(adminId);
  const createAdmin = useCreateProgram();
  const updateAdmin = useUpdateProgram();

  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (admin?.data && isEdit) {
      const adminData = admin.data;
      Object.keys(adminData).forEach((key) => {
        setValue(key, adminData[key]);
      });
    }
  }, [admin, isEdit, setValue]);

  const onSubmit = (formData) => {
    const mutation = isEdit ? updateAdmin : createAdmin;
    const mutationData = isEdit ? { id: adminId, data: formData } : formData;

    mutation.mutate(mutationData, {
      onSuccess: () => {
        toast.success(`Admin ${isEdit ? "updated" : "created"} successfully!`);
        handleClose();
      },
    });
  };

  if (!open) return null;

  const isSubmitting = createAdmin.isLoading || updateAdmin.isLoading;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-xl shadow-lg w-100 p-6">
        <h2 className="text-xl font-bold">
          {isEdit ? "Edit Admin" : "Create a new Admin"}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {isEdit ? "Update the admin details" : "Let's create a new admin"}
        </p>

        {isEdit && isLoading ? (
          <LoadingState text="Loading admin details..." />
        ) : isEdit && error ? (
          <ErrorMessage
            message={error?.message || "Failed to load admin details"}
            onRetry={refetch}
            variant="card"
          />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              label="Name"
              placeholder="Enter Name"
              error={errors.name?.message}
              required
              {...register("name", { required: "Admin name is required" })}
            />

            <FormField
              label="Email"
              placeholder="Enter Email"
              error={errors.email?.message}
              required
              {...register("email", {
                required: "Email is required",
              })}
            />

            <FormField
              label="Phone"
              placeholder="Enter Phone"
              error={errors.phone?.message}
              required
              {...register("phone", { required: "Phone is required" })}
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

export default CreateAdmin;
