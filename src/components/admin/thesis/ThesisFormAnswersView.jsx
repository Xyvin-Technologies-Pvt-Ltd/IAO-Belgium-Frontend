import { useTranslation } from "react-i18next";
import { formatFormAnswer } from "@/utils/thesisFormAnswers";

export default function ThesisFormAnswersView({ step }) {
  const { t } = useTranslation();
  const sections = step?.form_schema?.sections || [];
  const answerMap = {};
  for (const a of step?.form_response?.answers || []) {
    answerMap[String(a.question_id)] = a.value;
  }

  if (!step?.form_response) {
    return (
      <p className="text-xs text-muted-foreground">
        {t("thesis.formNotSubmitted", "Form not submitted yet")}
      </p>
    );
  }

  return (
    <div className="space-y-3 pt-1">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
        {t("thesis.formAnswers", "Form answers")}
      </span>
      {sections.map((section) => (
        <div key={section.id} className="space-y-2">
          {section.title ? (
            <p className="text-xs font-semibold text-foreground">
              {section.title}
            </p>
          ) : null}
          {section.description ? (
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
              {section.description}
            </p>
          ) : null}
          <div className="space-y-2">
            {(section.questions || []).map((q) => (
              <div
                key={q.id}
                className="rounded-md border border-border bg-muted/20 px-3 py-2"
              >
                <p className="text-[11px] font-medium text-muted-foreground">
                  {q.label}
                </p>
                <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap">
                  {formatFormAnswer(q, answerMap[q.id], t)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
