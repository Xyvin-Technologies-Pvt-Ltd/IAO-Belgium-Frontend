import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { useCreateLanguage, useUpdateLanguage } from "@/store/useLanguageStore";

const EMAIL_CODES = [
  { value: "en", labelKey: "languageManagement.modal.codeOptions.en" },
  { value: "nl", labelKey: "languageManagement.modal.codeOptions.nl" },
  { value: "fr", labelKey: "languageManagement.modal.codeOptions.fr" },
  { value: "de", labelKey: "languageManagement.modal.codeOptions.de" },
];

const CreateLanguage = ({ open, onClose, languageData }) => {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      code: "",
    },
  });

  const selectedCode = watch("code");
  const isEdit = !!languageData;
  const createLanguage = useCreateLanguage();
  const updateLanguage = useUpdateLanguage();

  const handleClose = () => {
    reset({ name: "", code: "" });
    onClose();
  };

  useEffect(() => {
    if (open) {
      if (languageData && isEdit) {
        setValue("name", languageData.name || "");
        setValue("code", languageData.code || "");
      } else {
        reset({ name: "", code: "" });
      }
    }
  }, [languageData, isEdit, setValue, open, reset]);

  const onSubmit = (formData) => {
    const payload = {
      name: formData.name,
      ...(formData.code ? { code: formData.code } : { code: null }),
    };

    const mutation = isEdit ? updateLanguage : createLanguage;
    const mutationData = isEdit
      ? { id: languageData._id, data: payload }
      : payload;

    mutation.mutate(mutationData, {
      onSuccess: () => {
        handleClose();
      },
    });
  };

  if (!open) return null;

  const isSubmitting = createLanguage.isPending || updateLanguage.isPending;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-[26rem] p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEdit
                ? t("languageManagement.modal.editTitle")
                : t("languageManagement.modal.createTitle")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-white/70">
              {isEdit
                ? t("languageManagement.modal.editSubtitle")
                : t("languageManagement.modal.createSubtitle")}
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
            label={t("languageManagement.modal.nameLabel")}
            placeholder={t("languageManagement.modal.namePlaceholder")}
            error={errors.name?.message}
            required
            {...register("name", {
              required: t("languageManagement.modal.nameRequired"),
            })}
          />

          <FormField
            label={t("languageManagement.modal.codeLabel")}
            error={errors.code?.message}
            required
          >
            <Select
              key={selectedCode || "empty-code"}
              value={selectedCode || undefined}
              onValueChange={(value) =>
                setValue("code", value, { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("languageManagement.modal.codePlaceholder")}
                />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_CODES.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              type="hidden"
              {...register("code", {
                required: t("languageManagement.modal.codeRequired"),
              })}
            />
            <p className="text-xs text-gray-500 dark:text-white/60 mt-1">
              {t("languageManagement.modal.codeHelp")}
            </p>
          </FormField>

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

export default CreateLanguage;
