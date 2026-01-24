import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import { useCreateAdmin } from "@/store/useAdminStore";
import { useGetAllRoles } from "@/store/useDropdownStore";
import { adminSchema } from "@/validations/admin";
import { useTranslation } from "react-i18next";

const CreateAdmin = ({ open, onClose }) => {
  const { t } = useTranslation();

  // Search term for roles dropdown
  const [roleSearchTerm, setRoleSearchTerm] = useState("");

  // Fetch dropdown data with search
  const { data: rolesData, isLoading: rolesLoading } = useGetAllRoles(
    { 
      status: true,
      ...(roleSearchTerm && { search: roleSearchTerm })
    },
    { enabled: open }
  );

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

  const createAdmin = useCreateAdmin();

  const selectedRole = watch("role_access");

  const handleClose = () => {
    reset({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      role_access: "",
    });
    // Reset search term
    setRoleSearchTerm("");
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

            <SearchableSelect
              label={t("adminManagement.modal.roleLabel")}
              placeholder={t("adminManagement.modal.rolePlaceholder")}
              searchPlaceholder="Search roles..."
              items={rolesData?.data || []}
              value={selectedRole || ""}
              onChange={(value) => setValue("role_access", value, { shouldValidate: true })}
              onSearch={setRoleSearchTerm}
              isLoading={rolesLoading}
              error={errors.role_access?.message}
              required
            />

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
