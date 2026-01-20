import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import { useCreateAdmin } from "@/store/useAdminStore";
import { useGetRoles } from "@/store/useRoleStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { adminSchema } from "@/validations/admin";
import { useTranslation } from "react-i18next";

const CreateAdmin = ({ open, onClose }) => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      role_access: "",
    },
  });

  const { data: rolesData, isLoading: isLoadingRoles, isFetching: isFetchingRoles } = useGetRoles(
    { limit: 100 },
    { enabled: open }
  );
  const createAdmin = useCreateAdmin();

  const roles = rolesData?.data?.filter(role => role.status) || [];
  const selectedRole = watch("role_access");

  const handleClose = () => {
    reset({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      role_access: "",
    });
    onClose();
  };

  const onSubmit = (formData) => {
    createAdmin.mutate(formData, {
      onSuccess: () => {
        handleClose();
      },
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-150 max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {t("adminManagement.modal.createTitle")}
        </h2>
        <p className="text-sm text-gray-500 dark:text-white/70 mb-6">
          {t("adminManagement.modal.createSubtitle")}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              label={t("adminManagement.modal.firstNameLabel")}
              placeholder={t("adminManagement.modal.firstNamePlaceholder")}
              error={errors.first_name?.message}
              required
              {...register("first_name")}
            />

            <FormField
              label={t("adminManagement.modal.lastNameLabel")}
              placeholder={t("adminManagement.modal.lastNamePlaceholder")}
              error={errors.last_name?.message}
              required
              {...register("last_name")}
            />

            <FormField
              label={t("adminManagement.modal.emailLabel")}
              placeholder={t("adminManagement.modal.emailPlaceholder")}
              error={errors.email?.message}
              required
              {...register("email")}
            />

            <FormField
              label={t("adminManagement.modal.phoneLabel")}
              placeholder={t("adminManagement.modal.phonePlaceholder")}
              error={errors.phone?.message}
              required
              {...register("phone")}
            />

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 dark:text-white">
                {t("adminManagement.modal.roleLabel")} <span className="text-red-500">*</span>
              </Label>
              {isLoadingRoles || isFetchingRoles ? (
                <div className="text-sm text-gray-500 dark:text-white/70">
                  {t("adminManagement.modal.loadingRoles")}
                </div>
              ) : (
                <Select
                  value={selectedRole}
                  onValueChange={(value) => setValue("role_access", value, { shouldValidate: true })}
                >
                 <SelectTrigger>
                    <SelectValue placeholder={t("adminManagement.modal.rolePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.length > 0 ? (
                      roles.map((role) => (
                        <SelectItem key={role._id} value={role._id}>
                          {role.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-gray-500 dark:text-white/70">
                        {t("adminManagement.modal.noActiveRoles")}
                      </div>
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
              isLoading={createAdmin.isPending}
              isEdit={false}
            />
          </form>
      </div>
    </div>
  );
};

export default CreateAdmin;
