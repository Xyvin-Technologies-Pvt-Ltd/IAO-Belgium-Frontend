import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  Users,
  UserCircle,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

const REPORT_CARDS = [
  {
    key: "all",
    title: "All Reports",
    description: "View all payment transactions",
    icon: LayoutDashboard,
    iconColor: "#3b82f6",
    bgColor: "rgba(59,130,246,0.08)",
    accentColor: "#3b82f6",
    path: "/admin/finance-reports/all",
  },
  {
    key: "city",
    title: "City Reports",
    description: "Payment analytics by city",
    icon: Building2,
    iconColor: "#22c55e",
    bgColor: "rgba(34,197,94,0.08)",
    accentColor: "#22c55e",
    path: "/admin/finance-reports/city",
  },
  {
    key: "program",
    title: "Program Reports",
    description: "Payment analytics by program",
    icon: GraduationCap,
    iconColor: "#ff8904",
    bgColor: "rgba(255,137,4,0.08)",
    accentColor: "#ff8904",
    path: "/admin/finance-reports/program",
  },
  {
    key: "batch",
    title: "Batch Reports",
    description: "Payment analytics by batch",
    icon: Users,
    iconColor: "#8b5cf6",
    bgColor: "rgba(139,92,246,0.08)",
    accentColor: "#8b5cf6",
    path: "/admin/finance-reports/batch",
  },
  {
    key: "student",
    title: "Student Reports",
    description: "Payment analytics by student",
    icon: UserCircle,
    iconColor: "#ef4444",
    bgColor: "rgba(239,68,68,0.08)",
    accentColor: "#ef4444",
    path: "/admin/finance-reports/student",
  },
];

const FinanceManagement = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          Finance Management
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {REPORT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              onClick={() => navigate({ to: card.path })}
              className="bg-sidebar rounded-xl p-5 border border-sidebar-border flex flex-col items-center text-center gap-3 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${card.accentColor}55`;
                e.currentTarget.style.boxShadow = `0 8px 24px ${card.accentColor}18`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: card.bgColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <Icon size={26} color={card.iconColor} strokeWidth={1.8} />
              </div>
              <div>
                <h3 style={{
                  fontWeight: 700,
                  fontSize: 15,
                  color: "var(--sidebar-foreground, #1e293b)",
                  marginBottom: 4,
                }}>
                  {card.title}
                </h3>
                <p style={{
                  fontSize: 13,
                  color: "#94a3b8",
                  lineHeight: 1.4,
                }}>
                  {card.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FinanceManagement;