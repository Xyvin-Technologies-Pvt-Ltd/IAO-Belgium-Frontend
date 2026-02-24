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
import { useCreateQuestionBank, useUpdateQuestionBank } from "@/store/useQuestionBankStore";
import { questionBankSchema } from "@/validations/admin/questionBank.validation";

const CreateQuestionBank = ({ open, onClose, bankData, onSuccess }) => {
  const { t } = useTranslation();
  const isEdit = !!bankData;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(questionBankSchema),
    defaultValues: {
      name: "",
      description: "",
      tags: [],
    },
  });

  const createBank = useCreateQuestionBank();
  const updateBank = useUpdateQuestionBank();

  useEffect(() => {
    if (bankData) {
      reset({
        name: bankData.name || "",
        description: bankData.description || "",
        tags: bankData.tags || [],
      });
    } else {
      reset({
        name: "",
        description: "",
        tags: [],
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
          <FormActions
            onCancel={onClose}
            submitLabel={isEdit ? t("common.update") : t("common.create")}
            isLoading={createBank.isPending || updateBank.isPending}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateQuestionBank;
