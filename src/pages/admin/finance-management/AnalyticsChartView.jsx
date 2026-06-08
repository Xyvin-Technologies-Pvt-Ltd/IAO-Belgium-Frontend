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
import { TrendingUp, CreditCard, CheckCircle } from "lucide-react";
import { ErrorMessage, LoadingState } from "@/components/common";
import { useTranslation } from "react-i18next";



const COLORS = ["#3b82f6", "#ff8904", "#22c55e", "#f59e0b", "#8b5cf6"];
const PIE_OTHERS_COLOR = "#94a3b8";


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

const DonutCenter = ({ viewBox, total, t }) => {
  const { cx, cy } = viewBox;
  const fmt = total >= 1000 ? `EUR ${(total / 1000).toFixed(1)}k` : `EUR ${total.toFixed(0)}`;
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fontSize={11} fill="#94a3b8" fontWeight={500}>{t("common.total")}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize={17} fill="var(--sidebar-foreground, #1e293b)" fontWeight={800}>{fmt}</text>
    </g>
  );
};


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
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <LoadingState text={t("finance.messages.loadingAnalytics")} size="lg" />
    );
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error?.message || t("finance.messages.loadAnalyticsFailed")} 
        variant="card" 
        showRetry={false} 
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        {t("finance.messages.noAnalyticsData")}
      </div>
    );
  }

  const getLabel = (item) => labelFn ? labelFn(item) : item[labelKey] || t("common.unknown");

  const totalRevenue = totalCount?.amount || 0;
  const totalTransactions = totalCount?.transactions || 0;
  const totalPaid = totalCount?.paid || 0;

  const top4Data = [...data]
    .sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0))
    .slice(0, 4);

  const chartData = top4Data.map((item) => ({
    name: getLabel(item),
    admission_fee: item.admission_fee_amount || 0,
    module_purchase: item.module_purchase_amount || 0,
    paid: item.paid_count,
    pending: item.pending_count,
    failed: item.failed_count,
  }));

  const sortedNonZero = [...data].filter((i) => i.total_amount > 0).sort((a, b) => b.total_amount - a.total_amount);
  const top5 = sortedNonZero.slice(0, 5);
  const othersAmt = sortedNonZero.slice(5).reduce((s, i) => s + i.total_amount, 0);
  const pieData = [
    ...top5.map((item) => ({ name: getLabel(item), value: item.total_amount })),
    ...(othersAmt > 0 ? [{ name: t("common.others"), value: othersAmt }] : []),
  ];
  const pieColors = [...COLORS, PIE_OTHERS_COLOR];

  const displayTableData = tableData || data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>

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
              {t("finance.fields.totalRevenue")}
            </p>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1.1 }}>
              EUR {totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </h2>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.20)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <TrendingUp size={22} color="#fff" />
          </div>
        </div>

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
              {t("finance.fields.totalTransactions")}
            </p>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "var(--sidebar-foreground, #1e293b)", letterSpacing: "-0.025em", lineHeight: 1.1 }}>
              {totalTransactions.toLocaleString()}
            </h2>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#fff4e8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CreditCard size={22} color="#ff8904" />
          </div>
        </div>
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
              {t("finance.fields.paidTransactions")}
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

      <Card className="bg-sidebar rounded-xl p-5 border border-sidebar-border shadow-none">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-lg font-semibold text-sidebar-foreground tracking-tight">
            {title} — {t("finance.fields.revenueBreakdown")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} barCategoryGap="35%" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={<CustomTick />} height={52} interval={0} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `EUR ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
              <Tooltip content={<CustomTooltipRevenue />} cursor={{ fill: "rgba(241,245,249,0.55)", radius: 8 }} />
              <Bar dataKey="admission_fee" name={t("finance.purposes.admissionFee")} fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={40} />
              <Bar dataKey="module_purchase" name={t("finance.purposes.modulePurchase")} fill="#ff8904" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
          <InlineLegend items={[{ color: "#3b82f6", label: t("finance.purposes.admissionFee") }, { color: "#ff8904", label: t("finance.purposes.modulePurchase") }]} />
        </CardContent>
      </Card>

      <div className="w-full">
        <Card className="bg-sidebar rounded-xl p-5 border border-sidebar-border shadow-none">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-lg font-semibold text-sidebar-foreground tracking-tight">
              {t("finance.fields.revenueDistribution")}
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
                  <Label content={<DonutCenter total={totalRevenue} t={t} />} position="center" />
                </Pie>
                <Tooltip content={<CustomTooltipPie />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">{t("finance.fields.detailedData")}</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{title.split(" ")[0]}</TableHead>
              <TableHead>{t("finance.fields.totalAmount")}</TableHead>
              <TableHead>{t("finance.purposes.admissionFee")}</TableHead>
              <TableHead>{t("finance.purposes.modulePurchase")}</TableHead>
              <TableHead>{t("common.trxCount")}</TableHead>
              <TableHead>{t("common.paid")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={isLoading ? "opacity-50 pointer-events-none" : ""}>
            {isLoading && displayTableData.length === 0 ? (
              <TableSkeleton rows={limit || 10} columns={6} />
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center p-8">
                  <ErrorMessage message={error?.message || t("finance.messages.loadAnalyticsFailed")} variant="inline" />
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
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">{t("finance.messages.noAnalyticsFound")}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {onPageChange && totalCount?.total > 0 && limit > 0 && (
          <div className="mt-4">
            <Pagination
              page={page}
              setPage={onPageChange}
              rowsPerPage={limit}
              setRowsPerPage={setLimit || (() => {})}
              totalRows={totalCount.total}
              selected={0}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsChartView;