import { isValidElement } from "react";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function renderActionIcon(icon) {
  if (!icon) return null;
  // Callers may pass either a lucide component (Edit) or JSX (<Edit />).
  if (isValidElement(icon)) return icon;
  const Icon = icon;
  return <Icon className="size-4 shrink-0" />;
}

const RowActionMenu = ({ actions = [] }) => {
  if (actions.length === 0) return null;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map(({ label, icon, onClick, className, disabled }, idx) => (
          <DropdownMenuItem 
            key={idx} 
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              if (disabled) return;
              onClick?.(e);
            }} 
            className={className}
          >
            {renderActionIcon(icon)}
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RowActionMenu;
