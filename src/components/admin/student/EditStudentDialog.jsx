import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import { getCountriesCached } from "@/utils/countriesCache";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateStudent } from "@/store/useStudentStore";

const editStudentSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  address: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
});

const EditStudentDialog = ({ open, onClose, studentData }) => {
  const { t } = useTranslation();
  const [countries, setCountries] = useState([]);
  const updateStudentMutation = useUpdateStudent();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getCountriesCached().then((result) => {
      if (!cancelled) setCountries(result);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(editStudentSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      address: "",
      postal_code: "",
      country: "",
      city: "",
    },
  });

  useEffect(() => {
    if (!open || !studentData) return;

    reset({
      first_name: studentData.first_name || "",
      last_name: studentData.last_name || "",
      email: studentData.email || "",
      address: studentData.address || "",
      postal_code: studentData.postal_code || "",
      country: studentData.country || "",
      city: studentData.city || "",
    });
  }, [open, studentData, reset]);

  const onSubmit = (formData) => {
    if (!studentData?._id) return;

    const payload = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim(),
      address: formData.address ? formData.address.trim() : "",
      postal_code: formData.postal_code ? formData.postal_code.trim() : "",
      country: formData.country || "",
      city: formData.city ? formData.city.trim() : "",
    };

    updateStudentMutation.mutate(
      { id: studentData._id, data: payload },
      {
        onSuccess: (res) => {
          toast.success(res?.message || t("studentManagement.messages.updateSuccess", "Student updated successfully!"));
          onClose();
        },
        onError: (err) => {
          toast.error(err?.message || t("studentManagement.messages.updateFailed", "Failed to update student"));
        },
      }
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white dark:bg-black border dark:border-white/20 shadow-lg max-h-[90vh] flex flex-col">
        <div className="p-6 border-b dark:border-white/20">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("studentManagement.modal.editTitle", "Edit Student Details")}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground dark:text-white/70 hover:text-gray-700 dark:hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label={t("studentManagement.modal.firstNameLabel", "First Name")}
                placeholder={t("studentManagement.modal.firstNamePlaceholder", "Enter first name")}
                {...register("first_name")}
                error={errors.first_name?.message}
                required
              />
              <FormField
                label={t("studentManagement.modal.lastNameLabel", "Last Name")}
                placeholder={t("studentManagement.modal.lastNamePlaceholder", "Enter last name")}
                {...register("last_name")}
                error={errors.last_name?.message}
                required
              />
            </div>

            <FormField
              label={t("studentManagement.modal.emailLabel", "Email")}
              placeholder={t("studentManagement.modal.emailPlaceholder", "Enter email address")}
              type="email"
              {...register("email")}
              error={errors.email?.message}
              required
            />

            <FormField
              label={t("studentManagement.modal.addressLabel", "Address")}
              placeholder={t("studentManagement.modal.addressPlaceholder", "Enter street address")}
              {...register("address")}
              error={errors.address?.message}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label={t("studentManagement.modal.postalCodeLabel", "Postal Code / Pincode")}
                placeholder={t("studentManagement.modal.postalCodePlaceholder", "Enter postal code")}
                {...register("postal_code")}
                error={errors.postal_code?.message}
              />
              <FormField
                label={t("studentManagement.modal.countryLabel", "Country")}
                error={errors.country?.message}
              >
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <Select
                      key={`${field.value}-${countries.length}`}
                      onValueChange={(val) => field.onChange(val)}
                      value={field.value || ""}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("studentManagement.modal.countryPlaceholder", "Select country")} />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.id} value={country.name}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </div>

            <FormField
              label={t("studentManagement.modal.cityLabel", "City")}
              placeholder={t("studentManagement.modal.cityPlaceholder", "Enter city")}
              {...register("city")}
              error={errors.city?.message}
            />

            <FormActions
              onCancel={onClose}
              isLoading={updateStudentMutation.isPending}
              isEdit={true}
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditStudentDialog;
