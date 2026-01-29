import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import { useTranslation } from "react-i18next";
import { useCreateTitle, useUpdateTitle } from "@/store/useTitleStore";

const CreateTitle = ({ open, onClose, titleData }) => {
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

  const isEdit = !!titleData;
  const createTitle = useCreateTitle();
  const updateTitle = useUpdateTitle();


  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (titleData && isEdit && open) {
      setValue("name", titleData.name || "");
    }
  }, [titleData, isEdit, setValue, open]);

  const onSubmit = (formData) => {
    const payload = {
      name: formData.name,
    };

    const mutation = isEdit ? updateTitle : createTitle;
    const mutationData = isEdit ? { id: titleData._id, data: payload } : payload;

    mutation.mutate(mutationData, {
      onSuccess: () => {
        handleClose();
      },
    });
  };

  if (!open) return null;

  const isSubmitting = createTitle.isPending || updateTitle.isPending;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-96 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEdit
                ? t("teacherTitleManagement.modal.editTitle")
                : t("teacherTitleManagement.modal.createTitle")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-white/70">
              {isEdit
                ? t("teacherTitleManagement.modal.editSubtitle")
                : t("teacherTitleManagement.modal.createSubtitle")}
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
            label={t("teacherTitleManagement.modal.nameLabel")}
            placeholder={t("teacherTitleManagement.modal.namePlaceholder")}
            error={errors.name?.message}
            required
            {...register("name", {
              required: t("teacherTitleManagement.modal.nameRequired"),
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

export default CreateTitle;
