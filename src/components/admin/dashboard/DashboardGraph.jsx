
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";

const GraphHeader = ({ title }) => (
  <div className="flex items-center justify-between">
    <h3 className="text-lg font-semibold text-sidebar-foreground">{title}</h3>
    {/* date picker can go here */}
  </div>
);

const LineGraph = ({ data, showComparison = true, primaryLabel = "Count", comparisonLabel = "Previous" }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();
    
    // Watch for class changes on document element
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const axisColor = isDark ? '#ffffff' : 'hsl(var(--sidebar-foreground))';

  return (
    <div className="h-75 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
        >
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            tick={{ fill: axisColor, fontSize: 12 }}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            tick={{ fill: axisColor, fontSize: 12 }}
          />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="a"
            name={primaryLabel}
            stroke="#FB923C"
            strokeWidth={3}
            dot={{ r: 4, fill: "#fff", strokeWidth: 2 }}
          />

          {showComparison && (
            <Line
              type="monotone"
              dataKey="b"
              name={comparisonLabel}
              stroke="#FDBA74"
              strokeWidth={3}
              dot={{ r: 4, fill: "#fff", strokeWidth: 2 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const DashboardGraph = ({
  title,
  data,
  showComparison = true,
  primaryLabel = "Count",
  comparisonLabel = "Previous",
}) => {
  return (
    <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-6">
      <GraphHeader title={title} />
      <LineGraph
        data={data}
        showComparison={showComparison}
        primaryLabel={primaryLabel}
        comparisonLabel={comparisonLabel}
      />
    </div>
  );
};

export default DashboardGraph;
