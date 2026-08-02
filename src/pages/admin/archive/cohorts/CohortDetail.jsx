import { useEffect } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import LoadingState from "@/components/common/LoadingState";
import ErrorMessage from "@/components/common/ErrorMessage";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import SortableTableHead from "@/components/ui/table/SortableTableHead";
import { useClientTableSort } from "@/hooks/useClientTableSort";
import { useArchiveCohort } from "@/store/useArchiveStore";
import ArchiveGate from "../components/ArchiveGate";

const CohortDetail = () => {
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const id = params.id;
  const { updateBreadcrumbs } = useBreadcrumb();
  const { data, isLoading, error, refetch } = useArchiveCohort(id);

  useEffect(() => {
    if (data?.data) {
      updateBreadcrumbs([
        { label: "CoachView Archive", path: "/admin/archive/cohorts", navigable: true },
        { label: "Cohorts", path: "/admin/archive/cohorts", navigable: true },
        { label: data.data.cohort.code, path: "/admin/archive/cohorts", navigable: false },
      ]);
    }
    return () => updateBreadcrumbs([]);
  }, [data?.data, id]);

  return (
    <ArchiveGate>
      {isLoading ? (
        <LoadingState text="Loading cohort..." fullHeight />
      ) : error ? (
        <div className="p-6">
          <ErrorMessage message={error?.message || "Failed to load cohort"} onRetry={refetch} variant="card" />
        </div>
      ) : !data?.data ? null : (
        <Content data={data.data} navigate={navigate} />
      )}
    </ArchiveGate>
  );
};

const SESSION_ACCESSORS = {
  date: (s) => s.datum,
  name: (s) => s.naam || s.code,
  location: (s) => s.locatie_naam,
  exam: (s) => s.examen,
};

const STUDENT_ACCESSORS = {
  name: (p) => p.full_name,
  email: (p) => p.email1,
};

const Content = ({ data, navigate }) => {
  const { cohort, sessions, persons } = data;

  const sessionSort = useClientTableSort(sessions, { defaultKey: "date", accessors: SESSION_ACCESSORS });
  const studentSort = useClientTableSort(persons, { defaultKey: "name", accessors: STUDENT_ACCESSORS });

  return (
    <div className="space-y-6 mt-4">
      <div className="rounded-xl border border-sidebar-border bg-sidebar p-5">
        <h2 className="text-lg font-semibold text-dashboard-text dark:text-white">{cohort.code}</h2>
        <p className="text-sm text-gray-500 dark:text-white/60">{cohort.naam}</p>
        <p className="mt-2 text-xs text-gray-400">
          {cohort.location_name || cohort.location_code || "Unknown city"} · Group {cohort.cohort_group || "—"} · Academic year{" "}
          {cohort.academic_year || "—"} · {cohort.enrollment_count} students · {cohort.session_count} sessions
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-dashboard-text dark:text-white">
          Opleidingsonderdelen <span className="font-normal text-gray-400">(Sessions — {sessions.length})</span>
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead sortKey="date" activeKey={sessionSort.sortBy} order={sessionSort.sortOrder} onSort={sessionSort.handleSort}>
                Datum <span className="opacity-60">(Date)</span>
              </SortableTableHead>
              <SortableTableHead sortKey="name" activeKey={sessionSort.sortBy} order={sessionSort.sortOrder} onSort={sessionSort.handleSort}>
                Naam <span className="opacity-60">(Name)</span>
              </SortableTableHead>
              <SortableTableHead sortKey="location" activeKey={sessionSort.sortBy} order={sessionSort.sortOrder} onSort={sessionSort.handleSort}>
                Locatie <span className="opacity-60">(Location)</span>
              </SortableTableHead>
              <SortableTableHead sortKey="exam" activeKey={sessionSort.sortBy} order={sessionSort.sortOrder} onSort={sessionSort.handleSort}>
                Examen <span className="opacity-60">(Exam)</span>
              </SortableTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessionSort.sorted.length > 0 ? (
              sessionSort.sorted.map((s) => (
                <TableRow key={s.cv_id}>
                  <TableCell className="text-gray-500 dark:text-white/60">
                    {s.datum ? new Date(s.datum).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="max-w-70 truncate" title={s.naam}>
                    {s.naam || s.code}
                  </TableCell>
                  <TableCell>{s.locatie_naam || "—"}</TableCell>
                  <TableCell>{s.examen ? "Ja (Yes)" : "—"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-gray-400">
                  No sessions recorded for this cohort.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-dashboard-text dark:text-white">
          Personen <span className="font-normal text-gray-400">(Students — {persons.length})</span>
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead sortKey="name" activeKey={studentSort.sortBy} order={studentSort.sortOrder} onSort={studentSort.handleSort}>
                Naam <span className="opacity-60">(Name)</span>
              </SortableTableHead>
              <SortableTableHead sortKey="email" activeKey={studentSort.sortBy} order={studentSort.sortOrder} onSort={studentSort.handleSort}>
                E-mail <span className="opacity-60">(Email)</span>
              </SortableTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studentSort.sorted.length > 0 ? (
              studentSort.sorted.map((p) => (
                <TableRow
                  key={p.cv_id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate({ to: "/admin/archive/students/$id", params: { id: p.cv_id } })}
                >
                  <TableCell className="font-medium">{p.full_name}</TableCell>
                  <TableCell>{p.email1 || "—"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-6 text-gray-400">
                  No students linked to this cohort.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CohortDetail;
