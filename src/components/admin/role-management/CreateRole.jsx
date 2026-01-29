import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import { useCreateRole, useUpdateRole } from "@/store/useRoleStore";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { roleSchema } from "@/validations/admin";
import { useTranslation } from "react-i18next";

const CreateRole = ({ open, onClose, roleData }) => {
  const { t } = useTranslation();
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const PERMISSION_MODULES = [
    {
      name: t("roleManagement.permissions.rolesManagement"),
      permissions: [
        {
          id: "roles_management_view",
          label: t("roleManagement.modal.viewLabel"),
        },
        {
          id: "roles_management_modify",
          label: t("roleManagement.modal.modifyLabel"),
        },
      ],
    },
    {
      name: t("roleManagement.permissions.adminManagement"),
      permissions: [
        {
          id: "admin_management_view",
          label: t("roleManagement.modal.viewLabel"),
        },
        {
          id: "admin_management_modify",
          label: t("roleManagement.modal.modifyLabel"),
        },
      ],
    },
    {
      name: t("roleManagement.permissions.operationsManagement"),
      permissions: [
        {
          id: "operations_management_view",
          label: t("roleManagement.modal.viewLabel"),
        },
        {
          id: "operations_management_modify",
          label: t("roleManagement.modal.modifyLabel"),
        },
      ],
    },
    {
      name: t("roleManagement.permissions.academicManagement"),
      permissions: [
        {
          id: "academic_management_view",
          label: t("roleManagement.modal.viewLabel"),
        },
        {
          id: "academic_management_modify",
          label: t("roleManagement.modal.modifyLabel"),
        },
      ],
    },
    {
      name: t("roleManagement.permissions.financeManagement"),
      permissions: [
        {
          id: "finance_management_view",
          label: t("roleManagement.modal.viewLabel"),
        },
        {
          id: "finance_management_modify",
          label: t("roleManagement.modal.modifyLabel"),
        },
      ],
    },
    {
      name: t("roleManagement.permissions.masterDataManagement"),
      permissions: [
        {
          id: "master_data_management_view",
          label: t("roleManagement.modal.viewLabel"),
        },
        {
          id: "master_data_management_modify",
          label: t("roleManagement.modal.modifyLabel"),
        },
      ],
    },
    {
      name: t("roleManagement.permissions.logsManagement"),
      permissions: [
        {
          id: "logs_management_view",
          label: t("roleManagement.modal.viewLabel"),
        },
      ],
    },
  ];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: [],
    },
  });

  const isEdit = !!roleData;
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();

  const handleClose = () => {
    reset({
      name: "",
      description: "",
      permissions: [],
    });
    setSelectedPermissions([]);
    onClose();
  };

  useEffect(() => {
    if (roleData && isEdit && open) {
      setValue("name", roleData.name || "");
      setValue("description", roleData.description || "");
      setValue("permissions", roleData.permissions || []);
      setSelectedPermissions(roleData.permissions || []);
    }
  }, [roleData, isEdit, setValue, open]);

  const togglePermission = (permissionId) => {
    const newPermissions = selectedPermissions.includes(permissionId)
      ? selectedPermissions.filter((id) => id !== permissionId)
      : [...selectedPermissions, permissionId];
    
    setSelectedPermissions(newPermissions);
    setValue("permissions", newPermissions, { shouldValidate: true });
    
    // Clear permissions error if at least one permission is selected
    if (newPermissions.length > 0) {
      clearErrors("permissions");
    }
  };

  const onSubmit = (formData) => {
    const payload = {
      ...formData,
      permissions: selectedPermissions,
    };

    const mutation = isEdit ? updateRole : createRole;
    const mutationData = isEdit ? { id: roleData._id, data: payload } : payload;

    mutation.mutate(mutationData, {
      onSuccess: () => {
        handleClose();
      },
    });
  };

  if (!open) return null;

  const isSubmitting = createRole.isPending || updateRole.isPending;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-150 max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEdit
                ? t("roleManagement.modal.editTitle")
                : t("roleManagement.modal.createTitle")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-white/70">
              {isEdit
                ? t("roleManagement.modal.editSubtitle")
                : t("roleManagement.modal.createSubtitle")}
            </p>
          </div>
          <button 
            onClick={handleClose}
            className="text-muted-foreground dark:text-white/70 hover:text-gray-700 dark:hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            label={t("roleManagement.modal.nameLabel")}
            placeholder={t("roleManagement.modal.namePlaceholder")}
            error={errors.name?.message}
            required
            {...register("name")}
          />

          <FormField
            label={t("roleManagement.modal.descriptionLabel")}
            placeholder={t("roleManagement.modal.descriptionPlaceholder")}
            error={errors.description?.message}
            required
            {...register("description")}
          />

          <div className="space-y-3">
            <Label className="text-base font-medium text-gray-900 dark:text-white">
              {t("roleManagement.modal.permissionsLabel")} <span className="text-red-500">*</span>
            </Label>
            <div className="border dark:border-white/20 rounded-lg overflow-hidden bg-white dark:bg-black">
              <div className="grid grid-cols-[2fr_100px_100px] gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 border-b dark:border-white/20">
                <div></div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                  {t("roleManagement.modal.viewLabel")}
                </div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                  {t("roleManagement.modal.modifyLabel")}
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {PERMISSION_MODULES.map((module, index) => (
                  <div
                    key={module.name}
                    className={`grid grid-cols-[2fr_100px_100px] gap-4 p-4 items-center ${
                      index !== PERMISSION_MODULES.length - 1
                        ? "border-b dark:border-white/10"
                        : ""
                    }`}
                  >
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {module.name}
                    </div>
                    <div className="flex justify-center">
                      {module.permissions[0] && (
                        <Checkbox
                          id={module.permissions[0].id}
                          checked={selectedPermissions.includes(
                            module.permissions[0].id
                          )}
                          onCheckedChange={() =>
                            togglePermission(module.permissions[0].id)
                          }
                        />
                      )}
                    </div>
                    <div className="flex justify-center">
                      {module.permissions[1] && (
                        <Checkbox
                          id={module.permissions[1].id}
                          checked={selectedPermissions.includes(
                            module.permissions[1].id
                          )}
                          onCheckedChange={() =>
                            togglePermission(module.permissions[1].id)
                          }
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {errors.permissions && (
              <p className="text-sm text-red-500">{errors.permissions.message}</p>
            )}
          </div>

          <FormActions
            onCancel={handleClose}
            isLoading={isSubmitting}
            isEdit={isEdit}
          />
        </form>
      </div>
    </div>
  );
};

export default CreateRole;
