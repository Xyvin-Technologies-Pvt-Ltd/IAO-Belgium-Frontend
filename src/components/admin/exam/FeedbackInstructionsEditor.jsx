import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { useUpdateExam } from "@/store/useExamStore";

const FeedbackInstructionsEditor = ({ exam, onSaved }) => {
  const { t } = useTranslation();
  const updateExam = useUpdateExam();
  const [content, setContent] = useState(exam?.feedback_instructions || "");

  useEffect(() => {
    setContent(exam?.feedback_instructions || "");
  }, [exam?._id, exam?.feedback_instructions]);

  const handleSave = () => {
    updateExam.mutate(
      {
        id: exam._id,
        data: { feedback_instructions: content || "" },
      },
      {
        onSuccess: () => onSaved?.(),
      },
    );
  };

  return (
    <div className="p-5 border rounded-lg bg-card text-card-foreground shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold">
            {t(
              "exam.feedback.instructionsTitle",
              "Feedback instructions",
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t(
              "exam.feedback.instructionsHint",
              "Add formatted text, images, and a Jotform link for teachers. No other fields are required here.",
            )}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={updateExam.isPending}
        >
          {t("common.save", "Save")}
        </Button>
      </div>
      <RichTextEditor
        value={content}
        onChange={setContent}
        placeholder={t(
          "exam.feedback.instructionsPlaceholder",
          "Write instructions and insert the Jotform link…",
        )}
      />
    </div>
  );
};

export default FeedbackInstructionsEditor;
