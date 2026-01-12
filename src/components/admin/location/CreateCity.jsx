import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import { LoadingState, ErrorMessage } from "@/components/common";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCityById, useCreateCity, useUpdateCity } from "@/store/useCityStore";

const CreateCity = ({ open, onClose, cityId }) => {

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      city: "",
      language: "",
      status: true,
    },
  });

  const isEdit = !!cityId;
  const {
    data:city,
    isLoading,
    error,
    refetch,
  } = useCityById(cityId);
  const createCity = useCreateCity();
  const updateCity = useUpdateCity();


  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (city?.data && isEdit) {
      const cityData = city.data;
      Object.keys(cityData).forEach((key) => {
        setValue(key, cityData[key]);
      });
    }
  }, [city, isEdit, setValue]);

  const onSubmit = (formData) => {
    const mutation = isEdit ? updateCity : createCity;
    const mutationData = isEdit ? { id: cityId, data: formData } : formData;

    mutation.mutate(mutationData, {
      onSuccess: () => {
        toast.success(
          `City ${isEdit ? "updated" : "created"} successfully!`
        );
        handleClose();
      },
    });
  };

  if (!open) return null;

  const isSubmitting = createCity.isLoading || updateCity.isLoading;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-96 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {isEdit ? "Edit City" : "Add City"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-white/70 mb-6">
          {isEdit ? "Update the City details" : "Lets create a City"}
        </p>

        {isEdit && isLoading ? (
          <LoadingState text="Loading City details..." />
        ) : isEdit && error ? (
          <ErrorMessage
            message={error?.message || "Failed to load City details"}
            onRetry={refetch}
            variant="card"
          />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              label="City"
              placeholder="Enter city name"
              error={errors.city?.message}
              {...register("city")}
            />

            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                onValueChange={(value) => setValue("language", value)}
                value={watch("language")}
              >
                <SelectTrigger whiteBg>
                  <SelectValue placeholder="Choose Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                </SelectContent>
              </Select>
              {errors.language && (
                <p className="text-red-500 text-sm">
                  {errors.language.message}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <Switch
                checked={watch("status")}
                onCheckedChange={(checked) => setValue("status", checked)}
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

export default CreateCity;
