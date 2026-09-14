import { TrendingUp } from "lucide-react";

const DashboardCard = ({
  title,
  value,
  changeText,
  icon: Icon = TrendingUp,
  subtitle,
  className = "",
}) => {
  return (
    <div
      className={`bg-sidebar rounded-xl p-5 border border-sidebar-border flex justify-between items-start h-full w-full ${className}`}
    >
      <div className="space-y-2 flex flex-col justify-between flex-1 h-full">
        <div>
          <p className="text-sm text-sidebar-foreground/70">{title}</p>
          <h2 className="text-2xl font-semibold text-sidebar-foreground">{value}</h2>
        </div>
        {(subtitle || changeText) && (
          <div className="mt-auto pt-2">
            {subtitle && (
              <p className="text-xs text-sidebar-foreground/60">{subtitle}</p>
            )}
            {changeText && (
              <p className="text-xs text-green-600 dark:text-green-400">{changeText}</p>
            )}
          </div>
        )}
      </div>

      <div className="text-sidebar-foreground/70 shrink-0 ml-2">
        <Icon size={18} strokeWidth={2} />
      </div>
    </div>
  );
};

export default DashboardCard;
