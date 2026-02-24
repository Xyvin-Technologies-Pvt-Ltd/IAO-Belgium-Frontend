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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import QuestionSourceSelector from "./QuestionSourceSelector";
import { useCreateExam, useUpdateExam } from "@/store/useExamStore";
import { examSchema } from "@/validations/admin/exam.validation";

const ExamForm = ({ open, onClose, examData, onSuccess }) => {
  const { t } = useTranslation();
  const isEdit = !!examData;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(examSchema),
    defaultValues: {
      name: "",
      description: "",
      instructions: "",
      question_sources: [],
      marks_per_question: 1,
      negative_marks_per_question: 0,
      passing_marks: 0,
      passing_type: "percentage",
      duration: 60,
      settings: {
        randomize_questions: true,
        randomize_options: true,
        show_result_immediately: false,
        show_correct_answers: false,
        allow_review: false,
        max_attempts: 1,
        auto_submit_on_timeout: true,
        question_navigation: "free",
      },
    },
  });

  const questionSources = watch("question_sources") || [];
  const settings = watch("settings") || {};
  const createExam = useCreateExam();
  const updateExam = useUpdateExam();

  useEffect(() => {
    if (examData) {
      reset({
        name: examData.name || "",
        description: examData.description || "",
        instructions: examData.instructions || "",
        question_sources:
          examData.question_sources?.map((s) => ({
            question_bank:
              typeof s.question_bank === "object"
                ? s.question_bank._id
                : s.question_bank,
            count: s.count || 1,
          })) || [],
        marks_per_question: examData.marks_per_question ?? 1,
        negative_marks_per_question: examData.negative_marks_per_question ?? 0,
        passing_marks: examData.passing_marks ?? 0,
        passing_type: examData.passing_type || "percentage",
        duration: examData.duration ?? 60,
        settings: {
          ...examData.settings,
          randomize_questions: examData.settings?.randomize_questions ?? true,
          randomize_options: examData.settings?.randomize_options ?? true,
          show_result_immediately:
            examData.settings?.show_result_immediately ?? false,
          show_correct_answers: examData.settings?.show_correct_answers ?? false,
          allow_review: examData.settings?.allow_review ?? false,
          max_attempts: examData.settings?.max_attempts ?? 1,
          auto_submit_on_timeout:
            examData.settings?.auto_submit_on_timeout ?? true,
          question_navigation:
            examData.settings?.question_navigation || "free",
        },
      });
    } else {
      reset({
        name: "",
        description: "",
        instructions: "",
        question_sources: [],
        marks_per_question: 1,
        negative_marks_per_question: 0,
        passing_marks: 0,
        passing_type: "percentage",
        duration: 60,
        settings: {
          randomize_questions: true,
          randomize_options: true,
          show_result_immediately: false,
          show_correct_answers: false,
          allow_review: false,
          max_attempts: 1,
          auto_submit_on_timeout: true,
          question_navigation: "free",
        },
      });
    }
  }, [examData, reset, open]);

  const onSubmit = async (values) => {
    try {
      if (isEdit) {
        await updateExam.mutateAsync({
          id: examData._id,
          data: values,
        });
      } else {
        await createExam.mutateAsync(values);
      }
      onSuccess?.();
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("exam.editExam") : t("exam.createExam")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label={t("exam.form.name")}
            error={errors.name?.message}
            required
          >
            <input
              {...register("name")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder={t("exam.form.namePlaceholder")}
            />
          </FormField>
          <FormField
            label={t("exam.form.description")}
            error={errors.description?.message}
          >
            <textarea
              {...register("description")}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder={t("exam.form.descriptionPlaceholder")}
            />
          </FormField>
          <FormField
            label={t("exam.form.instructions")}
            error={errors.instructions?.message}
          >
            <textarea
              {...register("instructions")}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder={t("exam.form.instructionsPlaceholder")}
            />
          </FormField>

          <QuestionSourceSelector
            value={questionSources}
            onChange={(v) => setValue("question_sources", v)}
            error={errors.question_sources?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label={t("exam.form.duration")}
              error={errors.duration?.message}
              required
            >
              <input
                {...register("duration", { valueAsNumber: true })}
                type="number"
                min={1}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="60"
              />
            </FormField>
            <FormField
              label={t("exam.form.marksPerQuestion")}
              error={errors.marks_per_question?.message}
            >
              <input
                {...register("marks_per_question", { valueAsNumber: true })}
                type="number"
                min={0}
                step={0.5}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label={t("exam.form.passingMarks")}
              error={errors.passing_marks?.message}
              required
            >
              <input
                {...register("passing_marks", { valueAsNumber: true })}
                type="number"
                min={0}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </FormField>
            <FormField
              label={t("exam.form.passingType")}
              error={errors.passing_type?.message}
            >
              <Select
                value={watch("passing_type")}
                onValueChange={(v) => setValue("passing_type", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marks">{t("exam.form.marks")}</SelectItem>
                  <SelectItem value="percentage">
                    {t("exam.form.percentage")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="space-y-3 pt-2 border-t">
            <Label>{t("exam.form.settings")}</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">{t("exam.form.randomizeQuestions")}</span>
                <Switch
                  checked={settings.randomize_questions}
                  onCheckedChange={(v) =>
                    setValue("settings.randomize_questions", v)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{t("exam.form.randomizeOptions")}</span>
                <Switch
                  checked={settings.randomize_options}
                  onCheckedChange={(v) =>
                    setValue("settings.randomize_options", v)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{t("exam.form.autoSubmitOnTimeout")}</span>
                <Switch
                  checked={settings.auto_submit_on_timeout}
                  onCheckedChange={(v) =>
                    setValue("settings.auto_submit_on_timeout", v)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{t("exam.form.maxAttempts")}</span>
                <input
                  {...register("settings.max_attempts", { valueAsNumber: true })}
                  type="number"
                  min={1}
                  className="flex h-9 w-20 rounded-md border border-input bg-background px-2 text-sm"
                />
              </div>
            </div>
          </div>

          <FormActions
            onCancel={onClose}
            submitLabel={isEdit ? t("common.update") : t("common.create")}
            isLoading={createExam.isPending || updateExam.isPending}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExamForm;
