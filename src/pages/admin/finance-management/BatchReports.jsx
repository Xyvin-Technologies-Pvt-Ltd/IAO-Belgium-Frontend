import { useState, useEffect } from "react";
import {
  useGetAnalyticsByBatch,
  useExportAnalyticsBatchCsv,
} from "@/store/usePaymentStore";
import AnalyticsChartView from "./AnalyticsChartView";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import CityReportsFilterDrawer from "./CityReportsFilterDrawer";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Download, List } from "lucide-react";

const defaultFilters = { status: "paid", purpose: "all", from: "", to: "" };

const buildQueryFilters = (filters) => {
  const query = {};
  if (filters.status && filters.status !== "all") query.status = filters.status;
  if (filters.purpose && filters.purpose !== "all") query.purpose = filters.purpose;
  if (filters.from) query.from = filters.from;
  if (filters.to) query.to = filters.to;
  return query;
};

const BatchReports = () => {
  const { t } = useTranslation();
  const { updateBreadcrumbs } = useBreadcrumb();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [view, setView] = useState("chart");
  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);

  useEffect(() => {
    updateBreadcrumbs([
      { label: t("common.financeReports"), path: "/admin/finance-reports", navigable: true },
      { label: t("common.batchReports") },
    ]);
    return () => updateBreadcrumbs([]);
  }, [t]);

  useEffect(() => {
    setPage(1);
  }, [appliedFilters]);

  const queryFilters = buildQueryFilters(appliedFilters);

  const { data: chartDataFull, isLoading: isLoadingChart, error: errorChart } =
    useGetAnalyticsByBatch(queryFilters);

  const exportCsv = useExportAnalyticsBatchCsv();
  const chartRows = chartDataFull?.data;
  const tableRows = Array.isArray(chartRows)
    ? chartRows.slice((page - 1) * limit, page * limit)
    : [];

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          {t("common.batchReports")}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label={t("common.list", "List")}
            aria-pressed={view === "table"}
            className={view === "table" ? "bg-[#ff8904]/10" : ""}
            onClick={() => setView((current) => (current === "table" ? "chart" : "table"))}
          >
            <List className="h-4 w-4" />
          </Button>
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
          <CityReportsFilterDrawer
            draftFilters={draftFilters}
            setDraftFilters={setDraftFilters}
            appliedFilters={appliedFilters}
            setAppliedFilters={setAppliedFilters}
          />
        </div>
      </div>
      <AnalyticsChartView
        view={view}
        data={chartRows}
        tableData={tableRows}
        totalCount={{
          ...chartDataFull?.total_count,
          total: chartRows?.length ?? 0,
        }}
        page={page}
        limit={limit}
        onPageChange={setPage}
        setLimit={setLimit}
        isChartLoading={isLoadingChart}
        chartError={errorChart}
        labelKey="batch_name"
        title={t("common.batch")}
      />
    </div>
  );
};

export default BatchReports;
