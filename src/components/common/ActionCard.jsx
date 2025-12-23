import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Lock,
  Calendar,
  CircleCheck,
} from "lucide-react";

const STATUS_CONFIG = {
  completed: {
    icon: <CircleCheck className="text-[#00B300]" />,
    label: "Completed",
    badge: "Pass",
    badgeClass: "bg-[#00B300]/10 text-[#00B300]",
  },
  available: {
    icon: <Calendar className="text-primary" />,
    label: "Available",
    actionLabel: "Start",
  },
  locked: {
    icon: <Lock className="text-muted-foreground" />,
    label: "Locked",
  },
};

const ActionCard = ({
  indexLabel, // e.g. "Item 1", "Module 2", "Task A"
  title, // main title
  status = "locked", // completed | available | locked
  onViewDetails, // optional
  onPrimaryAction, // optional (start / continue / retry)
}) => {
  const config = STATUS_CONFIG[status];

  return (
    <Card className="rounded-2xl border border-[#ECECEC] bg-white/60 shadow-sm">
      <CardContent className="p-6 space-y-4 ">
        <div className="flex items-start justify-between">
          <div>
            {indexLabel && (
              <p className="text-sm text-muted-foreground font-semibold">
                {indexLabel}
              </p>
            )}
            <h3 className="text-base font-semibold">{title}</h3>
          </div>

          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="text-sm text-primary font-bold underline"
            >
              View Details
            </button>
          )}
        </div>

        <div className="border-t border-gray-200" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {config.icon}
            <span className="text-sm">{config.label}</span>
          </div>

          {status === "completed" && (
            <span
              className={`px-6 py-2 rounded-[14px] text-sm font-bold ${config.badgeClass}`}
            >
              {config.badge}
            </span>
          )}

          {status === "available" && onPrimaryAction && (
            <Button onClick={onPrimaryAction}>{config.actionLabel}</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActionCard;
