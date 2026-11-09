export function formatFormAnswer(question, value, t) {
  if (value === undefined || value === null || value === "") {
    return t ? t("common.dash", "—") : "—";
  }

  if (question?.type === "confirmation") {
    return value === true
      ? t
        ? t("common.confirmed", "Confirmed")
        : "Confirmed"
      : t
        ? t("common.notConfirmed", "Not confirmed")
        : "Not confirmed";
  }

  if (question?.type === "yes_no") {
    if (value === "yes" || value === true)
      return t ? t("common.yes", "Yes") : "Yes";
    if (value === "no" || value === false)
      return t ? t("common.no", "No") : "No";
    return String(value);
  }

  if (question?.type === "multiple_choice") {
    const opt = (question.options || []).find(
      (o) => String(o.id) === String(value)
    );
    return opt?.label || String(value);
  }

  if (question?.type === "supervisor" && typeof value === "object") {
    const name = value.name || "";
    const email = value.email || "";
    if (value.teacher_type === "custom") {
      if (name && email) {
        return `${name} (${email}) · ${
          t ? t("thesis.customTeacher", "Custom") : "Custom"
        }`;
      }
      return name || email || (t ? t("common.dash", "—") : "—");
    }
    const typeLabel =
      value.teacher_type === "external"
        ? t
          ? t("thesis.externalTeacher", "External")
          : "External"
        : t
          ? t("thesis.internalTeacher", "Internal")
          : "Internal";
    if (name) return `${name} · ${typeLabel}`;
    return email || (t ? t("common.dash", "—") : "—");
  }

  return String(value);
}

export function isFilterableFormQuestion(question) {
  return (
    question?.type === "yes_no" ||
    question?.type === "multiple_choice" ||
    question?.type === "confirmation"
  );
}
