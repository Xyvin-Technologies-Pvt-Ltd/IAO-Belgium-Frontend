import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import FormActions from "@/components/ui/forms/FormActions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import QuestionSourceSelector from "./QuestionSourceSelector";
import { useCreateExam, useUpdateExam } from "@/store/useExamStore";
import { useGetAllLanguages } from "@/store/useDropdownStore";
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
      language: "",
      question_sources: [],
      passing_marks: 0,
      passing_percentage: 0,
      passing_type: "percentage",
      duration: 60,
    },
  });

  const { data: languagesData } = useGetAllLanguages({ status: true });
  const languages = languagesData?.data || [];

  const questionSources = watch("question_sources") || [];
  const createExam = useCreateExam();
  const updateExam = useUpdateExam();

  const handleClose = () => {
    reset({
      name: "",
      description: "",
      instructions: "",
      language: "",
      question_sources: [],
      passing_marks: 0,
      passing_percentage: 0,
      passing_type: "percentage",
      duration: 60,
    });
    onClose();
  };

  useEffect(() => {
    if (examData && open) {
      reset({
        name: examData.name || "",
        description: examData.description || "",
        instructions: examData.instructions || "",
        language: examData.language?._id || examData.language || "",
        question_sources:
          examData.question_sources?.map((s) => ({
            question_bank:
              typeof s.question_bank === "object"
                ? s.question_bank._id
                : s.question_bank,
            count: s.count || 1,
          })) || [],
        passing_marks: examData.passing_marks ?? 0,
        passing_percentage: examData.passing_percentage ?? 0,
        passing_type: examData.passing_type || "percentage",
        duration: examData.duration ?? 60,
      });
    } else if (!examData && open) {
      reset({
        name: "",
        description: "",
        instructions: "",
        language: "",
        question_sources: [],
        passing_marks: 0,
        passing_percentage: 0,
        passing_type: "percentage",
        duration: 60,
      });
    }
  }, [examData, reset, open]);

  const onSubmit = (values) => {
    const finalValues = { ...values };
    if (values.passing_type === "percentage") {
      delete finalValues.passing_marks;
    } else {
      delete finalValues.passing_percentage;
    }

    const mutation = isEdit ? updateExam : createExam;
    const mutationData = isEdit
      ? { id: examData._id, data: finalValues }
      : finalValues;

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
                  ? t("exam.editSubtitle")
                  : t("exam.createSubtitle")}
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

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 dark:text-white">
                {t("exam.form.language") || "Language"} <span className="text-red-500">*</span>
              </Label>
              <Select
                key={`language-${watch("language")}`}
                value={watch("language") || ""}
                onValueChange={(v) => {
                  setValue("language", v, { shouldValidate: true });
                  // Reset question sources when language changes to prevent invalid mixing
                  setValue("question_sources", []);
                }}
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
              {errors.language && (
                <p className="text-sm text-red-500">{errors.language.message}</p>
              )}
            </div>

            <QuestionSourceSelector
              value={questionSources}
              onChange={(v) => setValue("question_sources", v)}
              error={errors.question_sources?.message}
              selectedLanguage={watch("language")}
            />

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 dark:text-white">
                {t("exam.form.duration")} <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("duration", { valueAsNumber: true })}
                type="number"
                min={1}
              />
              {errors.duration && (
                <p className="text-sm text-red-500">
                  {errors.duration.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {watch("passing_type") === "marks" ? (
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
              ) : (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900 dark:text-white">
                    {t("exam.form.passingPercentage", "Passing Percentage")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("passing_percentage", { valueAsNumber: true })}
                    type="number"
                    min={0}
                    max={100}
                  />
                  {errors.passing_percentage && (
                    <p className="text-sm text-red-500">
                      {errors.passing_percentage.message}
                    </p>
                  )}
                </div>
              )}
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
