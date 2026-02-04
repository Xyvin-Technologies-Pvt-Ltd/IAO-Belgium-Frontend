import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Plus, Trash2 } from "lucide-react";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import { useCreateCity, useUpdateCity } from "@/store/useCityStore";
import { citySchema } from "@/validations/admin";
import { useTranslation } from "react-i18next";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import { useGetAllCountries } from "@/store/useDropdownStore";

const CreateCity = ({ open, onClose, cityData }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: countriesData, isLoading: countriesLoading } =
    useGetAllCountries(
      { 
        ...(searchTerm && { search: searchTerm })
      },
      { enabled: open }
    );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(citySchema),
    defaultValues: {
      name: "",
      country: "",
      times: [{ start: "", end: "" }],
      venue: [""],
    },
  });

  const { fields: timeFields, append: appendTime, remove: removeTime } = useFieldArray({
    control,
    name: "times",
  });

  const { fields: venueFields, append: appendVenue, remove: removeVenue } = useFieldArray({
    control,
    name: "venue",
  });

  const isEdit = !!cityData;
  const createCity = useCreateCity();
  const updateCity = useUpdateCity();

  const selectedCountry = watch("country");

  const handleClose = () => {
    reset({
      name: "",
      country: "",
      times: [{ start: "", end: "" }],
      venue: [""],
    });
    setSearchTerm("");
    onClose();
  };

  useEffect(() => {
    if (!open || !cityData) return;

    setValue("name", cityData.name || "");
    setValue("country", cityData.country?._id || "");
    
    const times = cityData.times?.length > 0 
      ? cityData.times.map(time => ({
          start: time.start || time.start || "",
          end: time.end || time.end || "",
        }))
      : [{ start: "", end: "" }];
    
    reset({
      name: cityData.name || "",
      country: cityData.country?._id || "",
      times: times,
      venue: cityData.venue?.length > 0 ? cityData.venue : [""],
    });
  }, [cityData, open, reset]);

  const onSubmit = (formData) => {
    const payload = {
      name: formData.name,
      country: formData.country,
      times: formData.times.filter(time => time.start && time.end),
      venue: formData.venue.filter(v => v.trim() !== ""),
    };

    const mutation = isEdit ? updateCity : createCity;
    const mutationData = isEdit ? { id: cityData._id, data: payload } : payload;

    mutation.mutate(mutationData, {
      onSuccess: () => {
        handleClose();
      },
    });
  };

  if (!open) return null;

  const isSubmitting = createCity.isPending || updateCity.isPending;
  const countries = countriesData?.data || [];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-[600px] max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEdit
                ? t("cityManagement.modal.editTitle")
                : t("cityManagement.modal.createTitle")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-white/70">
              {isEdit
                ? t("cityManagement.modal.editSubtitle")
                : t("cityManagement.modal.createSubtitle")}
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
            label={t("cityManagement.modal.nameLabel")}
            placeholder={t("cityManagement.modal.namePlaceholder")}
            error={errors.name?.message}
            required
            {...register("name")}
          />

          <SearchableSelect
            label={t("cityManagement.modal.countryLabel")}
            placeholder={t("cityManagement.modal.countryPlaceholder")}
            searchPlaceholder="Search countries..."
            items={countries}
            value={selectedCountry || ""}
            onChange={(value) =>
              setValue("country", value, { shouldValidate: true })
            }
            onSearch={setSearchTerm}
            error={errors.country?.message}
            isLoading={countriesLoading}
            required
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-white">
                {t("cityManagement.modal.timeSlotsLabel")} <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => appendTime({ start: "", end: "" })}
                className="flex items-center justify-center w-8 h-8 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            {timeFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <FormField
                    label={t("cityManagement.modal.startTimeLabel")}
                    type="time"
                    placeholder="09:00"
                    error={errors.times?.[index]?.start?.message}
                    {...register(`times.${index}.start`)}
                  />
                  <FormField
                    label={t("cityManagement.modal.endTimeLabel")}
                    type="time"
                    placeholder="17:00"
                    error={errors.times?.[index]?.end?.message}
                    {...register(`times.${index}.end`)}
                  />
                </div>
                {timeFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTime(index)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {errors.times?.message && (
              <p className="text-sm text-red-500">{errors.times.message}</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-white">
                {t("cityManagement.modal.venuesLabel")} <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => appendVenue("")}
                className="flex items-center justify-center w-8 h-8 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            {venueFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <FormField
                    placeholder={`${t("cityManagement.modal.venueLabel")} ${index + 1}`}
                    error={errors.venue?.[index]?.message}
                    {...register(`venue.${index}`)}
                  />
                </div>
                {venueFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVenue(index)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {errors.venue?.message && (
              <p className="text-sm text-red-500">{errors.venue.message}</p>
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

export default CreateCity;
