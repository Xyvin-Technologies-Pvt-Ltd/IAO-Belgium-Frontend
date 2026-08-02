import { useNavigate } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import SortableTableHead from "@/components/ui/table/SortableTableHead";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useClientTableSort } from "@/hooks/useClientTableSort";
import { useArchiveEntities } from "@/store/useArchiveStore";
import ArchiveGate from "../components/ArchiveGate";

//* CORE entities that already have a dedicated, curated page — clicking these
//* goes there instead of the raw JSON browser.
const DEDICATED_PAGES = {
  personen: "/admin/archive/students",
  opleidingssoorten: "/admin/archive/programmes",
  opleidingen: "/admin/archive/cohorts",
  facturen: "/admin/archive/invoices",
};

const ENTITY_ACCESSORS = {
  entity: (e) => e.entity,
  what: (e) => e.label_en,
  count: (e) => e.row_count,
};

const EntityGroup = ({ title, entities, navigate }) => {
  const sort = useClientTableSort(entities, { defaultKey: "entity", accessors: ENTITY_ACCESSORS });

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-dashboard-text dark:text-white">
        {title} <span className="font-normal text-gray-400">({entities.length})</span>
      </h3>
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead sortKey="entity" activeKey={sort.sortBy} order={sort.sortOrder} onSort={sort.handleSort}>
              Entiteit <span className="opacity-60">(Entity)</span>
            </SortableTableHead>
            <SortableTableHead sortKey="what" activeKey={sort.sortBy} order={sort.sortOrder} onSort={sort.handleSort}>
              Wat het is <span className="opacity-60">(What it is)</span>
            </SortableTableHead>
            <SortableTableHead sortKey="count" activeKey={sort.sortBy} order={sort.sortOrder} onSort={sort.handleSort} align="right">
              Aantal rijen <span className="opacity-60">(Row count)</span>
            </SortableTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sort.sorted.map((e) => {
            const dedicated = DEDICATED_PAGES[e.entity];
            return (
              <TableRow
                key={e.entity}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() =>
                  navigate(
                    dedicated
                      ? { to: dedicated }
                      : { to: "/admin/archive/entities/$entity", params: { entity: e.entity } },
                  )
                }
              >
                <TableCell className="font-medium capitalize">
                  <span className="flex items-center gap-1.5">
                    {e.entity}
                    {dedicated && <ExternalLink className="h-3 w-3 text-gray-400" />}
                  </span>
                </TableCell>
                <TableCell className="text-gray-500 dark:text-white/60" title={e.description_en}>
                  {e.label_en}
                </TableCell>
                <TableCell className="text-right">{e.row_count ?? 0}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

//* The 82 raw CoachView entities (18 CORE + 64 archive-only) captured by the
//* migration. CORE entities are the ones the app's curated pages are built
//* from; archive-only ones were never transformed into new models.
const ArchiveEntities = () => {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useArchiveEntities();
  const entities = data?.data || [];
  const core = entities.filter((e) => e.group === "core");
  const archiveOnly = entities.filter((e) => e.group === "archive");

  return (
    <ArchiveGate>
      <div className="space-y-6 mt-4">
        <div>
          <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
            All CoachView entities <span className="text-sm font-normal text-gray-400">(raw archive browser)</span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-white/60">
            Every CoachView table the migration captured. Entities marked <ExternalLink className="inline h-3 w-3" /> have a
            dedicated curated page — click through there instead of the raw JSON browser when one exists.
          </p>
        </div>

        {isLoading ? (
          <Table>
            <TableBody>
              <TableSkeleton rows={8} columns={3} />
            </TableBody>
          </Table>
        ) : error ? (
          <ErrorMessage message={error?.message || "Failed to load entities"} onRetry={refetch} variant="card" />
        ) : (
          <div className="space-y-8">
            <EntityGroup title="Gemigreerde entiteiten (Migrated entities)" entities={core} navigate={navigate} />
            <EntityGroup title="Alleen-archief entiteiten (Archive-only entities)" entities={archiveOnly} navigate={navigate} />
          </div>
        )}
      </div>
    </ArchiveGate>
  );
};

export default ArchiveEntities;
