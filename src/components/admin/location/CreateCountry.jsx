import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import { LoadingState, ErrorMessage } from "@/components/common";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCountryById, useCreateCountry, useUpdateCountry } from "@/store/useCountryStore";

const CreateCountry = ({ open, onClose, countryId }) => {

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      code: "",
      name: "",
      isActive: true,
    },
  });

  const isEdit = !!countryId;
  const {
    data: country,
    isLoading,
    error,
    refetch,
  } = useCountryById(countryId);
  const createCountry = useCreateCountry();
  const updateCountry = useUpdateCountry();


  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (open && !isEdit) {
      reset({
        code: "",
        name: "",
        isActive: true,
      });
    }
  }, [open, isEdit, reset]);

  useEffect(() => {
    if (country?.data && isEdit && open) {
      const countryData = country.data;
      setValue('code', countryData.code || '');
      setValue('name', countryData.name || '');
      setValue('isActive', countryData.is_active ?? true);
    }
  }, [country, isEdit, setValue, open]);

  const onSubmit = (formData) => {
    const payload = {
      code: formData.code,
      name: formData.name,
      isActive: formData.isActive,
    };

    const mutation = isEdit ? updateCountry : createCountry;
    const mutationData = isEdit ? { id: countryId, data: payload } : payload;

    mutation.mutate(mutationData, {
      onSuccess: () => {
        toast.success(
          `Country ${isEdit ? "updated" : "created"} successfully!`
        );
        handleClose();
      },
    });
  };

  if (!open) return null;

  const isSubmitting = createCountry.isLoading || updateCountry.isLoading;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-96 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {isEdit ? "Edit Country" : "Add Country"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-white/70 mb-6">
          {isEdit ? "Update the Country details" : "Lets create a Country"}
        </p>

        {isEdit && isLoading ? (
          <LoadingState text="Loading Country details..." />
        ) : isEdit && error ? (
          <ErrorMessage
            message={error?.message || "Failed to load Country details"}
            onRetry={refetch}
            variant="card"
          />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              label="Country Code"
              placeholder="Enter country code (e.g., US, CA, UK)"
              error={errors.code?.message}
              required
              {...register("code", { required: "Country code is required" })}
            />

            <FormField
              label="Country Name"
              placeholder="Enter country name"
              error={errors.name?.message}
              required
              {...register("name", { required: "Country name is required" })}
            />

            <div className="flex items-center space-x-3">
              <Switch
                checked={watch("isActive")}
                onCheckedChange={(checked) => setValue("isActive", checked)}
              />
              <Label className="text-base font-medium">Active</Label>
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

export default CreateCountry;
