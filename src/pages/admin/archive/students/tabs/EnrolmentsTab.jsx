import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import SortableTableHead from "@/components/ui/table/SortableTableHead";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useTableSort } from "@/hooks/useTableSort";
import ArchiveStatusBadge from "../../components/ArchiveStatusBadge";
import { useArchivePersonEnrolments, useArchiveEnrolmentModules, useArchiveFacets } from "@/store/useArchiveStore";

const LEVEL_LABELS = {
  programme_year: "Opleidingsjaar (Programme year)",
  module: "Module",
  programme: "Opleiding (Programme)",
  other: "Overig (Other)",
};

const ModuleRow = ({ personId, vraagId }) => {
  const { data, isLoading, error } = useArchiveEnrolmentModules(personId, vraagId);
  const modules = data?.data || [];

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={7} className="text-center py-4 text-sm text-gray-400">
          Loading modules...
        </TableCell>
      </TableRow>
    );
  }
  if (error) {
    return (
      <TableRow>
        <TableCell colSpan={7} className="py-4">
          <ErrorMessage message={error?.message || "Failed to load modules"} showRetry={false} variant="inline" />
        </TableCell>
      </TableRow>
    );
  }
  if (modules.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={7} className="text-center py-4 text-sm text-gray-400">
          No per-module records for this enrolment.
        </TableCell>
      </TableRow>
    );
  }

  return modules.map((m) => (
    <TableRow key={m.cv_id} className="bg-gray-50/60 dark:bg-white/5">
      <TableCell colSpan={2} className="pl-10 text-sm">
        {m.naam || m.code}
      </TableCell>
      <TableCell colSpan={2}>
        <ArchiveStatusBadge status={m.status} />
      </TableCell>
      <TableCell>{m.heeft_vrijstelling ? "Vrijgesteld (Exempt)" : "—"}</TableCell>
      <TableCell colSpan={2} className="text-xs text-gray-500">
        {m.results?.length > 0
          ? m.results.map((r) => r.score_code || r.score_absoluut || "recorded").join(", ")
          : "No result recorded"}
      </TableCell>
    </TableRow>
  ));
};

const EnrolmentsTab = ({ personId }) => {
  const [level, setLevel] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [expanded, setExpanded] = useState(null);
  const { data: facetsData } = useArchiveFacets();
  const statuses = facetsData?.data?.enrolment_statuses || [];

  const { sortBy, sortOrder, handleSort, sortParams } = useTableSort("started", "asc", { setPage });

  useEffect(() => {
    setPage(1);
    setExpanded(null);
  }, [level, status]);

  const params = useMemo(
    () => ({
      ...(level !== "all" ? { level } : {}),
      ...(status !== "all" ? { status } : {}),
      ...sortParams,
    }),
    [level, status, sortParams],
  );

  const { data, isLoading, error, refetch } = useArchivePersonEnrolments(personId, {
    page,
    limit: rowsPerPage,
    ...params,
  });
  const enrolments = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handlePageChange = (next) => {
    setExpanded(null);
    setPage(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {Object.entries(LEVEL_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label_nl}
                {s.label_en ? ` (${s.label_en})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-400">{totalRows} enrolments</span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead />
            <SortableTableHead sortKey="programme" activeKey={sortBy} order={sortOrder} onSort={handleSort}>
              Opleiding <span className="opacity-60">(Programme)</span>
            </SortableTableHead>
            <SortableTableHead sortKey="level" activeKey={sortBy} order={sortOrder} onSort={handleSort}>
              Niveau <span className="opacity-60">(Level)</span>
            </SortableTableHead>
            <SortableTableHead sortKey="status" activeKey={sortBy} order={sortOrder} onSort={handleSort}>Status</SortableTableHead>
            <TableHead>
              Cohort/plaats <span className="opacity-60">(Cohort / city)</span>
            </TableHead>
            <SortableTableHead sortKey="started" activeKey={sortBy} order={sortOrder} onSort={handleSort}>
              Startdatum <span className="opacity-60">(Started)</span>
            </SortableTableHead>
            <SortableTableHead sortKey="avg" activeKey={sortBy} order={sortOrder} onSort={handleSort}>
              Gem. resultaat <span className="opacity-60">(Avg. result)</span>
            </SortableTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={7} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center p-8">
                <ErrorMessage message={error?.message || "Failed to load enrolments"} onRetry={refetch} variant="inline" />
              </TableCell>
            </TableRow>
          ) : enrolments.length > 0 ? (
            enrolments.map((e) => (
              <Fragment key={e.cv_id}>
                <TableRow
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setExpanded(expanded === e.cv_id ? null : e.cv_id)}
                >
                  <TableCell className="w-8">
                    {expanded === e.cv_id ? (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium max-w-65 truncate" title={e.soort_naam}>
                    {e.soort_code}
                    <div className="text-xs font-normal text-gray-400 truncate">{e.soort_naam}</div>
                  </TableCell>
                  <TableCell>{LEVEL_LABELS[e.level] || e.level || "—"}</TableCell>
                  <TableCell>
                    <ArchiveStatusBadge status={e.status} />
                  </TableCell>
                  <TableCell>
                    {e.cohort ? `${e.cohort.location_name || e.cohort.location_code || ""} ${e.cohort.cohort_group || ""}`.trim() : "—"}
                  </TableCell>
                  <TableCell className="text-gray-500 dark:text-white/60">
                    {e.start_datum ? new Date(e.start_datum).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>{e.gemiddeld_resultaat ?? "—"}</TableCell>
                </TableRow>
                {expanded === e.cv_id && <ModuleRow personId={personId} vraagId={e.cv_id} />}
              </Fragment>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                No enrolments found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Pagination page={page} setPage={handlePageChange} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} totalRows={totalRows} />
    </div>
  );
};

export default EnrolmentsTab;
