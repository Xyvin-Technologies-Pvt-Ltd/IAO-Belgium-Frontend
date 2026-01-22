import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateCity, useUpdateCity } from "@/store/useCityStore";
import { useGetCountries } from "@/store/useCountryStore";
import { citySchema } from "@/validations/admin";
import { useTranslation } from "react-i18next";

const CreateCity = ({ open, onClose, cityData }) => {
  const { t } = useTranslation();
  const [countryPage, setCountryPage] = useState(1);
  const countryLimit = 10;

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
    onClose();
  };

  useEffect(() => {
    if (cityData && isEdit && open) {
      setValue('name', cityData.name || '');
      setValue('country', cityData.country?._id || '');
    }
  }, [cityData, isEdit, setValue, open]);

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
  const totalCountries = countriesData?.total_count || 0;
  const totalCountryPages = Math.ceil(totalCountries / countryLimit);
  const hasCountryPrev = countryPage > 1;
  const hasCountryNext = countryPage < totalCountryPages;

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

            <div className="space-y-2">
              <Label>{t("cityManagement.modal.countryLabel")} <span className="text-red-500">*</span></Label>
              <Select
                key={selectedCountry || 'empty'}
                value={selectedCountry || ""}
                onValueChange={(value) => setValue("country", value, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("cityManagement.modal.countryPlaceholder")} />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  sideOffset={4}
                  className="w-[var(--radix-select-trigger-width)]"
                >
                  <div className="max-h-[300px] overflow-y-auto">
                    {countries?.map((country) => (
                      <SelectItem key={country._id} value={country._id}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </div>
                  {totalCountries > countryLimit && (
                    <div className="flex items-center justify-center gap-2 px-2 py-2 border-t bg-background sticky bottom-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          setCountryPage((prev) => Math.max(1, prev - 1));
                        }}
                        disabled={!hasCountryPrev}
                        className="h-8 w-8"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          setCountryPage((prev) => prev + 1);
                        }}
                        disabled={!hasCountryNext}
                        className="h-8 w-8"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </SelectContent>
              </Select>
              {errors.country && (
                <p className="text-red-500 text-sm">
                  {errors.country.message}
                </p>
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
