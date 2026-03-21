import { useEffect, useState } from "react";
import { useGetAnalyticsByCity } from "@/store/usePaymentStore";
import AnalyticsChartView from "./AnalyticsChartView";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import CityReportsFilterDrawer from "./CityReportsFilterDrawer";

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
  const { updateBreadcrumbs } = useBreadcrumb();
  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);

  const { data, isLoading, error } = useGetAnalyticsByCity(buildQueryFilters(appliedFilters));

  useEffect(() => {
    updateBreadcrumbs([
      { label: "Dashboard", path: "/admin/dashboard", navigable: false },
      { label: "Finance Reports", path: "/admin/finance-reports", navigable: true },
      { label: "City Reports" },
    ]);
    return () => updateBreadcrumbs([]);
  }, []);

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          City Reports
        </h2>
        <CityReportsFilterDrawer
          draftFilters={draftFilters}
          setDraftFilters={setDraftFilters}
          appliedFilters={appliedFilters}
          setAppliedFilters={setAppliedFilters}
        />
      </div>
      <AnalyticsChartView
        data={data?.data}
        totalCount={data?.total_count}
        isLoading={isLoading}
        error={error}
        labelKey="city_name"
        title="City"
      />
    </div>
  );
};

export default CityReports;
