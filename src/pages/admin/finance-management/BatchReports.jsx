import { useState, useEffect } from "react";
import {
  useGetAnalyticsByBatch,
  useGetAnalyticsByBatchList,
} from "@/store/usePaymentStore";
import AnalyticsChartView from "./AnalyticsChartView";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import CityReportsFilterDrawer from "./CityReportsFilterDrawer";
import { useTranslation } from "react-i18next";

const defaultFilters = { status: "all", purpose: "all", from: "", to: "" };

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
  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);

  useEffect(() => {
    updateBreadcrumbs([
      { label: t("common.financeReports"), path: "/admin/finance-reports", navigable: true },
      { label: t("common.batchReports") },
    ]);
    return () => updateBreadcrumbs([]);
  }, [t]);

  const queryFilters = buildQueryFilters(appliedFilters);

  const { data: chartDataFull, isLoading: isLoadingChart, error: errorChart } =
    useGetAnalyticsByBatch(queryFilters);

  const { data: tableDataFull, isLoading: isLoadingTable, error: errorTable } =
    useGetAnalyticsByBatchList({ ...queryFilters, page, limit });

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          {t("common.batchReports")}
        </h2>
        <CityReportsFilterDrawer
          draftFilters={draftFilters}
          setDraftFilters={setDraftFilters}
          appliedFilters={appliedFilters}
          setAppliedFilters={setAppliedFilters}
        />
      </div>
      <AnalyticsChartView
        data={chartDataFull?.data}
        tableData={tableDataFull?.data}
        totalCount={{
          ...chartDataFull?.total_count,
          total: tableDataFull?.total_count,
        }}
        page={page}
        limit={limit}
        onPageChange={setPage}
        setLimit={setLimit}
        isLoading={isLoadingChart || isLoadingTable}
        error={errorChart || errorTable}
        labelKey="batch_name"
        title={t("common.batch")}
      />
    </div>
  );
};

export default BatchReports;
