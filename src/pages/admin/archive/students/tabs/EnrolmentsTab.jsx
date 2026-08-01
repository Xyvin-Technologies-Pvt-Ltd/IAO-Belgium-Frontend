import { Fragment, useState } from "react";
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
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import ErrorMessage from "@/components/common/ErrorMessage";
import ArchiveStatusBadge from "../../components/ArchiveStatusBadge";
import { useArchivePersonEnrolments, useArchiveEnrolmentModules } from "@/store/useArchiveStore";

const LEVEL_LABELS = {
  programme_year: "Programme year",
  module: "Module",
  programme: "Programme",
  other: "Other",
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
      <TableCell>{m.heeft_vrijstelling ? "Exempt" : "—"}</TableCell>
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
  const [expanded, setExpanded] = useState(null);

  const params = level !== "all" ? { level, limit: 100 } : { limit: 100 };
  const { data, isLoading, error, refetch } = useArchivePersonEnrolments(personId, params);
  const enrolments = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
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
        <span className="text-sm text-gray-400">{data?.total_count ?? 0} enrolments</span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead />
            <TableHead>Programme</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cohort / city</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Avg. result</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton rows={5} columns={7} />
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
                  <TableCell className="font-medium max-w-[260px] truncate" title={e.soort_naam}>
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
    </div>
  );
};

export default EnrolmentsTab;
