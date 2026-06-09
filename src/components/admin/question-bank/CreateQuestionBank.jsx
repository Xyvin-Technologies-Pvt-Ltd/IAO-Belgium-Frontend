import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateQuestionBank, useUpdateQuestionBank } from "@/store/useQuestionBankStore";
import { useGetAllLanguages } from "@/store/useDropdownStore";
import { questionBankSchema } from "@/validations/admin/questionBank.validation";

const CreateQuestionBank = ({ open, onClose, bankData, onSuccess }) => {
  const { t } = useTranslation();
  const isEdit = !!bankData;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(questionBankSchema),
    defaultValues: {
      name: "",
      description: "",
      lang: "",
    },
  });

  const { data: languagesData } = useGetAllLanguages({ status: true });
  const languages = languagesData?.data || [];

  const createBank = useCreateQuestionBank();
  const updateBank = useUpdateQuestionBank();

  useEffect(() => {
    if (bankData) {
      reset({
        name: bankData.name || "",
        description: bankData.description || "",
        lang: bankData.lang?._id || bankData.lang || "",
      });
    } else {
      reset({
        name: "",
        description: "",
        lang: "",
      });
    }
  }, [bankData, reset, open]);

  const onSubmit = async (values) => {
    try {
      if (isEdit) {
        await updateBank.mutateAsync({
          id: bankData._id,
          data: values,
        });
      } else {
        await createBank.mutateAsync(values);
      }
      onSuccess?.();
    } catch (err) {
      // Error handled by store
    }
  };

  const handleClose = () => {
    reset({
      name: "",
      description: "",
      lang: "",
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t("questionBank.editQuestionBank")
              : t("questionBank.createQuestionBank")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label={t("questionBank.form.name")}
            error={errors.name?.message}
            required
          >
            <input
              {...register("name")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder={t("questionBank.form.namePlaceholder")}
            />
          </FormField>
          <FormField
            label={t("questionBank.form.description")}
            error={errors.description?.message}
          >
            <textarea
              {...register("description")}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder={t("questionBank.form.descriptionPlaceholder")}
            />
          </FormField>
          <FormField
            label={t("questionBank.form.language") || "Language"}
            error={errors.lang?.message}
            required
          >
            <Select
              key={`lang-${watch("lang")}`}
              value={watch("lang") || ""}
              onValueChange={(v) => setValue("lang", v, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang._id} value={lang._id}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormActions
            onCancel={handleClose}
            submitLabel={isEdit ? t("common.update") : t("common.create")}
            isLoading={createBank.isPending || updateBank.isPending}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateQuestionBank;
