import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  Users,
  UserCircle,
  History,
  Briefcase,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

const REPORT_CARDS = [
  {
    key: "all",
    titleKey: "finance.reports.all.title",
    descriptionKey: "finance.reports.all.description",
    icon: LayoutDashboard,
    iconColor: "#3b82f6",
    bgColor: "rgba(59,130,246,0.08)",
    accentColor: "#3b82f6",
    path: "/admin/finance-reports/all",
  },
  {
    key: "city",
    titleKey: "finance.reports.city.title",
    descriptionKey: "finance.reports.city.description",
    icon: Building2,
    iconColor: "#22c55e",
    bgColor: "rgba(34,197,94,0.08)",
    accentColor: "#22c55e",
    path: "/admin/finance-reports/city",
  },
  {
    key: "program",
    titleKey: "finance.reports.program.title",
    descriptionKey: "finance.reports.program.description",
    icon: GraduationCap,
    iconColor: "#ff8904",
    bgColor: "rgba(255,137,4,0.08)",
    accentColor: "#ff8904",
    path: "/admin/finance-reports/program",
  },
  {
    key: "batch",
    titleKey: "finance.reports.batch.title",
    descriptionKey: "finance.reports.batch.description",
    icon: Users,
    iconColor: "#8b5cf6",
    bgColor: "rgba(139,92,246,0.08)",
    accentColor: "#8b5cf6",
    path: "/admin/finance-reports/batch",
  },
  {
    key: "student",
    titleKey: "finance.reports.student.title",
    descriptionKey: "finance.reports.student.description",
    icon: UserCircle,
    iconColor: "#ef4444",
    bgColor: "rgba(239,68,68,0.08)",
    accentColor: "#ef4444",
    path: "/admin/finance-reports/student",
  },
  {
    key: "transactions",
    titleKey: "finance.reports.transactions.title",
    descriptionKey: "finance.reports.transactions.description",
    icon: History,
    iconColor: "#06b6d4",
    bgColor: "rgba(6,182,212,0.08)",
    accentColor: "#06b6d4",
    path: "/admin/finance-reports/transactions",
  },
  {
    key: "kmo",
    titleKey: "finance.reports.kmo.title",
    descriptionKey: "finance.reports.kmo.description",
    icon: Briefcase,
    iconColor: "#d97706",
    bgColor: "rgba(217,119,6,0.08)",
    accentColor: "#d97706",
    path: "/admin/kmo-applications",
  },
];

const FinanceManagement = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          {t("finance.title")}
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
                  {t(card.titleKey)}
                </h3>
                <p style={{
                  fontSize: 13,
                  color: "#94a3b8",
                  lineHeight: 1.4,
                }}>
                  {t(card.descriptionKey)}
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