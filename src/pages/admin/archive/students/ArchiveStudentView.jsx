import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { GraduationCap, Mail, Phone, MapPin } from "lucide-react";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import LoadingState from "@/components/common/LoadingState";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useArchivePerson } from "@/store/useArchiveStore";
import ArchiveGate from "../components/ArchiveGate";
import EnrolmentsTab from "./tabs/EnrolmentsTab";
import ResultsTab from "./tabs/ResultsTab";
import AttendanceTab from "./tabs/AttendanceTab";
import InvoicesTab from "./tabs/InvoicesTab";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "enrolments", label: "Opleidingsvragen", sub: "Enrolments" },
  { key: "results", label: "Resultaten", sub: "Results" },
  { key: "attendance", label: "Aanwezigheid", sub: "Attendance" },
  { key: "invoices", label: "Facturen", sub: "Invoices" },
];

const StatCard = ({ label, value, tone = "" }) => (
  <div className="rounded-xl border border-sidebar-border bg-sidebar p-4">
    <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
    <p className={`mt-1 text-2xl font-semibold ${tone}`}>{value}</p>
  </div>
);

const ArchiveStudentView = () => {
  const params = useParams({ strict: false });
  const id = params.id;
  const { updateBreadcrumbs } = useBreadcrumb();
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading, error, refetch } = useArchivePerson(id);

  useEffect(() => {
    if (data?.data) {
      updateBreadcrumbs([
        { label: "CoachView Archive", path: "/admin/archive/students", navigable: true },
        { label: "Students", path: "/admin/archive/students", navigable: true },
        { label: data.data.person.full_name, path: "/admin/archive/students", navigable: false },
      ]);
    }
    return () => updateBreadcrumbs([]);
  }, [data?.data, id]);

  return (
    <ArchiveGate>
      {isLoading ? (
        <LoadingState text="Loading student..." fullHeight />
      ) : error ? (
        <div className="p-6">
          <ErrorMessage message={error?.message || "Failed to load student"} onRetry={refetch} variant="card" />
        </div>
      ) : !data?.data ? null : (
        <StudentContent data={data.data} id={id} activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
    </ArchiveGate>
  );
};

const StudentContent = ({ data, id, activeTab, setActiveTab }) => {
  const { person, placement, counts, categories } = data;

  return (
    <div className="space-y-6 mt-4">
      <div className="rounded-xl border border-sidebar-border bg-sidebar p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ff8904]/10">
              <GraduationCap className="h-6 w-6 text-[#ff8904]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-dashboard-text dark:text-white">{person.full_name}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-white/60">
                {person.email1 && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> {person.email1}
                  </span>
                )}
                {person.tel1 && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> {person.tel1}
                  </span>
                )}
                {(person.plaats || person.land_code) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {[person.plaats, person.land_code].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
            </div>
          </div>
          <span className={person.inactief ? "text-red-500 font-medium text-sm" : "text-green-600 font-medium text-sm"}>
            {person.inactief ? "Inactive" : "Active"}
          </span>
        </div>

        {placement && (
          <div className="mt-4 rounded-lg bg-blue-50 dark:bg-blue-500/10 px-4 py-3 text-sm text-blue-800 dark:text-blue-300">
            <strong>CoachView placement:</strong> {placement.program_code || "unmapped"} — highest completed year{" "}
            <strong>{placement.highest_completed_year ?? "—"}</strong> — outcome{" "}
            <strong className="capitalize">{placement.outcome}</strong>
            {placement.target_year != null && <> (target year {placement.target_year})</>}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Enrolments" value={counts.enrolments} />
          <StatCard
            label="Attendance"
            value={
              counts.attendance_present + counts.attendance_absent > 0
                ? `${Math.round((counts.attendance_present / (counts.attendance_present + counts.attendance_absent)) * 100)}%`
                : "—"
            }
          />
          <StatCard label="Results recorded" value={counts.results} />
          <StatCard
            label="Invoices"
            value={`${counts.invoices_paid + counts.invoices_open} (${counts.invoices_open} open)`}
            tone={counts.invoices_open > 0 ? "text-amber-600" : ""}
          />
        </div>

        {categories?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {categories.slice(0, 12).map((c) => (
              <span
                key={c.cv_id}
                className="rounded-full bg-gray-100 dark:bg-white/10 px-2.5 py-0.5 text-xs text-gray-600 dark:text-white/70"
              >
                {c.naam}
              </span>
            ))}
            {categories.length > 12 && (
              <span className="text-xs text-gray-400 self-center">+{categories.length - 12} more</span>
            )}
          </div>
        )}
      </div>

      <div className="border-b border-gray-200 dark:border-white/20">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? "border-[#ff8904] text-[#ff8904]"
                  : "border-transparent text-gray-500 dark:text-white/70 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/30"
              }`}
            >
              {tab.label}
              {tab.sub && <span className="ml-1 font-normal text-xs opacity-60">({tab.sub})</span>}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "overview" && <OverviewTab counts={counts} placement={placement} />}
      {activeTab === "enrolments" && <EnrolmentsTab personId={id} />}
      {activeTab === "results" && <ResultsTab personId={id} />}
      {activeTab === "attendance" && <AttendanceTab personId={id} />}
      {activeTab === "invoices" && <InvoicesTab personId={id} />}
    </div>
  );
};

const OverviewTab = ({ counts, placement }) => (
  <div className="rounded-xl border border-sidebar-border bg-sidebar p-5 text-sm text-gray-600 dark:text-white/70">
    <p>
      This is a read-only view of the student's history in the legacy CoachView system, migrated as a frozen snapshot.
      Use the tabs above to review enrolments, exam results, attendance and invoices.
    </p>
    {placement?.evidence && (
      <div className="mt-4">
        <p className="mb-1 font-medium text-dashboard-text dark:text-white">Year placement evidence (from migration analysis)</p>
        <pre className="max-h-64 overflow-auto rounded-lg bg-gray-50 dark:bg-black/40 p-3 text-xs">
          {JSON.stringify(JSON.parse(placement.evidence), null, 2)}
        </pre>
      </div>
    )}
    {!placement && (
      <p className="mt-3 text-gray-400">No year-placement analysis is available for this person in the migration data.</p>
    )}
    <p className="mt-4 text-xs text-gray-400">
      Enrolments: {counts.enrolments} · Results: {counts.results} · Attendance marked:{" "}
      {counts.attendance_present + counts.attendance_absent} (+{counts.attendance_unmarked} unmarked) · Invoices paid:{" "}
      {counts.invoices_paid} · Invoices open: {counts.invoices_open}
    </p>
  </div>
);

export default ArchiveStudentView;
