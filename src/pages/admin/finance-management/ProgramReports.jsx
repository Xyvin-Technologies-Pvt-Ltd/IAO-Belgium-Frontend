import { useEffect, useState } from "react";
import { useGetAnalyticsByProgram } from "@/store/usePaymentStore";
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

const ProgramReports = () => {
  const { updateBreadcrumbs } = useBreadcrumb();
  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);

  const { data, isLoading, error } = useGetAnalyticsByProgram(buildQueryFilters(appliedFilters));

  useEffect(() => {
    updateBreadcrumbs([
      { label: "Dashboard", path: "/admin/dashboard", navigable: false },
      { label: "Finance Reports", path: "/admin/finance-reports", navigable: true },
      { label: "Program Reports" },
    ]);
    return () => updateBreadcrumbs([]);
  }, []);

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          Program Reports
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
        labelKey="program_name"
        labelFn={(item) => {
          const parts = [item.program_name || "Unknown"];
          const details = [item.city_name, item.language_name].filter(Boolean);
          if (details.length > 0) parts.push(`(${details.join(" - ")})`);
          return parts.join(" ");
        }}
        title="Program"
      />
    </div>
  );
};

export default ProgramReports;
