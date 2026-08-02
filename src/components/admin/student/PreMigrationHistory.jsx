import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Archive, AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { LoadingSpinner, ErrorMessage } from "@/components/common";
import { useArchivePersonResults } from "@/store/useArchiveStore";
import ArchiveStatusBadge from "@/pages/admin/archive/components/ArchiveStatusBadge";
import BilingualLabel from "@/pages/admin/archive/components/BilingualLabel";
import AttendanceTab from "@/pages/admin/archive/students/tabs/AttendanceTab";
import InvoicesTab from "@/pages/admin/archive/students/tabs/InvoicesTab";

const SUB_TABS = ["enrolments", "results", "attendance", "invoices"];

//* Enrolments sub-tab: rendered straight from the year bucket the summary
//* call already grouped — accurate to this specific year, zero extra query.
const EnrolmentsPanel = ({ enrolments }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Programme</TableHead>
        <TableHead>Level</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Cohort</TableHead>
        <TableHead>Avg. result</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {enrolments.map((e) => (
        <TableRow key={e.cv_id}>
          <TableCell>
            <BilingualLabel nl={e.soort_code} en={e.soort_naam} />
          </TableCell>
          <TableCell className="capitalize">{(e.level || "—").replace("_", " ")}</TableCell>
          <TableCell><ArchiveStatusBadge status={e.status} /></TableCell>
          <TableCell>{e.cohort?.location_name || "—"}</TableCell>
          <TableCell>{e.gemiddeld_resultaat || "—"}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

//* Results sub-tab: the same person-results call the standalone archive
//* portal uses, filtered client-side to this year via target_year (added to
//* the backend query specifically so this filter is possible — see
//* archive.service.js list_person_results).
const ResultsPanel = ({ cvId, year }) => {
  const { data, isLoading, error, refetch } = useArchivePersonResults(cvId, { limit: 100 });
  if (isLoading) return <LoadingSpinner size="sm" />;
  if (error) return <ErrorMessage message={error?.message} onRetry={refetch} variant="inline" />;

  const rows = (data?.data || []).filter((r) => r.target_year === year);
  if (rows.length === 0) {
    return <p className="text-xs text-muted-foreground py-4">No results recorded for this year.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Programme</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Code</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={`${r.opleidingsvraag_id}-${i}`}>
            <TableCell>{r.datum ? new Date(r.datum).toLocaleDateString() : "—"}</TableCell>
            <TableCell><BilingualLabel nl={r.soort_code} en={r.soort_naam} /></TableCell>
            <TableCell>{r.score_absoluut ?? "—"}</TableCell>
            <TableCell>{r.score_code || "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

//* Replaces the native (empty) year content for a year the student studied
//* in CoachView before migrating — everything they did that year, queried
//* live from the archive Postgres (nothing is copied into Mongo).
//*
//* Purely presentational: the caller (via useMigratedYearHistory) already
//* decided this year has archive history before mounting this component, so
//* there's no loading/empty/not-migrated branch here — showing this
//* alongside the native "No modules assigned" empty state would be the
//* exact redundancy this component exists to avoid.
const PreMigrationHistory = ({ cvId, yearBucket, year }) => {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState("enrolments");

  return (
    <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-900/10 p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
        <Archive className="h-4 w-4" />
        {t("coachviewImport.preMigrationHistory", "Pre-migration history (CoachView Archive)")}
      </div>

      <div className="flex gap-4 border-b border-blue-200 dark:border-blue-800">
        {SUB_TABS.map((tabKey) => (
          <button
            key={tabKey}
            type="button"
            onClick={() => setActiveSubTab(tabKey)}
            className={`pb-2 text-xs font-medium border-b-2 capitalize transition-colors ${
              activeSubTab === tabKey
                ? "border-[#ff8904] text-[#ff8904]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(`coachviewImport.subTabs.${tabKey}`, tabKey)}
          </button>
        ))}
      </div>

      {activeSubTab === "enrolments" && <EnrolmentsPanel enrolments={yearBucket.enrolments} />}
      {activeSubTab === "results" && <ResultsPanel cvId={cvId} year={year} />}

      {activeSubTab === "attendance" && (
        <>
          <p className="flex items-center gap-1.5 text-xs text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {t(
              "coachviewImport.attendanceAllYears",
              "Showing this student's complete CoachView attendance history, not limited to this year.",
            )}
          </p>
          <AttendanceTab personId={cvId} />
        </>
      )}

      {activeSubTab === "invoices" && (
        <>
          <p className="flex items-center gap-1.5 text-xs text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {t(
              "coachviewImport.invoicesAllYears",
              "CoachView invoices have no study-year attribution — showing the student's complete invoice history.",
            )}
          </p>
          <InvoicesTab personId={cvId} />
        </>
      )}
    </div>
  );
};

export default PreMigrationHistory;
