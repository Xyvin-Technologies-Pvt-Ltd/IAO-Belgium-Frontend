
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const GraphHeader = ({ title }) => (
  <div className="flex items-center justify-between">
    <h3 className="text-lg font-semibold text-sidebar-foreground">{title}</h3>
    {/* date picker can go here */}
  </div>
);

const LineGraph = ({ data }) => {
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
            tick={{ fill: "hsl(var(--sidebar-foreground) / 0.7)", fontSize: 12 }}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            tick={{ fill: "hsl(var(--sidebar-foreground) / 0.5)", fontSize: 12 }}
          />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="a"
            stroke="#FB923C"
            strokeWidth={3}
            dot={{ r: 4, fill: "#fff", strokeWidth: 2 }}
          />

          <Line
            type="monotone"
            dataKey="b"
            stroke="#FDBA74"
            strokeWidth={3}
            dot={{ r: 4, fill: "#fff", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const DashboardGraph = ({ title, data }) => {
  return (
    <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-6">
      <GraphHeader title={title} />
      <LineGraph data={data} />
    </div>
  );
};

export default DashboardGraph;
