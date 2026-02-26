import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

const AnalyticsChartView = ({ data, isLoading, error, labelKey, labelFn, title }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        Failed to load analytics data
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No analytics data available
      </div>
    );
  }

  const splitLabel = (str) => {
    if (str.length <= 18) return [str];
    const mid = Math.floor(str.length / 2);
    const spaceAfter = str.indexOf(" ", mid);
    const spaceBefore = str.lastIndexOf(" ", mid);
    const splitAt = spaceAfter !== -1 ? spaceAfter : spaceBefore !== -1 ? spaceBefore : mid;
    return [str.slice(0, splitAt), str.slice(splitAt + 1)];
  };

  const CustomTick = ({ x, y, payload }) => {
    const lines = splitLabel(payload.value);
    return (
      <g transform={`translate(${x},${y})`}>
        {lines.map((line, i) => (
          <text
            key={i}
            x={0}
            y={i * 14}
            dy={12}
            textAnchor="middle"
            fontSize={11}
            fill="currentColor"
          >
            {line}
          </text>
        ))}
      </g>
    );
  };

  const getLabel = (item) =>
    labelFn ? labelFn(item) : item[labelKey] || "Unknown";

  const chartData = data.map((item) => ({
    name: getLabel(item),
    total_amount: item.total_amount,
    admission_fee: item.admission_fee_amount || 0,
    module_purchase: item.module_purchase_amount || 0,
    paid: item.paid_count,
    pending: item.pending_count,
    failed: item.failed_count,
  }));

  const pieData = data.map((item) => ({
    name: getLabel(item),
    value: item.total_amount,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm text-sidebar-foreground/70">Total Revenue</p>
            <h2 className="text-2xl font-semibold text-sidebar-foreground">
              €{" "}
              {data
                .reduce((sum, item) => sum + item.total_amount, 0)
                .toFixed(2)}
            </h2>
          </div>
        </div>
        <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm text-sidebar-foreground/70">Total Transactions</p>
            <h2 className="text-2xl font-semibold text-sidebar-foreground">
              {data.reduce((sum, item) => sum + item.total_count, 0)}
            </h2>
          </div>
        </div>
        <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm text-sidebar-foreground/70">Paid Transactions</p>
            <h2 className="text-2xl font-semibold text-sidebar-foreground">
              {data.reduce((sum, item) => sum + item.paid_count, 0)}
            </h2>
          </div>
        </div>
      </div>

      {/* Bar Chart - Amount by Category */}
      <Card>
        <CardHeader>
          <CardTitle>{title} - Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="name"
                tick={<CustomTick />}
                height={55}
                interval={0}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
                formatter={(value) => [`€ ${value.toFixed(2)}`, undefined]}
              />
              <Legend />
              <Bar
                dataKey="admission_fee"
                name="Admission Fee"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="module_purchase"
                name="Module Purchase"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ percent }) =>
                    `${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={true}
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`€ ${value.toFixed(2)}`, "Revenue"]}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="name"
                  tick={<CustomTick />}
                  height={55}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="paid"
                  name="Paid"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="pending"
                  name="Pending"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="failed"
                  name="Failed"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{title.split(" ")[0]}</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Admission Fee</TableHead>
                <TableHead>Module Purchase</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Failed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={item._id || index}>
                  <TableCell className="font-medium">
                    {getLabel(item)}
                  </TableCell>
                  <TableCell>€ {item.total_amount?.toFixed(2)}</TableCell>
                  <TableCell>
                    € {(item.admission_fee_amount || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    € {(item.module_purchase_amount || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>{item.total_count}</TableCell>
                  <TableCell className="text-green-600">
                    {item.paid_count}
                  </TableCell>
                  <TableCell className="text-amber-600">
                    {item.pending_count}
                  </TableCell>
                  <TableCell className="text-red-600">
                    {item.failed_count}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsChartView;
