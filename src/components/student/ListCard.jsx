import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

const ListCard = ({ columns = [], data = [], onDownload }) => {
  return (
    <div className="bg-white/60 rounded-[6px] border border-[#EFEFEF] p-6">
      <div className="grid grid-cols-3 text-base font-semibold pb-4">
        {columns.map((col, index) => (
          <span key={index}>{col}</span>
        ))}
      </div>
      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.id} className="grid grid-cols-3 items-center">
            <div className="flex items-center gap-2 text-base">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span>{item.name}</span>
            </div>
            <div className="flex items-center gap-2 text-base">
              <FileText className="w-4 h-4 text-muted-foreground" />
              {item.size}
            </div>
            <div>
              <Button
                variant="outline"
                className="border border-foreground text-foreground"
                onClick={() => onDownload(item)}
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListCard;
