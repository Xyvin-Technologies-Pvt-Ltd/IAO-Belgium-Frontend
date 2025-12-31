import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import { LoadingState, ErrorMessage } from "@/components/common";
import { useCreateLocation, useLocationById, useUpdateLocation } from "@/store/useLocation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { GetCountries } from "react-country-state-city";

const CreateLocation = ({ open, onClose, locationId }) => {
  const [countries, setCountries] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      country: "",
      city: "",
      language: "",
      status: true,
    },
  });

  const isEdit = !!locationId;
  const { data: location, isLoading, error, refetch } = useLocationById(locationId);
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  useEffect(() => {
    GetCountries().then((result) => {
      setCountries(result);
    });
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (location?.data && isEdit) {
      const locationData = location.data;
      Object.keys(locationData).forEach((key) => {
        setValue(key, locationData[key]);
      });
    }
  }, [location, isEdit, setValue]);

  const onSubmit = (formData) => {
    const mutation = isEdit ? updateLocation : createLocation;
    const mutationData = isEdit ? { id: locationId, data: formData } : formData;

    mutation.mutate(mutationData, {
      onSuccess: () => {
        toast.success(`Location ${isEdit ? "updated" : "created"} successfully!`);
        handleClose();
      },
    });
  };

  if (!open) return null;

  const isSubmitting = createLocation.isLoading || updateLocation.isLoading;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-xl shadow-lg w-96 p-6">
        <h2 className="text-2xl font-bold mb-2">
          {isEdit ? "Edit Location" : "Add Location"}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {isEdit ? "Update the location details" : "Lets create a Location"}
        </p>

        {isEdit && isLoading ? (
          <LoadingState text="Loading location details..." />
        ) : isEdit && error ? (
          <ErrorMessage
            message={error?.message || "Failed to load location details"}
            onRetry={refetch}
            variant="card"
          />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label>Country</Label>
              <Select
                onValueChange={(value) => setValue("country", value)}
                value={watch("country")}
              >
                <SelectTrigger whiteBg>
                  <SelectValue placeholder="Choose country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.iso2}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.country && (
                <p className="text-red-500 text-sm">{errors.country.message}</p>
              )}
            </div>

            <FormField
              label="City"
              placeholder="Enter city name"
              error={errors.city?.message}
              {...register("city")}
            />

            <div className="space-y-2">
              <Label>Language</Label>
              <Select onValueChange={(value) => setValue("language", value)} value={watch("language")}>
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
                <p className="text-red-500 text-sm">{errors.language.message}</p>
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

export default CreateLocation;
