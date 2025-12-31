import { TrendingUp } from "lucide-react";

const DashboardCard = ({
  title,
  value,
  changeText,
  icon: Icon = TrendingUp,
}) => {
  return (
    <div className="bg-white rounded-xl p-5 border border-[#E4E4E7] flex justify-between items-start ">
      <div className="space-y-2">
        <p className="text-sm">{title}</p>
        <h2 className="text-2xl font-semibold">{value}</h2>
        {changeText && <p className="text-xs text-[#49BA6C]">{changeText}</p>}
      </div>

      <div className="text-muted-foreground">
        <Icon size={18}strokeWidth={2} />
      </div>
    </div>
  );
};

export default DashboardCard;
