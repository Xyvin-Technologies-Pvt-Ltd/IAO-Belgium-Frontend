import { useState, useEffect } from "react";
import {
  useGetAnalyticsByCity,
  useGetAnalyticsByCityList,
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

const CityReports = () => {
  const { t } = useTranslation();
  const { updateBreadcrumbs } = useBreadcrumb();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);

  useEffect(() => {
    updateBreadcrumbs([
      { label: t("common.financeReports"), path: "/admin/finance-reports", navigable: true },
      { label: t("common.cityReports") },
    ]);
    return () => updateBreadcrumbs([]);
  }, [t]);

  useEffect(() => {
    setPage(1);
  }, [appliedFilters]);

  const queryFilters = buildQueryFilters(appliedFilters);

  const { data: chartDataFull, isLoading: isLoadingChart, error: errorChart } =
    useGetAnalyticsByCity(queryFilters);

  const { data: tableDataFull, isLoading: isLoadingTable, error: errorTable } =
    useGetAnalyticsByCityList({ ...queryFilters, page, limit });

  const chartData = chartDataFull?.data;
  const listAvailable = !errorTable && Array.isArray(tableDataFull?.data);
  const tableRows = listAvailable
    ? tableDataFull.data
    : chartData?.slice((page - 1) * limit, page * limit);
  const tableTotal = listAvailable
    ? tableDataFull.total_count
    : chartData?.length ?? 0;

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          {t("common.cityReports")}
        </h2>
        <CityReportsFilterDrawer
          draftFilters={draftFilters}
          setDraftFilters={setDraftFilters}
          appliedFilters={appliedFilters}
          setAppliedFilters={setAppliedFilters}
        />
      </div>
      <AnalyticsChartView
        data={chartData}
        tableData={tableRows}
        totalCount={{
          ...chartDataFull?.total_count,
          total: tableTotal,
        }}
        page={page}
        limit={limit}
        onPageChange={setPage}
        setLimit={setLimit}
        isChartLoading={isLoadingChart}
        isTableLoading={listAvailable && isLoadingTable}
        chartError={errorChart}
        tableError={listAvailable ? errorTable : null}
        labelKey="city_name"
        title={t("common.city")}
      />
    </div>
  );
};

export default CityReports;
