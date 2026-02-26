import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  Users,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

const REPORT_CARDS = [
  {
    key: "all",
    title: "All Reports",
    description: "View all payment transactions",
    icon: LayoutDashboard,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950",
    path: "/admin/finance-reports/all",
  },
//   {
//     key: "city",
//     title: "City Reports",
//     description: "Payment analytics by city",
//     icon: Building2,
//     color: "text-emerald-600",
//     bg: "bg-emerald-50 dark:bg-emerald-950",
//     path: "/admin/finance-reports/city",
//   },
//   {
//     key: "program",
//     title: "Program Reports",
//     description: "Payment analytics by program",
//     icon: GraduationCap,
//     color: "text-amber-600",
//     bg: "bg-amber-50 dark:bg-amber-950",
//     path: "/admin/finance-reports/program",
//   },
//   {
//     key: "batch",
//     title: "Batch Reports",
//     description: "Payment analytics by batch",
//     icon: Users,
//     color: "text-purple-600",
//     bg: "bg-purple-50 dark:bg-purple-950",
//     path: "/admin/finance-reports/batch",
//   },
];

const FinanceManagement = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          Finance Reports
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {REPORT_CARDS.map((card) => (
          <div
            key={card.key}
            className="bg-sidebar rounded-xl border border-sidebar-border p-6 flex flex-col items-center text-center gap-3 cursor-pointer hover:shadow-md transition-shadow duration-200"
            onClick={() => navigate({ to: card.path })}
          >
            <div className={`p-3 rounded-xl ${card.bg}`}>
              <card.icon className={`h-7 w-7 ${card.color}`} />
            </div>
            <div>
              <h3 className="font-semibold text-base">{card.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {card.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinanceManagement;
