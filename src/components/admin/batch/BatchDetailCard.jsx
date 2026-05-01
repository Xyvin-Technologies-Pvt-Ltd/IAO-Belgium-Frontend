import moment from "moment";
import { useTranslation } from "react-i18next";

const InfoItem = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-sm text-sidebar-foreground/70">{label}</p>
    <p className="text-sm font-medium text-sidebar-foreground">{value || t("common.dash")}</p>
  </div>
);

const BatchDetailCard = ({ batch }) => {
  const { t } = useTranslation();
  
  if (!batch) return null;

  return (
    <div className="bg-sidebar rounded-xl border border-sidebar-border p-6">
      <h2 className="text-base font-semibold text-sidebar-foreground mb-4">
        {t("batchManagement.details.info.title")}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-10">
        <InfoItem
          label={t("batchManagement.details.info.intakeName")}
          value={batch.intake_name}
        />

        <InfoItem
          label={t("batchManagement.details.info.program")}
          value={batch.program_name}
        />

        <InfoItem
          label={t("batchManagement.details.info.capacity")}
          value={`${batch.student_count}/${batch.student_per_batch} ${t("batchManagement.details.info.students")}`}
        />

        <InfoItem
          label={t("batchManagement.details.info.intakeStartDate")}
          value={moment(batch.start_date).format("DD-MM-YYYY")}
        />

        <InfoItem
          label={t("batchManagement.details.info.intakeEndDate")}
          value={moment(batch.end_date).format("DD-MM-YYYY")}
        />
      </div>
    </div>
  );
};

export default BatchDetailCard;
