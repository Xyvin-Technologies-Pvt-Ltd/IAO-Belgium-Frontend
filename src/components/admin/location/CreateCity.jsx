import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
    formState: { errors },
  } = useForm({
    resolver: zodResolver(citySchema),
    defaultValues: {
      name: "",
      country: "",
    },
  });

  const isEdit = !!cityData;
  const createCity = useCreateCity();
  const updateCity = useUpdateCity();

  const selectedCountry = watch("country");

  const handleClose = () => {
    reset({
      name: "",
      country: "",
    });
    setSearchTerm("");
    onClose();
  };

  useEffect(() => {
    if (!open || !cityData) return;

    setValue("name", cityData.name || "");
    setValue("country", cityData.country?._id || "");
  }, [cityData, open, setValue]);

  const onSubmit = (formData) => {
    const payload = {
      name: formData.name,
      country: formData.country,
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
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-96 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {isEdit
            ? t("cityManagement.modal.editTitle")
            : t("cityManagement.modal.createTitle")}
        </h2>
        <p className="text-sm text-gray-500 dark:text-white/70 mb-6">
          {isEdit
            ? t("cityManagement.modal.editSubtitle")
            : t("cityManagement.modal.createSubtitle")}
        </p>

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
