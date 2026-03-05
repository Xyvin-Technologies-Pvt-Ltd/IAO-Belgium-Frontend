import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import FormActions from "@/components/ui/forms/FormActions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

  const handleClose = () => {
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
    onClose();
  };

  useEffect(() => {
    if (examData && open) {
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
    } else if (!examData && open) {
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

  const onSubmit = (values) => {
    const mutation = isEdit ? updateExam : createExam;
    const mutationData = isEdit
      ? { id: examData._id, data: values }
      : values;

    mutation.mutate(mutationData, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  if (!open) return null;

  const isSubmitting = createExam.isPending || updateExam.isPending;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b dark:border-white/20">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEdit ? t("exam.editExam") : t("exam.createExam")}
              </h2>
              <p className="text-sm text-gray-500 dark:text-white/70">
                {isEdit
                  ? t("exam.editSubtitle", "Update the exam details")
                  : t("exam.createSubtitle", "Fill in the exam details")}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-muted-foreground dark:text-white/70 hover:text-gray-700 dark:hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 dark:text-white">
                {t("exam.form.name")} <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("name")}
                placeholder={t("exam.form.namePlaceholder")}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 dark:text-white">
                {t("exam.form.description")}
              </Label>
              <Textarea
                {...register("description")}
                className="min-h-[60px]"
                placeholder={t("exam.form.descriptionPlaceholder")}
              />
              {errors.description && (
                <p className="text-sm text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 dark:text-white">
                {t("exam.form.instructions")}
              </Label>
              <Textarea
                {...register("instructions")}
                className="min-h-[80px]"
                placeholder={t("exam.form.instructionsPlaceholder")}
              />
              {errors.instructions && (
                <p className="text-sm text-red-500">
                  {errors.instructions.message}
                </p>
              )}
            </div>

            <QuestionSourceSelector
              value={questionSources}
              onChange={(v) => setValue("question_sources", v)}
              error={errors.question_sources?.message}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("exam.form.duration")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("duration", { valueAsNumber: true })}
                  type="number"
                  min={1}
                  placeholder="60"
                />
                {errors.duration && (
                  <p className="text-sm text-red-500">
                    {errors.duration.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("exam.form.marksPerQuestion")}
                </Label>
                <Input
                  {...register("marks_per_question", { valueAsNumber: true })}
                  type="number"
                  min={0}
                  step={0.5}
                />
                {errors.marks_per_question && (
                  <p className="text-sm text-red-500">
                    {errors.marks_per_question.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("exam.form.passingMarks")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("passing_marks", { valueAsNumber: true })}
                  type="number"
                  min={0}
                />
                {errors.passing_marks && (
                  <p className="text-sm text-red-500">
                    {errors.passing_marks.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("exam.form.passingType")}
                </Label>
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
                {errors.passing_type && (
                  <p className="text-sm text-red-500">
                    {errors.passing_type.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t dark:border-white/20">
              <Label className="text-base font-semibold text-gray-900 dark:text-white">
                {t("exam.form.settings")}
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 ">
                  <span className="text-sm text-gray-900 dark:text-white">
                    {t("exam.form.randomizeQuestions")}
                  </span>
                  <Switch
                    checked={settings.randomize_questions}
                    onCheckedChange={(v) =>
                      setValue("settings.randomize_questions", v)
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 ">
                  <span className="text-sm text-gray-900 dark:text-white">
                    {t("exam.form.randomizeOptions")}
                  </span>
                  <Switch
                    checked={settings.randomize_options}
                    onCheckedChange={(v) =>
                      setValue("settings.randomize_options", v)
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3">
                  <span className="text-sm text-gray-900 dark:text-white">
                    {t("exam.form.autoSubmitOnTimeout")}
                  </span>
                  <Switch
                    checked={settings.auto_submit_on_timeout}
                    onCheckedChange={(v) =>
                      setValue("settings.auto_submit_on_timeout", v)
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3">
                  <span className="text-sm text-gray-900 dark:text-white">
                    {t("exam.form.maxAttempts")}
                  </span>
                  <Input
                    {...register("settings.max_attempts", {
                      valueAsNumber: true,
                    })}
                    type="number"
                    min={1}
                    className="w-20 h-9"
                  />
                </div>
              </div>
            </div>

            <FormActions
              onCancel={handleClose}
              isLoading={isSubmitting}
              isEdit={isEdit}
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExamForm;
