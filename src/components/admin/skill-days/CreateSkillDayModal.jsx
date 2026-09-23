import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import { useCreateSkillDay, useUpdateSkillDay } from "@/store/useSkillDayStore";
import { useTranslation } from "react-i18next";

const CreateSkillDayModal = ({ open, onClose, skillDayData = null }) => {
  const { t } = useTranslation();
  const isEdit = !!skillDayData;
  const createMutation = useCreateSkillDay();
  const updateMutation = useUpdateSkillDay();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      start_date: "",
      end_date: "",
      location: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (skillDayData) {
        reset({
          name: skillDayData.name || "",
          start_date: skillDayData.start_date
            ? new Date(skillDayData.start_date).toISOString().split("T")[0]
            : "",
          end_date: skillDayData.end_date
            ? new Date(skillDayData.end_date).toISOString().split("T")[0]
            : "",
          location: skillDayData.location || "",
        });
      } else {
        reset({
          name: "",
          start_date: "",
          end_date: "",
          location: "",
        });
      }
    }
  }, [open, skillDayData, reset]);

  if (!open) return null;

  const handleClose = () => {
    reset({
      name: "",
      start_date: "",
      end_date: "",
      location: "",
    });
    onClose();
  };

  const onSubmit = async (values) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: skillDayData._id,
          ...values,
        });
      } else {
        await createMutation.mutateAsync(values);
      }
      handleClose();
    } catch (err) {
      // Toast handled by store
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white dark:bg-black border dark:border-white/20 shadow-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b dark:border-white/20">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEdit ? "Edit Skill Day" : "Create Skill Day"}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-muted-foreground dark:text-white/70 hover:text-gray-700 dark:hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-l-2 border-gray-300 dark:border-zinc-700 pl-2.5">
                Skill Day Information
              </h3>

              <FormField
                label="Skill Day Name"
                placeholder="Enter skill day name"
                {...register("name", { required: "Name is required" })}
                error={errors.name?.message}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Start Date"
                  type="date"
                  placeholder="Select start date"
                  {...register("start_date", { required: "Start date is required" })}
                  error={errors.start_date?.message}
                  required
                />

                <FormField
                  label="End Date"
                  type="date"
                  placeholder="Select end date"
                  {...register("end_date", { required: "End date is required" })}
                  error={errors.end_date?.message}
                  required
                />
              </div>

              <FormField
                label="Location"
                placeholder="Enter location"
                {...register("location", { required: "Location is required" })}
                error={errors.location?.message}
                required
              />
            </div>

            {/* Actions */}
            <FormActions
              onCancel={handleClose}
              isLoading={isLoading}
              isEdit={isEdit}
              submitText={isEdit ? "Update Skill Day" : "Create Skill Day"}
              cancelText="Cancel"
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateSkillDayModal;
