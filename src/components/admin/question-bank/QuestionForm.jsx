import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddQuestion, useUpdateQuestion } from "@/store/useQuestionBankStore";
import { questionSchema } from "@/validations/admin/question.validation";

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

const QuestionForm = ({
  open,
  onClose,
  questionBankId,
  questionData,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const isEdit = !!questionData;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question_text: "",
      options: [
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
      ],
      explanation: "",
      difficulty: "medium",
      marks: 1,
    },
  });

  const options = watch("options") || [];
  const addQuestion = useAddQuestion();
  const updateQuestion = useUpdateQuestion();

  useEffect(() => {
    if (questionData) {
      reset({
        question_text: questionData.question_text || "",
        options:
          questionData.options?.map((o) => ({
            option_text: o.option_text || "",
            option_image: o.option_image || "",
            is_correct: o.is_correct || false,
          })) || [
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false },
        ],
        explanation: questionData.explanation || "",
        difficulty: questionData.difficulty || "medium",
        marks: questionData.marks ?? 1,
      });
    } else {
      reset({
        question_text: "",
        options: [
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false },
        ],
        explanation: "",
        difficulty: "medium",
        marks: 1,
      });
    }
  }, [questionData, reset, open]);

  const addOption = () => {
    if (options.length < 6) {
      setValue("options", [
        ...options,
        { option_text: "", option_image: "", is_correct: false },
      ]);
    }
  };

  const removeOption = (idx) => {
    if (options.length > 2) {
      const next = options.filter((_, i) => i !== idx);
      const hadCorrect = options[idx]?.is_correct;
      if (hadCorrect && next.length > 0) {
        next[0].is_correct = true;
      }
      setValue("options", next);
    }
  };

  const setCorrectOption = (idx) => {
    setValue(
      "options",
      options.map((o, i) => ({ ...o, is_correct: i === idx })),
      { shouldValidate: true },
    );
  };

  const onSubmit = async (values) => {
    try {
      if (isEdit) {
        await updateQuestion.mutateAsync({
          questionBankId,
          questionId: questionData._id,
          data: values,
        });
      } else {
        await addQuestion.mutateAsync({
          questionBankId,
          data: values,
        });
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
            {isEdit
              ? t("questionBank.questionForm.editQuestion")
              : t("questionBank.questionForm.addQuestion")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label={t("questionBank.questionForm.questionText")}
            error={errors.question_text?.message}
            required
          >
            <textarea
              {...register("question_text")}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder={t("questionBank.questionForm.questionTextPlaceholder")}
            />
          </FormField>

          <div className="space-y-2">
            <Label>{t("questionBank.questionForm.options")} *</Label>
            {options.map((_, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <span className="w-6 font-medium">{OPTION_LABELS[idx]}</span>
                <input
                  {...register(`options.${idx}.option_text`)}
                  className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder={`Option ${OPTION_LABELS[idx]}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCorrectOption(idx)}
                  className={
                    options[idx]?.is_correct
                      ? "border-green-500 bg-green-50 dark:bg-green-950"
                      : ""
                  }
                >
                  {t("questionBank.questionForm.correct")}
                </Button>
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {errors.options?.message && (
              <p className="text-sm text-destructive">
                {errors.options.message}
              </p>
            )}
            {options.length < 6 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t("questionBank.questionForm.addOption")}
              </Button>
            )}
          </div>

          <FormField
            label={t("questionBank.questionForm.explanation")}
            error={errors.explanation?.message}
          >
            <textarea
              {...register("explanation")}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder={t("questionBank.questionForm.explanationPlaceholder")}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label={t("questionBank.questionForm.difficulty")}
              error={errors.difficulty?.message}
            >
              <Select
                value={watch("difficulty")}
                onValueChange={(v) => setValue("difficulty", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">
                    {t("questionBank.questionForm.easy")}
                  </SelectItem>
                  <SelectItem value="medium">
                    {t("questionBank.questionForm.medium")}
                  </SelectItem>
                  <SelectItem value="hard">
                    {t("questionBank.questionForm.hard")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField
              label={t("questionBank.questionForm.marks")}
              error={errors.marks?.message}
            >
              <input
                {...register("marks", { valueAsNumber: true })}
                type="number"
                min={0}
                step={0.5}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </FormField>
          </div>

          <FormActions
            onCancel={onClose}
            submitLabel={isEdit ? t("common.update") : t("common.add")}
            isLoading={addQuestion.isPending || updateQuestion.isPending}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionForm;
