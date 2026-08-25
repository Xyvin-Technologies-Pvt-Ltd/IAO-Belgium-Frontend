import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { useTranslation } from "react-i18next";
import {
  useGetPracticalExamFeedback,
  useUpsertPracticalExamFeedback,
} from "@/store/useExamStore";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";

const PracticalFeedbackDialog = ({ open, onClose, plannedId, student }) => {
  const { t } = useTranslation();
  const applicationId = student?._id;
  const { data, isLoading, error, refetch } = useGetPracticalExamFeedback(
    plannedId,
    applicationId,
    { enabled: open && !!plannedId && !!applicationId },
  );
  const saveMutation = useUpsertPracticalExamFeedback();
  const [answers, setAnswers] = useState({});

  const fields = data?.data?.feedback_fields || [];
  const saved = data?.data?.feedback;
  const others = data?.data?.other_teachers || [];

  useEffect(() => {
    if (!open || !data?.data) return;
    const next = {};
    for (const field of data.data.feedback_fields || []) {
      const found = data.data.feedback?.answers?.find((a) => a.field_key === field.key);
      next[field.key] = found?.value ?? "";
    }
    setAnswers(next);
  }, [open, data]);

  const payloadAnswers = useMemo(
    () =>
      Object.entries(answers).map(([field_key, value]) => ({
        field_key,
        value: value === "" ? null : value,
      })),
    [answers],
  );

  const handleSave = (status) => {
    saveMutation.mutate(
      {
        id: plannedId,
        applicationId,
        payload: { answers: payloadAnswers, status },
      },
      {
        onSuccess: () => {
          if (status === "submitted") onClose();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("exam.feedback.title", "Student feedback")}
          </DialogTitle>
          <DialogDescription className="capitalize">
            {student?.last_name} {student?.first_name}
            {student?.uid ? ` · ${student.uid}` : ""}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <ErrorMessage
            message={error?.message || t("exam.messages.loadFailed")}
            onRetry={refetch}
            variant="inline"
          />
        ) : fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t(
              "exam.feedback.noFields",
              "No feedback fields have been set up for this exam yet.",
            )}
          </p>
        ) : (
          <div className="space-y-4">
            {fields
              .slice()
              .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
              .map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label>
                    {field.label}
                    {field.required ? <span className="text-red-500"> *</span> : null}
                  </Label>
                  {field.type === "text" ? (
                    <Textarea
                      value={answers[field.key] ?? ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                    />
                  ) : (
                    <Input
                      type="number"
                      min={0}
                      max={field.max_marks || undefined}
                      value={answers[field.key] ?? ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [field.key]: e.target.value === "" ? "" : Number(e.target.value),
                        }))
                      }
                    />
                  )}
                </div>
              ))}

            {fields.some(f => f.type === "score") && (
              <div className="p-3 bg-muted/50 rounded-lg flex justify-between items-center text-sm font-semibold">
                <span>{t("exam.feedback.runningTotal", "Running Score Total")}:</span>
                <span>
                  {fields.reduce((sum, f) => sum + (f.type === "score" ? (Number(answers[f.key]) || 0) : 0), 0)} / {fields.reduce((sum, f) => sum + (f.type === "score" ? (Number(f.max_marks) || 0) : 0), 0)}
                </span>
              </div>
            )}

            {others.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {t("exam.feedback.othersStatus", "Other teachers")}:{" "}
                {others
                  .map(
                    (row) =>
                      `${row.teacher?.first_name || ""} ${row.teacher?.last_name || ""} (${row.status})`,
                  )
                  .join(", ")}
              </p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            variant="outline"
            disabled={saveMutation.isPending || fields.length === 0}
            onClick={() => handleSave("draft")}
          >
            {t("exam.feedback.saveDraft", "Save draft")}
          </Button>
          <Button
            disabled={saveMutation.isPending || fields.length === 0}
            onClick={() => handleSave("submitted")}
          >
            {t("exam.feedback.submit", "Submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PracticalFeedbackDialog;
