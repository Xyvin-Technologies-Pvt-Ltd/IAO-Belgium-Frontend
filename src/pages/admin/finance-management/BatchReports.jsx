import { useGetAnalyticsByBatch } from "@/store/usePaymentStore";
import AnalyticsChartView from "./AnalyticsChartView";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";

const BatchReports = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetAnalyticsByBatch({});

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: "/admin/finance-reports" })}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          Batch Reports
        </h2>
      </div>
      <AnalyticsChartView
        data={data?.data}
        isLoading={isLoading}
        error={error}
        labelKey="batch_name"
        title="Batch"
      />
    </div>
  );
};

export default BatchReports;
