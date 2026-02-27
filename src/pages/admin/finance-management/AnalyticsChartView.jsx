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
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Label,
} from "recharts";
import { Pagination } from "@/components/ui/table/Pagination";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import ErrorMessage from "@/components/common/ErrorMessage";
import { TrendingUp, CreditCard, CheckCircle } from "lucide-react";

// ── Theme-aligned color palette ──────────────────────────────────────────────
// Primary orange: #ff8904  (--primary)
// Blue accent:    #3b82f6
// Green:          #22c55e
// Amber:          #f59e0b
// Muted:          #94a3b8
// Revenue bar 2:  #6ee7b7 (soft teal to complement blue)

const COLORS = ["#3b82f6", "#ff8904", "#22c55e", "#f59e0b", "#8b5cf6"];
const PIE_OTHERS_COLOR = "#94a3b8";

// ── Custom Tooltips ──────────────────────────────────────────────────────────

const TooltipWrapper = ({ children }) => (
  <div style={{
    background: "var(--sidebar, #fff)",
    border: "1px solid var(--sidebar-border, #e8edf3)",
    borderRadius: 12,
    padding: "12px 16px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
    fontSize: 13,
    minWidth: 150,
  }}>
    {children}
  </div>
);

const CustomTooltipRevenue = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <TooltipWrapper>
      <p style={{ fontWeight: 700, marginBottom: 8, color: "var(--sidebar-foreground, #1e293b)" }}>{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 3 }}>
          <span style={{ color: "#94a3b8" }}>{entry.name}</span>
          <span style={{ fontWeight: 600, color: "var(--sidebar-foreground, #1e293b)" }}>EUR {Number(entry.value).toFixed(2)}</span>
        </div>
      ))}
    </TooltipWrapper>
  );
};

const CustomTooltipStatus = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <TooltipWrapper>
      <p style={{ fontWeight: 700, marginBottom: 8, color: "var(--sidebar-foreground, #1e293b)" }}>{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 3 }}>
          <span style={{ color: "#94a3b8" }}>{entry.name}</span>
          <span style={{ fontWeight: 600, color: "var(--sidebar-foreground, #1e293b)" }}>{entry.value}</span>
        </div>
      ))}
    </TooltipWrapper>
  );
};

const CustomTooltipPie = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <TooltipWrapper>
      <p style={{ fontWeight: 700, color: "var(--sidebar-foreground, #1e293b)", marginBottom: 4 }}>{payload[0].name}</p>
      <p style={{ color: "#94a3b8" }}>
        EUR <span style={{ fontWeight: 600, color: "var(--sidebar-foreground, #1e293b)" }}>{Number(payload[0].value).toFixed(2)}</span>
      </p>
    </TooltipWrapper>
  );
};

// ── Axis Tick ────────────────────────────────────────────────────────────────

const splitLabel = (str) => {
  if (!str || str.length <= 16) return [str];
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
        <text key={i} x={0} y={i * 14} dy={12} textAnchor="middle" fontSize={11} fill="#94a3b8">
          {line}
        </text>
      ))}
    </g>
  );
};

// ── Donut center label ───────────────────────────────────────────────────────

const DonutCenter = ({ viewBox, total }) => {
  const { cx, cy } = viewBox;
  const fmt = total >= 1000 ? `EUR ${(total / 1000).toFixed(1)}k` : `EUR ${total.toFixed(0)}`;
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fontSize={11} fill="#94a3b8" fontWeight={500}>Total</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize={17} fill="var(--sidebar-foreground, #1e293b)" fontWeight={800}>{fmt}</text>
    </g>
  );
};

// ── Legends ──────────────────────────────────────────────────────────────────

const InlineLegend = ({ items }) => (
  <div className="flex gap-4 pl-2 pt-2">
    {items.map((l) => (
      <div key={l.label} className="flex items-center gap-2 text-xs text-sidebar-foreground/70">
        <span className="w-2.5 h-2.5 rounded-[3px] inline-block" style={{ background: l.color }} />
        {l.label}
      </div>
    ))}
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────

const AnalyticsChartView = ({
  data,
  tableData,
  totalCount,
  page,
  limit,
  onPageChange,
  setLimit,
  isLoading,
  error,
  labelKey,
  labelFn,
  title,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--primary, #ff8904)" }} />
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

  const getLabel = (item) => labelFn ? labelFn(item) : item[labelKey] || "Unknown";

  const totalRevenue = data.reduce((sum, item) => sum + item.total_amount, 0);
  const totalTransactions = data.reduce((sum, item) => sum + item.total_count, 0);
  const totalPaid = data.reduce((sum, item) => sum + item.paid_count, 0);

  const chartData = data.map((item) => ({
    name: getLabel(item),
    admission_fee: item.admission_fee_amount || 0,
    module_purchase: item.module_purchase_amount || 0,
    paid: item.paid_count,
    pending: item.pending_count,
    failed: item.failed_count,
  }));

  // Pie: top 5 non-zero + "Others"
  const sortedNonZero = [...data].filter((i) => i.total_amount > 0).sort((a, b) => b.total_amount - a.total_amount);
  const top5 = sortedNonZero.slice(0, 5);
  const othersAmt = sortedNonZero.slice(5).reduce((s, i) => s + i.total_amount, 0);
  const pieData = [
    ...top5.map((item) => ({ name: getLabel(item), value: item.total_amount })),
    ...(othersAmt > 0 ? [{ name: "Others", value: othersAmt }] : []),
  ];
  const pieColors = [...COLORS, PIE_OTHERS_COLOR];

  const displayTableData = tableData || data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>

        {/* Revenue — primary orange gradient (matches --primary: #ff8904) */}
        <div style={{
          background: "linear-gradient(135deg, #e07500 0%, #ff8904 55%, #ffaa44 100%)",
          borderRadius: 20,
          padding: "24px 26px",
          boxShadow: "0 6px 24px rgba(255,137,4,0.32)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
              Total Revenue
            </p>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1.1 }}>
              EUR {totalRevenue.toLocaleString("en-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.20)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <TrendingUp size={22} color="#fff" />
          </div>
        </div>

        {/* Transactions */}
        <div style={{
          background: "var(--sidebar, #fff)",
          border: "1px solid var(--sidebar-border, #e8edf3)",
          borderRadius: 20,
          padding: "24px 26px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
              Total Transactions
            </p>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "var(--sidebar-foreground, #1e293b)", letterSpacing: "-0.025em", lineHeight: 1.1 }}>
              {totalTransactions.toLocaleString()}
            </h2>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#fff4e8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CreditCard size={22} color="#ff8904" />
          </div>
        </div>

        {/* Paid */}
        <div style={{
          background: "var(--sidebar, #fff)",
          border: "1px solid var(--sidebar-border, #e8edf3)",
          borderRadius: 20,
          padding: "24px 26px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
              Paid Transactions
            </p>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "var(--sidebar-foreground, #1e293b)", letterSpacing: "-0.025em", lineHeight: 1.1 }}>
              {totalPaid.toLocaleString()}
            </h2>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CheckCircle size={22} color="#22c55e" />
          </div>
        </div>
      </div>

      {/* ── Revenue Breakdown ─────────────────────────────────────────────── */}
      <Card className="bg-sidebar rounded-xl p-5 border border-sidebar-border shadow-none">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-lg font-semibold text-sidebar-foreground tracking-tight">
            {title} — Revenue Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} barCategoryGap="35%" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={<CustomTick />} height={52} interval={0} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `EUR ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
              <Tooltip content={<CustomTooltipRevenue />} cursor={{ fill: "rgba(241,245,249,0.55)", radius: 8 }} />
              <Bar dataKey="admission_fee" name="Admission Fee" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={40} />
              <Bar dataKey="module_purchase" name="Module Purchase" fill="#ff8904" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
          <InlineLegend items={[{ color: "#3b82f6", label: "Admission Fee" }, { color: "#ff8904", label: "Module Purchase" }]} />
        </CardContent>
      </Card>

      {/* ── Donut + Payment Status ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[5fr_8fr] gap-[24px]">

        {/* Donut */}
        <Card className="bg-sidebar rounded-xl p-5 border border-sidebar-border shadow-none">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-lg font-semibold text-sidebar-foreground tracking-tight">
              Revenue Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={3}
                  dataKey="value"
                  labelLine={false}
                  label={false}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} stroke="none" />
                  ))}
                  <Label content={<DonutCenter total={totalRevenue} />} position="center" />
                </Pie>
                <Tooltip content={<CustomTooltipPie />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card className="bg-sidebar rounded-xl p-5 border border-sidebar-border shadow-none flex flex-col">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-lg font-semibold text-sidebar-foreground tracking-tight">
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} barCategoryGap="32%" barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={<CustomTick />} height={52} interval={0} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltipStatus />} cursor={{ fill: "rgba(241,245,249,0.55)", radius: 8 }} />
                <Bar dataKey="paid" name="Paid" fill="#22c55e" radius={[6, 6, 0, 0]} maxBarSize={36} />
                <Bar dataKey="pending" name="Pending" fill="#ff8904" radius={[6, 6, 0, 0]} maxBarSize={36} />
                <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
            <InlineLegend items={[{ color: "#22c55e", label: "Paid" }, { color: "#ff8904", label: "Pending" }, { color: "#ef4444", label: "Failed" }]} />
          </CardContent>
        </Card>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Detailed Data</h3>
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
          <TableBody className={isLoading ? "opacity-50 pointer-events-none" : ""}>
            {isLoading && displayTableData.length === 0 ? (
              <TableSkeleton rows={limit || 10} columns={8} />
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center p-8">
                  <ErrorMessage message={error?.message || "Failed to load analytic data"} variant="inline" />
                </TableCell>
              </TableRow>
            ) : displayTableData?.length > 0 ? (
              displayTableData.map((item, index) => (
                <TableRow key={item._id || index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <TableCell className="font-medium">{getLabel(item)}</TableCell>
                  <TableCell>EUR {item.total_amount?.toFixed(2)}</TableCell>
                  <TableCell>EUR {(item.admission_fee_amount || 0).toFixed(2)}</TableCell>
                  <TableCell>EUR {(item.module_purchase_amount || 0).toFixed(2)}</TableCell>
                  <TableCell>{item.total_count}</TableCell>
                  <TableCell className="text-green-600">{item.paid_count}</TableCell>
                  <TableCell style={{ color: "#ff8904" }}>{item.pending_count}</TableCell>
                  <TableCell className="text-red-600">{item.failed_count}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center">No analytics data found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {onPageChange && totalCount > 0 && limit > 0 && (
          <div className="mt-4">
            <Pagination
              page={page}
              setPage={onPageChange}
              rowsPerPage={limit}
              setRowsPerPage={setLimit || (() => {})}
              totalRows={totalCount}
              selected={0}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsChartView;