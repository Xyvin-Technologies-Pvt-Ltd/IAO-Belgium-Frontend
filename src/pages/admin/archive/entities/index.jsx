import { useNavigate } from "@tanstack/react-router";
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
import { useArchiveEntities } from "@/store/useArchiveStore";
import ArchiveGate from "../components/ArchiveGate";

//* The 64 "archive" entities CoachView exposed that the migration captured
//* verbatim but never transformed into the new system's models (see backend
//* coachview.entities.js ARCHIVE_ENTITIES). This is a last-resort browser for
//* anything not covered by the Students / Programmes / Cohorts / Invoices views.
const ArchiveEntities = () => {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useArchiveEntities();
  const entities = data?.data || [];

  return (
    <ArchiveGate>
      <div className="space-y-6 mt-4">
        <div>
          <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
            All CoachView entities <span className="text-sm font-normal text-gray-400">(raw archive browser)</span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-white/60">
            Every remaining CoachView table, captured but not migrated into the new system. Use this only when the
            dedicated Students / Programmes / Cohorts / Invoices pages don't cover what you're looking for.
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entity</TableHead>
              <TableHead>Row count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton rows={8} columns={2} />
            ) : error ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center p-8">
                  <ErrorMessage message={error?.message || "Failed to load entities"} onRetry={refetch} variant="inline" />
                </TableCell>
              </TableRow>
            ) : (
              entities.map((e) => (
                <TableRow
                  key={e.entity}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate({ to: "/admin/archive/entities/$entity", params: { entity: e.entity } })}
                >
                  <TableCell className="font-medium capitalize">{e.entity}</TableCell>
                  <TableCell>{e.row_count ?? 0}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </ArchiveGate>
  );
};

export default ArchiveEntities;
