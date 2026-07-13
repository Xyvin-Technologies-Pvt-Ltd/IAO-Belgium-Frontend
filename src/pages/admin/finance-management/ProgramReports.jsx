import { useState, useEffect } from "react";
import {
  useGetAnalyticsByProgram,
  useGetAnalyticsByProgramList,
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

const ProgramReports = () => {
  const { t } = useTranslation();
  const { updateBreadcrumbs } = useBreadcrumb();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);

  useEffect(() => {
    updateBreadcrumbs([
      { label: t("common.financeReports"), path: "/admin/finance-reports", navigable: true },
      { label: t("common.programReports") },
    ]);
    return () => updateBreadcrumbs([]);
  }, [t]);

  useEffect(() => {
    setPage(1);
  }, [appliedFilters]);

  const queryFilters = buildQueryFilters(appliedFilters);

  const { data: chartDataFull, isLoading: isLoadingChart, error: errorChart } =
    useGetAnalyticsByProgram(queryFilters);

  const { data: tableDataFull, isLoading: isLoadingTable, error: errorTable } =
    useGetAnalyticsByProgramList({ ...queryFilters, page, limit });

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
          {t("common.programReports")}
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
        labelKey="program_name"
        labelFn={(item) => {
          const parts = [item.program_name || t("common.unknown")];
          const details = [item.city_name, item.language_name].filter(Boolean);
          if (details.length > 0) parts.push(`(${details.join(" - ")})`);
          return parts.join(" ");
        }}
        title={t("common.program")}
      />
    </div>
  );
};

export default ProgramReports;
