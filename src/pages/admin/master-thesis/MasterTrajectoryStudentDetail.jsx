import { useTranslation } from "react-i18next";
import TrajectoryStudentDetail from "@/pages/admin/thesis/TrajectoryStudentDetail";

/**
 * Master Thesis student detail — same APIs/actions as DO, distinct chrome/layout shell.
 */
export default function MasterTrajectoryStudentDetail() {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-muted/40 px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("sidebar.admin.masterThesis", "Master Thesis")}
        </p>
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground mt-0.5">
          {t(
            "thesisManagement.master.studentProgress",
            "Student progress overview"
          )}
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          {t(
            "thesisManagement.master.studentProgressHint",
            "Review assignments, step submissions, and attempt status for this Master Thesis student."
          )}
        </p>
      </div>

      <div className="master-thesis-student-detail [&_.rounded-2xl]:rounded-xl [&_.shadow-2xs]:shadow-none space-y-1">
        <TrajectoryStudentDetail />
      </div>
    </div>
  );
}
