import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import { useCreateCity, useUpdateCity } from "@/store/useCityStore";
import { useGetCountries } from "@/store/useCountryStore";
import { citySchema } from "@/validations/admin";
import { useTranslation } from "react-i18next";
import PaginatedSelect from "@/components/ui/forms/PaginatedSelect";

const CreateCity = ({ open, onClose, cityData }) => {
  const { t } = useTranslation();
  const [countryPage, setCountryPage] = useState(1);
  const countryLimit = 10;

  // Cache for storing all loaded data
  const [allCountries, setAllCountries] = useState([]);

  const { data: countriesData } = useGetCountries(
    {
      page: countryPage,
      limit: countryLimit,
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

  // Cache management effect
  useEffect(() => {
    if (countriesData?.data) {
      setAllCountries((prev) => {
        const newCountries = countriesData.data;
        const existingIds = prev.map((c) => c._id);
        const uniqueNewCountries = newCountries.filter(
          (c) => !existingIds.includes(c._id),
        );
        return [...prev, ...uniqueNewCountries];
      });
    }
  }, [countriesData?.data]);

  // Reset pagination when modal opens
  useEffect(() => {
    if (open) {
      setCountryPage(1);
    }
  }, [open]);

  const handleClose = () => {
    reset({
      name: "",
      country: "",
    });
    setCountryPage(1);
    setAllCountries([]);
    onClose();
  };

  useEffect(() => {
    if (!open || !cityData) return;

    // Handle country data for edit mode
    if (cityData.country && cityData.country.name) {
      setAllCountries((prev) => {
        const exists = prev.some((c) => c._id === cityData.country._id);
        if (!exists) {
          return [...prev, cityData.country];
        }
        return prev;
      });
    }

    setValue('name', cityData.name || '');
    setValue('country', cityData.country?._id || '');
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

  const countries = allCountries.length > 0 ? allCountries : countriesData?.data || [];
  const totalCountries = countriesData?.total_count || 0;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-96 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {isEdit ? t("cityManagement.modal.editTitle") : t("cityManagement.modal.createTitle")}
        </h2>
        <p className="text-sm text-gray-500 dark:text-white/70 mb-6">
          {isEdit ? t("cityManagement.modal.editSubtitle") : t("cityManagement.modal.createSubtitle")}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              label={t("cityManagement.modal.nameLabel")}
              placeholder={t("cityManagement.modal.namePlaceholder")}
              error={errors.name?.message}
              required
              {...register("name")}
            />

            <PaginatedSelect
              label={t("cityManagement.modal.countryLabel")}
              placeholder={t("cityManagement.modal.countryPlaceholder")}
              items={countries}
              value={selectedCountry || ""}
              onChange={(value) => setValue("country", value, { shouldValidate: true })}
              page={countryPage}
              setPage={setCountryPage}
              total={totalCountries}
              limit={countryLimit}
              error={errors.country?.message}
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