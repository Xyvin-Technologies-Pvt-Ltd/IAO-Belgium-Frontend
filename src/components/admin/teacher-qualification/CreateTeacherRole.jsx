import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { X } from "lucide-react";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import SearchableMultiSelect from "@/components/ui/forms/SearchableMultiSelect";
import { useTranslation } from "react-i18next";
import { useCreateTeacherRole, useUpdateTeacherRole } from "@/store/useTeacherRoleStore";

const CreateTeacherRole = ({ open, onClose, roleData }) => {
  const { t } = useTranslation();

  const roleTypeItems = [
    { _id: "teacher", name: t("teacherRoleManagement.functionalRoles.teacher", "Teacher") },
    { _id: "assistant", name: t("teacherRoleManagement.functionalRoles.assistant", "Assistant") },
    { _id: "trainee", name: t("teacherRoleManagement.functionalRoles.trainee", "Trainee") },
  ];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      keys: [roleTypeItems[0]],
    },
  });

  const isEdit = !!roleData;
  const createRole = useCreateTeacherRole();
  const updateRole = useUpdateTeacherRole();


  const handleClose = () => {
    reset({
      name: "",
      keys: [roleTypeItems[0]],
    });
    onClose();
  };

  useEffect(() => {
    if (roleData && isEdit && open) {
      setValue("name", roleData.name || "");
      const mappedKeys = (roleData.keys || []).map(k => {
        const item = roleTypeItems.find(item => item._id === k);
        return item || { _id: k, name: k };
      });
      setValue("keys", mappedKeys);
    }
  }, [roleData, isEdit, setValue, open]);

  const onSubmit = (formData) => {
    const payload = {
      name: formData.name,
      keys: (formData.keys || []).map(k => k._id),
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
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-96 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEdit
                ? t("teacherRoleManagement.modal.editTitle")
                : t("teacherRoleManagement.modal.createTitle")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-white/70">
              {isEdit
                ? t("teacherRoleManagement.modal.editSubtitle")
                : t("teacherRoleManagement.modal.createSubtitle")}
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
            label={t("teacherRoleManagement.modal.nameLabel")}
            placeholder={t("teacherRoleManagement.modal.namePlaceholder")}
            error={errors.name?.message}
            required
            {...register("name", {
              required: t("teacherRoleManagement.modal.nameRequired"),
            })}
          />

          <Controller
            name="keys"
            control={control}
            rules={{ required: t("teacherRoleManagement.modal.keysRequired", "At least one functional role is required") }}
            render={({ field }) => (
              <SearchableMultiSelect
                label={t("teacherRoleManagement.modal.functionalRolesLabel", "Functional Roles")}
                placeholder={t("teacherRoleManagement.modal.functionalRolesPlaceholder", "Select functional categories...")}
                searchPlaceholder={t("teacherRoleManagement.modal.searchFunctionalRoles", "Search categories...")}
                items={roleTypeItems}
                selected={field.value || []}
                onChange={field.onChange}
                error={errors.keys?.message}
                required
              />
            )}
          />

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

export default CreateTeacherRole;
