import { MoreVertical, Edit, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";

const AcademicCard = ({ academic, onEdit, onDuplicate }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { name, programs_count, batches_count } = academic;

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(academic);
  };

  const handleDuplicate = (e) => {
    e.stopPropagation();
    onDuplicate(academic);
  };

  const handleCardClick = () => {
    navigate({ 
      to: "/admin/admission-administration/academics/$id", 
      params: { id: academic._id  } 
    });
  };

  return (
    <div 
      className="bg-sidebar rounded-xl border border-sidebar-border p-5 shadow-sm hover:shadow-md transition cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm text-sidebar-foreground/70">
          {t("academicManagement.card.academicYear")}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              {t("academicManagement.card.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy className="w-4 h-4 mr-2" />
              {t("academicManagement.card.duplicate")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h3 className="text-2xl font-bold mt-1 text-sidebar-foreground">{name}</h3>

      <hr className="my-4 border-sidebar-border" />

      <div className="flex items-center justify-between gap-3">
        <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
          {programs_count || 0} {t("academicManagement.card.programs")}
        </span>
        <span className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
          {batches_count || 0} {t("academicManagement.card.batches")}
        </span>
      </div>
    </div>
  );
};

export default AcademicCard;
