import { TrendingUp } from "lucide-react";

const DashboardCard = ({
  title,
  value,
  changeText,
  icon: Icon = TrendingUp,
}) => {
  return (
    <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border flex justify-between items-start">
      <div className="space-y-2">
        <p className="text-sm text-sidebar-foreground/70">{title}</p>
        <h2 className="text-2xl font-semibold text-sidebar-foreground">{value}</h2>
        {changeText && <p className="text-xs text-green-600 dark:text-green-400">{changeText}</p>}
      </div>

      <div className="text-sidebar-foreground/70">
        <Icon size={18} strokeWidth={2} />
      </div>
    </div>
  );
};

export default DashboardCard;
