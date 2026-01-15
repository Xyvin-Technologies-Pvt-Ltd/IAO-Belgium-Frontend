import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import { LoadingState } from "@/components/common";
import { useCreateAdmin, useUpdateAdmin } from "@/store/useAdminStore";
import { useGetRoles } from "@/store/useRoleStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const CreateAdmin = ({ open, onClose, adminData }) => {
  const [isLoadingData, setIsLoadingData] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      role_access: "",
    },
  });

  const isEdit = !!adminData;
  const { data: rolesData, isLoading: isLoadingRoles } = useGetRoles(
    { limit: 100 },
    { enabled: open }
  );
  const createAdmin = useCreateAdmin();
  const updateAdmin = useUpdateAdmin();

  const roles = rolesData?.data?.filter(role => role.status) || [];
  const selectedRole = watch("role_access");

  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (open && !isEdit) {
      reset({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        role_access: "",
      });
    }
  }, [open, isEdit, reset]);

  useEffect(() => {
    if (adminData && isEdit && open && !isLoadingRoles) {
      setIsLoadingData(true);
      reset({
        first_name: adminData.first_name || "",
        last_name: adminData.last_name || "",
        email: adminData.email || "",
        phone: adminData.phone || "",
        role_access: adminData.role_id || "",
      });
      setIsLoadingData(false);
    }
  }, [adminData, isEdit, open, isLoadingRoles, reset]);

  const onSubmit = (formData) => {
    if (!formData.role_access) {
      toast.error("Please select a role");
      return;
    }

    const mutation = isEdit ? updateAdmin : createAdmin;
    const mutationData = isEdit ? { id: adminData._id, data: formData } : formData;

    mutation.mutate(mutationData, {
      onSuccess: () => {
        handleClose();
      },
    });
  };

  if (!open) return null;

  const isSubmitting = createAdmin.isPending || updateAdmin.isPending;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-150 max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {isEdit ? "Edit Admin" : "Create a new Admin"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-white/70 mb-6">
          {isEdit ? "Update the admin details" : "Let's create a new admin"}
        </p>

        {isLoadingData ? (
          <LoadingState text="Loading admin details..." />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              label="First Name"
              placeholder="Enter First Name"
              error={errors.first_name?.message}
              required
              {...register("first_name", { required: "First name is required" })}
            />

            <FormField
              label="Last Name"
              placeholder="Enter Last Name"
              error={errors.last_name?.message}
              required
              {...register("last_name", { required: "Last name is required" })}
            />

            <FormField
              label="Email"
              placeholder="Enter Email"
              error={errors.email?.message}
              required
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
            />

            <FormField
              label="Phone"
              placeholder="Enter Phone"
              error={errors.phone?.message}
              required
              {...register("phone", { required: "Phone is required" })}
            />

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 dark:text-white">
                Role <span className="text-red-500">*</span>
              </Label>
              {isLoadingRoles ? (
                <div className="text-sm text-gray-500">Loading roles...</div>
              ) : (
                <Select
                  value={selectedRole}
                  onValueChange={(value) => setValue("role_access", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.length > 0 ? (
                      roles.map((role) => (
                        <SelectItem key={role._id} value={role._id}>
                          {role.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-gray-500">No active roles found</div>
                    )}
                  </SelectContent>
                </Select>
              )}
              {errors.role_access && (
                <p className="text-sm text-red-500">{errors.role_access.message}</p>
              )}
            </div>

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
