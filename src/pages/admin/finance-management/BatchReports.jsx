import { useState, useEffect } from "react";
import {
  useGetAnalyticsByBatch,
  useGetAnalyticsByBatchList,
} from "@/store/usePaymentStore";
import AnalyticsChartView from "./AnalyticsChartView";
import { useBreadcrumb } from "@/context/BreadCrumbContext";

const BatchReports = () => {
  const { updateBreadcrumbs } = useBreadcrumb();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    updateBreadcrumbs([
      { label: "Dashboard", path: "/admin/dashboard", navigable: false },
      {
        label: "Finance Reports",
        path: "/admin/finance-reports",
        navigable: true,
      },
      { label: "Batch Reports" },
    ]);

    return () => {
      updateBreadcrumbs([]);
    };
  }, []);

  const {
    data: chartDataFull,
    isLoading: isLoadingChart,
    error: errorChart,
  } = useGetAnalyticsByBatch({});

  const {
    data: tableDataFull,
    isLoading: isLoadingTable,
    error: errorTable,
  } = useGetAnalyticsByBatchList({ page, limit });

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          Batch Reports
        </h2>
      </div>
      <AnalyticsChartView
        data={chartDataFull?.data}
        tableData={tableDataFull?.data}
        totalCount={tableDataFull?.total_count}
        page={page}
        limit={limit}
        onPageChange={setPage}
        setLimit={setLimit}
        isLoading={isLoadingChart || isLoadingTable}
        error={errorChart || errorTable}
        labelKey="batch_name"
        title="Batch"
      />
    </div>
  );
};

export default BatchReports;
