import { useEffect } from "react";
import { useGetAnalyticsByCity } from "@/store/usePaymentStore";
import AnalyticsChartView from "./AnalyticsChartView";
import { useBreadcrumb } from "@/context/BreadCrumbContext";

const CityReports = () => {
  const { updateBreadcrumbs } = useBreadcrumb();
  const { data, isLoading, error } = useGetAnalyticsByCity({});

  useEffect(() => {
    updateBreadcrumbs([
      { label: "Dashboard", path: "/admin/dashboard", navigable: false },
      {
        label: "Finance Reports",
        path: "/admin/finance-reports",
        navigable: true,
      },
      { label: "City Reports" },
    ]);

    return () => {
      updateBreadcrumbs([]);
    };
  }, []);

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          City Reports
        </h2>
      </div>
      <AnalyticsChartView
        data={data?.data}
        isLoading={isLoading}
        error={error}
        labelKey="city_name"
        title="City"
      />
    </div>
  );
};

export default CityReports;
