import { useState } from "react";
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
import { useTranslation } from "react-i18next";
import { Plus, Trash, ChevronUp, ChevronDown } from "lucide-react";
import { useUpdateExam } from "@/store/useExamStore";
import { toast } from "sonner";

const newField = (index) => ({
  key:
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `field_${Date.now()}_${index}`,
  label: "",
  type: "score",
  max_marks: 10,
  required: false,
  sort_order: index,
});

const FeedbackFieldsEditor = ({ exam, onSaved }) => {
  const { t } = useTranslation();
  const updateExam = useUpdateExam();
  const [fields, setFields] = useState(
    () =>
      (exam.feedback_fields || []).map((field, index) => ({
        ...field,
        sort_order: field.sort_order ?? index,
      })),
  );

  const handleSave = () => {
    const payload = fields.map((field, index) => ({
      key: field.key,
      label: field.label.trim(),
      type: field.type,
      max_marks: field.type === "score" ? Number(field.max_marks) || 0 : undefined,
      required: !!field.required,
      sort_order: index,
    }));
    if (payload.some((field) => !field.label)) {
      toast.error(t("exam.feedback.labelRequired", "Each field needs a label"));
      return;
    }
    updateExam.mutate(
      { id: exam._id, data: { feedback_fields: payload } },
      {
        onSuccess: () => onSaved?.(),
      },
    );
  };

  return (
    <div className="p-5 border rounded-lg bg-card text-card-foreground shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold">
          {t("exam.feedback.fieldsTitle", "Feedback fields")}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setFields((prev) => [...prev, newField(prev.length)])}
        >
          <Plus className="h-4 w-4 mr-1" />
          {t("exam.feedback.addField", "Add field")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {t(
          "exam.feedback.fieldsHint",
          "Teachers assigned to this practical exam will fill these fields independently for each student.",
        )}
      </p>

      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("exam.feedback.noFields", "No feedback fields yet.")}
        </p>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.key}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end border rounded-md p-3"
            >
              <div className="md:col-span-4 space-y-1">
                <Label>{t("exam.feedback.fieldLabel", "Label")}</Label>
                <Input
                  value={field.label}
                  onChange={(e) =>
                    setFields((prev) =>
                      prev.map((item, i) =>
                        i === index ? { ...item, label: e.target.value } : item,
                      ),
                    )
                  }
                />
              </div>
              <div className="md:col-span-3 space-y-1">
                <Label>{t("exam.feedback.fieldType", "Type")}</Label>
                <Select
                  value={field.type}
                  onValueChange={(v) =>
                    setFields((prev) =>
                      prev.map((item, i) =>
                        i === index ? { ...item, type: v } : item,
                      ),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score">{t("exam.feedback.score", "Score")}</SelectItem>
                    <SelectItem value="text">{t("exam.feedback.text", "Text")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {field.type === "score" && (
                <div className="md:col-span-2 space-y-1">
                  <Label>{t("exam.form.passingMarks", "Max marks")}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={field.max_marks ?? 0}
                    onChange={(e) =>
                      setFields((prev) =>
                        prev.map((item, i) =>
                          i === index
                            ? { ...item, max_marks: e.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                </div>
              )}
              <div className="md:col-span-2 flex items-center gap-2 pb-2">
                <input
                  id={`req-${field.key}`}
                  type="checkbox"
                  checked={!!field.required}
                  onChange={(e) =>
                    setFields((prev) =>
                      prev.map((item, i) =>
                        i === index ? { ...item, required: e.target.checked } : item,
                      ),
                    )
                  }
                />
                <Label htmlFor={`req-${field.key}`}>
                  {t("common.required", "Required")}
                </Label>
              </div>
              <div className="md:col-span-12 flex justify-end gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={index === 0}
                  onClick={() =>
                    setFields((prev) => {
                      const next = [...prev];
                      [next[index - 1], next[index]] = [next[index], next[index - 1]];
                      return next;
                    })
                  }
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={index === fields.length - 1}
                  onClick={() =>
                    setFields((prev) => {
                      const next = [...prev];
                      [next[index], next[index + 1]] = [next[index + 1], next[index]];
                      return next;
                    })
                  }
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setFields((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateExam.isPending}>
          {t("common.save", "Save fields")}
        </Button>
      </div>
    </div>
  );
};

export default FeedbackFieldsEditor;
