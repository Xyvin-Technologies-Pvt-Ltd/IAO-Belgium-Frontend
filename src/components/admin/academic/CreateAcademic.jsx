import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import { useCreateAcademic, useUpdateAcademic } from "@/store/useAcademicStore";
import { academicSchema } from "@/validations/admin";

const CreateAcademic = ({ open, onClose, academicData }) => {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(academicSchema),
    defaultValues: {
      name: "",
      registartion_start_date: "",
      registartion_end_date: "",
      status: true,
    },
  });

  const isEdit = !!academicData;
  const createAcademic = useCreateAcademic();
  const updateAcademic = useUpdateAcademic();
  
  const statusValue = watch("status");


  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (academicData && isEdit && open) {
      setValue("name", academicData.name || "");
      setValue("registartion_start_date", academicData.registartion_start_date ? new Date(academicData.registartion_start_date).toISOString().split('T')[0] : "");
      setValue("registartion_end_date", academicData.registartion_end_date ? new Date(academicData.registartion_end_date).toISOString().split('T')[0] : "");
      setValue("status", academicData.status ?? true);
    }
  }, [academicData, isEdit, setValue, open]);

  const onSubmit = (formData) => {
    const payload = {
      name: formData.name,
      registartion_start_date: formData.registartion_start_date,
      registartion_end_date: formData.registartion_end_date,
      status: formData.status,
    };

    const mutation = isEdit ? updateAcademic : createAcademic;
    const mutationData = isEdit ? { id: academicData._id, data: payload } : payload;

    mutation.mutate(mutationData, {
      onSuccess: () => {
        handleClose();
      },
    });
  };

  if (!open) return null;

  const isSubmitting = createAcademic.isPending || updateAcademic.isPending;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-96 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {isEdit
            ? t("academicManagement.modal.editTitle")
            : t("academicManagement.modal.createTitle")}
        </h2>
        <p className="text-sm text-gray-500 dark:text-white/70 mb-6">
          {isEdit
            ? t("academicManagement.modal.editSubtitle")
            : t("academicManagement.modal.createSubtitle")}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            label={t("academicManagement.modal.nameLabel")}
            placeholder={t("academicManagement.modal.namePlaceholder")}
            error={errors.name?.message}
            required
            {...register("name")}
          />

          <FormField
            label={t("academicManagement.modal.registrationStartDateLabel")}
            type="date"
            error={errors.registartion_start_date?.message}
            required
            {...register("registartion_start_date")}
          />

          <FormField
            label={t("academicManagement.modal.registrationEndDateLabel")}
            type="date"
            error={errors.registartion_end_date?.message}
            required
            {...register("registartion_end_date")}
          />

          <div className="flex items-center space-x-2">
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Switch
                  id="status"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="status" className="text-sm font-medium">
              {statusValue ? "Active" : "Inactive"}
            </Label>
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

export default CreateAcademic;
