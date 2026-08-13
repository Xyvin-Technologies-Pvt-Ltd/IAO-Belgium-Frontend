import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Archive, AlertTriangle, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { LoadingSpinner, ErrorMessage } from "@/components/common";
import { useArchivePersonResults } from "@/store/useArchiveStore";
import ArchiveStatusBadge from "@/pages/admin/archive/components/ArchiveStatusBadge";
import BilingualLabel from "@/pages/admin/archive/components/BilingualLabel";
import AttendanceTab from "@/pages/admin/archive/students/tabs/AttendanceTab";
import InvoicesTab from "@/pages/admin/archive/students/tabs/InvoicesTab";

const SUB_TABS = ["enrolments", "results", "attendance", "invoices"];

const LEVEL_OPTIONS = ["programme_year", "module", "programme", "other"];

//* Enrolments sub-tab: rendered straight from the year bucket the summary
//* call already grouped — accurate to this specific year, zero extra query.
const EnrolmentsPanel = ({ enrolments }) => {
  const { t } = useTranslation();
  const [level, setLevel] = useState("all");
  const [status, setStatus] = useState("all");

  const statusOptions = useMemo(() => {
    const values = [...new Set((enrolments || []).map((e) => e.status).filter(Boolean))];
    return values.sort();
  }, [enrolments]);

  const filtered = useMemo(() => {
    return (enrolments || []).filter((e) => {
      if (level !== "all" && e.level !== level) return false;
      if (status !== "all" && e.status !== status) return false;
      return true;
    });
  }, [enrolments, level, status]);

  const hasFilters = level !== "all" || status !== "all";

  const clearFilters = () => {
    setLevel("all");
    setStatus("all");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-48 h-8 text-xs">
            <SelectValue placeholder={t("coachviewImport.filters.allLevels", "All levels")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("coachviewImport.filters.allLevels", "All levels")}</SelectItem>
            {LEVEL_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48 h-8 text-xs">
            <SelectValue placeholder={t("coachviewImport.filters.allStatuses", "All statuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("coachviewImport.filters.allStatuses", "All statuses")}</SelectItem>
            {statusOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            {t("coachviewImport.filters.clear", "Clear filters")}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4">
          {t("coachviewImport.filters.noEnrolments", "No enrolments match these filters.")}
        </p>
      ) : (
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
            {filtered.map((e) => (
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
      )}
    </div>
  );
};

//* Results sub-tab: the same person-results call the standalone archive
//* portal uses, filtered client-side to this year via target_year (added to
//* the backend query specifically so this filter is possible — see
//* archive.service.js list_person_results).
const ResultsPanel = ({ cvId, year }) => {
  const { t } = useTranslation();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data, isLoading, error, refetch } = useArchivePersonResults(cvId, {
    limit: 100,
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  });

  const hasFilters = !!from || !!to;

  const rows = (data?.data || []).filter((r) => Number(r.target_year) === Number(year));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="date"
          className="w-40 h-8 text-xs"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          aria-label={t("coachviewImport.filters.from", "From")}
        />
        <Input
          type="date"
          className="w-40 h-8 text-xs"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          aria-label={t("coachviewImport.filters.to", "To")}
        />
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setFrom("");
              setTo("");
            }}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            {t("coachviewImport.filters.clear", "Clear filters")}
          </button>
        )}
      </div>

      {isLoading && <LoadingSpinner size="sm" />}
      {error && <ErrorMessage message={error?.message} onRetry={refetch} variant="inline" />}
      {!isLoading && !error && rows.length === 0 && (
        <p className="text-xs text-muted-foreground py-4">
          {t("coachviewImport.filters.noResults", "No results recorded for this year.")}
        </p>
      )}
      {!isLoading && !error && rows.length > 0 && (
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
      )}
    </div>
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
