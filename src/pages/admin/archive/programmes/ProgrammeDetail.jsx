import { useEffect } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import LoadingState from "@/components/common/LoadingState";
import ErrorMessage from "@/components/common/ErrorMessage";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { useArchiveProgramme } from "@/store/useArchiveStore";
import ArchiveGate from "../components/ArchiveGate";

const ProgrammeDetail = () => {
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const id = params.id;
  const { updateBreadcrumbs } = useBreadcrumb();
  const { data, isLoading, error, refetch } = useArchiveProgramme(id);

  useEffect(() => {
    if (data?.data) {
      updateBreadcrumbs([
        { label: "CoachView Archive", path: "/admin/archive/programmes", navigable: true },
        { label: "Programmes", path: "/admin/archive/programmes", navigable: true },
        { label: data.data.programme.code, path: "/admin/archive/programmes", navigable: false },
      ]);
    }
    return () => updateBreadcrumbs([]);
  }, [data?.data, id]);

  return (
    <ArchiveGate>
      {isLoading ? (
        <LoadingState text="Loading programme..." fullHeight />
      ) : error ? (
        <div className="p-6">
          <ErrorMessage message={error?.message || "Failed to load programme"} onRetry={refetch} variant="card" />
        </div>
      ) : !data?.data ? null : (
        <Content data={data.data} navigate={navigate} />
      )}
    </ArchiveGate>
  );
};

const Content = ({ data, navigate }) => {
  const { programme, modules, cohorts, enrolment_count } = data;
  return (
    <div className="space-y-6 mt-4">
      <div className="rounded-xl border border-sidebar-border bg-sidebar p-5">
        <h2 className="text-lg font-semibold text-dashboard-text dark:text-white">{programme.code}</h2>
        <p className="text-sm text-gray-500 dark:text-white/60">{programme.naam}</p>
        <p className="mt-2 text-xs text-gray-400">
          Family {programme.cv_family || "—"} · Year {programme.target_year ?? "—"} · {enrolment_count} historical enrolments
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-dashboard-text dark:text-white">
          Modules <span className="font-normal text-gray-400">({modules.length})</span>
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Exam</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modules.length > 0 ? (
              modules.map((m) => (
                <TableRow key={`${m.cv_id}-${m.volgnummer}`}>
                  <TableCell>{m.volgnummer ?? "—"}</TableCell>
                  <TableCell className="font-medium">{m.code}</TableCell>
                  <TableCell className="max-w-[320px] truncate" title={m.naam}>
                    {m.naam}
                  </TableCell>
                  <TableCell>{m.examen ? "Yes" : "—"}</TableCell>
                  <TableCell>
                    <span className={m.inactief ? "text-red-500" : "text-green-600"}>{m.inactief ? "Inactive" : "Active"}</span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-gray-400">
                  No modules linked to this programme.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-dashboard-text dark:text-white">
          Cohorts <span className="font-normal text-gray-400">({cohorts.length})</span>
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Academic year</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cohorts.length > 0 ? (
              cohorts.map((c) => (
                <TableRow
                  key={c.opleiding_id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate({ to: "/admin/archive/cohorts/$id", params: { id: c.opleiding_id } })}
                >
                  <TableCell className="font-medium">{c.code}</TableCell>
                  <TableCell>{c.location_name || c.location_code || "—"}</TableCell>
                  <TableCell>{c.cohort_group || "—"}</TableCell>
                  <TableCell>{c.academic_year || "—"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-gray-400">
                  No genuine cohorts recorded for this programme.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProgrammeDetail;
