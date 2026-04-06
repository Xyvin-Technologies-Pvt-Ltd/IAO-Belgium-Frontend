import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
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
import { useCreateCountry, useUpdateCountry } from "@/store/useCountryStore";
import { countrySchema } from "@/validations/admin";
import { useTranslation } from "react-i18next";

const CURRENCIES = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "INR", name: "Indian Rupee" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "DKK", name: "Danish Krone" },
];

const CreateCountry = ({ open, onClose, countryData }) => {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(countrySchema),
    defaultValues: {
      code: "",
      name: "",
      currency: "",
    },
  });

  const isEdit = !!countryData;
  const createCountry = useCreateCountry();
  const updateCountry = useUpdateCountry();

  const selectedCurrency = watch("currency");

  const handleClose = () => {
    reset({
      code: "",
      name: "",
      currency: "",
    });
    onClose();
  };

  useEffect(() => {
    if (countryData && isEdit && open) {
      reset({
        code: countryData.code || "",
        name: countryData.name || "",
        currency: countryData.currency || "",
      });
    }
  }, [countryData, isEdit, reset, open]);

  const onSubmit = (formData) => {
    const payload = {
      code: formData.code.toUpperCase(), // Ensure uppercase
      name: formData.name,
      currency: formData.currency,
    };

    if (isEdit) {
      updateCountry.mutate(
        { id: countryData._id, data: payload },
        {
          onSuccess: () => {
            handleClose();
          },
        }
      );
    } else {
      createCountry.mutate(payload, {
        onSuccess: () => {
          handleClose();
        },
      });
    }
  };

  if (!open) return null;

  const isSubmitting = createCountry.isPending || updateCountry.isPending;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-96 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEdit ? t("countryManagement.modal.editTitle") : t("countryManagement.modal.createTitle")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-white/70">
              {isEdit ? t("countryManagement.modal.editSubtitle") : t("countryManagement.modal.createSubtitle")}
            </p>
          </div>
          <button 
            onClick={handleClose}
            className="text-muted-foreground dark:text-white/70 hover:text-gray-700 dark:hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              label={t("countryManagement.modal.codeLabel")}
              placeholder={t("countryManagement.modal.codePlaceholder")}
              error={errors.code?.message}
              required
              {...register("code", { 
                onChange: (e) => {
                  // Convert to uppercase as user types
                  e.target.value = e.target.value.toUpperCase();
                }
              })}
            />

            <FormField
              label={t("countryManagement.modal.nameLabel")}
              placeholder={t("countryManagement.modal.namePlaceholder")}
              error={errors.name?.message}
              required
              {...register("name")}
            />

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 dark:text-white">
                {t("countryManagement.modal.currencyLabel")} <span className="text-red-500">*</span>
              </Label>
              <Select
                key={selectedCurrency || 'empty'}
                value={selectedCurrency || ""}
                onValueChange={(value) => setValue("currency", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("countryManagement.modal.currencyPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} - {t(`currencies.${currency.code}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.currency && (
                <p className="text-sm text-red-500">{errors.currency.message}</p>
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

export default CreateCountry;
