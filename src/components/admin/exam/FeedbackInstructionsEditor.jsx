import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Pencil, Plus } from "lucide-react";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { useUpdateExam } from "@/store/useExamStore";

const FeedbackInstructionsEditor = ({ exam, onSaved }) => {
  const { t } = useTranslation();
  const updateExam = useUpdateExam();
  const [content, setContent] = useState(exam?.feedback_instructions || "");
  const [isEditing, setIsEditing] = useState(false);

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
        onSuccess: () => {
          setIsEditing(false);
          onSaved?.();
        },
      },
    );
  };

  const handleCancel = () => {
    setContent(exam?.feedback_instructions || "");
    setIsEditing(false);
  };

  const hasInstructions = !!(exam?.feedback_instructions && exam.feedback_instructions.trim());

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

        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={updateExam.isPending}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={updateExam.isPending}
            >
              {updateExam.isPending
                ? t("common.saving", "Saving...")
                : t("common.save", "Save")}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant={hasInstructions ? "outline" : "default"}
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            {hasInstructions ? (
              <>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                {t("common.edit", "Edit")}
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                {t("exam.feedback.addInstructions", "Add instructions")}
              </>
            )}
          </Button>
        )}
      </div>

      {isEditing ? (
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder={t(
            "exam.feedback.instructionsPlaceholder",
            "Write instructions and insert the Jotform link…",
          )}
        />
      ) : hasInstructions ? (
        <div
          className="p-4 border rounded-md bg-muted/20 text-sm text-foreground overflow-auto prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <div className="p-6 border border-dashed rounded-md text-center text-sm text-muted-foreground">
          {t("exam.feedback.noInstructionsYet", "No feedback instructions added yet.")}
        </div>
      )}
    </div>
  );
};

export default FeedbackInstructionsEditor;
