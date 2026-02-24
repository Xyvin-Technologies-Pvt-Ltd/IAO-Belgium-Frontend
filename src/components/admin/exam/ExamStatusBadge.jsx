import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const statusStyles = {
  draft: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  archived: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

const ExamStatusBadge = ({ status, className }) => {
  const { t } = useTranslation();
  const label = t(`exam.status.${status || "draft"}`);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status] || statusStyles.draft,
        className,
      )}
    >
      {label}
    </span>
  );
};

export default ExamStatusBadge;
