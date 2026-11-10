import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { formatTZ } from "@/utils/dateUtils";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";
import {
  useGetAnalyticsByModuleList,
  useExportAnalyticsModuleCsv,
} from "@/store/usePaymentStore";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import ModuleReportsFilterDrawer, {
  EMPTY_MODULE_REPORT_FILTERS,
} from "./ModuleReportsFilterDrawer";

//* IPB-151: Module Reports — occupancy, training hours and revenue per module.

const COLUMN_COUNT = 10;

const buildQueryFilters = (filters) => {
  const query = {};
  Object.entries(filters).forEach(([key, val]) => {
    if (val && val !== "all") query[key] = val;
  });
  return query;
};

//* Session / skill-day times are stored as wall-clock UTC (see utils/dateUtils formatTZ)
const formatDate = (value) => (value ? formatTZ(value, "DD-MM-YYYY") : "-");

const ModuleReports = () => {
  const { t } = useTranslation();
  const { updateBreadcrumbs } = useBreadcrumb();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [draftFilters, setDraftFilters] = useState({ ...EMPTY_MODULE_REPORT_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState({ ...EMPTY_MODULE_REPORT_FILTERS });
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    updateBreadcrumbs([
      {
        label: t("common.financeReports"),
        path: "/admin/finance-reports",
        navigable: true,
      },
      { label: t("finance.reports.module.title", "Module Reports") },
    ]);

    return () => {
      updateBreadcrumbs([]);
    };
  }, [t]);

  const queryFilters = {
    ...buildQueryFilters(appliedFilters),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  const { data, isLoading, error, refetch, isFetching } =
    useGetAnalyticsByModuleList({ page, limit: rowsPerPage, ...queryFilters });
  const exportCsv = useExportAnalyticsModuleCsv();

  const modules = data?.data || [];
  const totalRows = data?.total_count || 0;
  const typeLabel = {
    skill_day: t("finance.moduleReports.types.skillDay", "Skill day"),
    thesis: t("finance.moduleReports.types.thesis", "Thesis"),
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          {t("finance.reports.module.title", "Module Reports")}
        </h2>
        <Button
          variant="outline"
          className="gap-2"
          disabled={exportCsv.isPending}
          onClick={() => exportCsv.mutate(queryFilters)}
        >
          <Download className="h-4 w-4" />
          {exportCsv.isPending
            ? t("common.exporting", "Exporting…")
            : t("common.exportCsv", "Export CSV")}
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Input
            placeholder={t("finance.moduleReports.search", "Search module name...")}
            className="max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ModuleReportsFilterDrawer
            draftFilters={draftFilters}
            setDraftFilters={setDraftFilters}
            appliedFilters={appliedFilters}
            setAppliedFilters={setAppliedFilters}
            setPage={setPage}
            filterOptions={data?.filter_options}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("finance.moduleReports.columns.moduleName", "Module name")}</TableHead>
              <TableHead>{t("finance.moduleReports.columns.course", "Course")}</TableHead>
              <TableHead>{t("finance.moduleReports.columns.startDate", "Start date")}</TableHead>
              <TableHead>{t("finance.moduleReports.columns.endDate", "End date")}</TableHead>
              <TableHead>{t("finance.moduleReports.columns.city", "City")}</TableHead>
              <TableHead>{t("finance.moduleReports.columns.language", "Language")}</TableHead>
              <TableHead className="text-right">{t("finance.moduleReports.columns.occupied", "Occupied")}</TableHead>
              <TableHead className="text-right">{t("finance.moduleReports.columns.freeSeats", "Free seats")}</TableHead>
              <TableHead className="text-right">{t("finance.moduleReports.columns.trainingHours", "Training hours")}</TableHead>
              <TableHead className="text-right">{t("finance.moduleReports.columns.revenue", "Revenue")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
            {isLoading ? (
              <TableSkeleton rows={rowsPerPage} columns={COLUMN_COUNT} />
            ) : error ? (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="text-center p-8">
                  <ErrorMessage
                    message={error?.message || t("finance.moduleReports.loadFailed", "Failed to load module report")}
                    onRetry={refetch}
                    variant="inline"
                  />
                </TableCell>
              </TableRow>
            ) : modules.length > 0 ? (
              modules.map((row) => (
                <TableRow key={`${row.module_type}-${row._id}`}>
                  <TableCell className="font-medium">
                    {row.module_name || "-"}
                    {(typeLabel[row.module_type] || row.group_name) && (
                      <span className="block text-xs text-muted-foreground font-normal mt-0.5">
                        {typeLabel[row.module_type] || row.group_name}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{row.course_name || "-"}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(row.start_date)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(row.end_date)}</TableCell>
                  <TableCell>{row.city_name || "-"}</TableCell>
                  <TableCell>{row.language_name || "-"}</TableCell>
                  <TableCell className="text-right">{row.occupied ?? 0}</TableCell>
                  <TableCell className="text-right">{row.free_seats ?? "-"}</TableCell>
                  <TableCell className="text-right">{row.training_hours ?? 0}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    EUR {Number(row.revenue || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="text-center">
                  {t("finance.moduleReports.empty", "No modules found")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Pagination
          page={page}
          setPage={setPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          totalRows={totalRows}
        />
      </div>
    </div>
  );
};

export default ModuleReports;
