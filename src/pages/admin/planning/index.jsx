import { useTranslation } from "react-i18next";
import PlanningTable from "./PlanningTable";

const Planning = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 mt-4">
      <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
        {t("planningManagement.title")}
      </h2>
      <PlanningTable />
    </div>
  );
};

export default Planning;
