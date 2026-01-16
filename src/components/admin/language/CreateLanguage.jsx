import { useEffect } from "react";
import { useForm } from "react-hook-form";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import { useTranslation } from "react-i18next";
import { useCreateLanguage, useUpdateLanguage } from "@/store/useLanguageStore";

const CreateLanguage = ({ open, onClose, languageData }) => {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
    },
  });

  const isEdit = !!languageData;
  const createLanguage = useCreateLanguage();
  const updateLanguage = useUpdateLanguage();


  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (languageData && isEdit && open) {
      setValue("name", languageData.name || "");
    }
  }, [languageData, isEdit, setValue, open]);

  const onSubmit = (formData) => {
    const payload = {
      name: formData.name,
    };

    const mutation = isEdit ? updateLanguage : createLanguage;
    const mutationData = isEdit ? { id: languageData._id, data: payload } : payload;

    mutation.mutate(mutationData, {
      onSuccess: () => {
        handleClose();
      },
    });
  };

  if (!open) return null;

  const isSubmitting = createLanguage.isPending || updateLanguage.isPending;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-96 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {isEdit
            ? t("languageManagement.modal.editTitle")
            : t("languageManagement.modal.createTitle")}
        </h2>
        <p className="text-sm text-gray-500 dark:text-white/70 mb-6">
          {isEdit
            ? t("languageManagement.modal.editSubtitle")
            : t("languageManagement.modal.createSubtitle")}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            label={t("languageManagement.modal.nameLabel")}
            placeholder={t("languageManagement.modal.namePlaceholder")}
            error={errors.name?.message}
            required
            {...register("name", {
              required: t("languageManagement.modal.nameRequired"),
            })}
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

export default CreateLanguage;
