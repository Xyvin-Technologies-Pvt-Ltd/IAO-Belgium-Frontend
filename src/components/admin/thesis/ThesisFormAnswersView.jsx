import { useTranslation } from "react-i18next";

function formatAnswer(question, value, t) {
  if (value === undefined || value === null || value === "") {
    return t("common.dash", "—");
  }

  if (question.type === "confirmation") {
    return value === true
      ? t("common.confirmed", "Confirmed")
      : t("common.notConfirmed", "Not confirmed");
  }

  if (question.type === "yes_no") {
    if (value === "yes" || value === true) return t("common.yes", "Yes");
    if (value === "no" || value === false) return t("common.no", "No");
    return String(value);
  }

  if (question.type === "multiple_choice") {
    const opt = (question.options || []).find(
      (o) => String(o.id) === String(value)
    );
    return opt?.label || String(value);
  }

  if (question.type === "supervisor" && typeof value === "object") {
    const name = value.name || "";
    const email = value.email || "";
    const typeLabel =
      value.teacher_type === "external"
        ? t("thesis.externalTeacher", "External")
        : t("thesis.internalTeacher", "Internal");
    if (name && email) return `${name} (${email}) · ${typeLabel}`;
    return name || email || t("common.dash", "—");
  }

  return String(value);
}

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
                  {formatAnswer(q, answerMap[q.id], t)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
