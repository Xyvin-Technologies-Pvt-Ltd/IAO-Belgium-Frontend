import { Button } from "@/components/ui/button";
import { Download, FileText, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ListCard = ({ columns = [], data = [], isLoading = false }) => {
  const handleView = (item) => {
    if (item.url) {
      window.open(item.url, "_blank");
    }
  };

  const handleDownload = (item) => {
    if (item.url) {
      console.log(`Downloading file from: ${item.url}`);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/60 rounded-[6px] border border-[#EFEFEF] p-4 md:p-6">
        <div className="hidden md:grid md:grid-cols-3 text-base font-semibold pb-4">
          {columns.map((col, index) => (
            <Skeleton key={index} className="h-6 w-24" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="space-y-3 md:space-y-0 md:grid md:grid-cols-3 md:items-center md:gap-4"
            >
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4" />
                <Skeleton className="h-5 w-48" />
              </div>
              <Skeleton className="h-5 w-16" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-full md:w-24" />
                <Skeleton className="h-10 w-full md:w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 rounded-[6px] border border-[#EFEFEF] p-4 md:p-6">
      {/* Desktop Header - Hidden on mobile */}
      <div className="hidden md:grid md:grid-cols-3 text-base font-semibold pb-4 border-b border-gray-200">
        {columns.map((col, index) => (
          <span key={index}>{col}</span>
        ))}
      </div>

      <div className="space-y-4 md:space-y-3 mt-4 md:mt-0">
        {data.map((item) => (
          <div
            key={item._id || item.id}
            className="space-y-3 md:space-y-0 md:grid md:grid-cols-3 md:items-center md:gap-4 p-4 md:p-3 bg-white md:bg-transparent rounded-lg md:rounded-none border md:border-0 border-gray-200"
          >
            {/* File Name */}
            <div className="flex items-center gap-2 text-base">
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate font-medium md:font-normal">
                {item.name}
              </span>
            </div>

            {/* File Size */}
            <div className="text-base text-muted-foreground">
              {item.size || "—"}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="border border-foreground text-foreground w-full sm:w-auto"
                onClick={() => handleView(item)}
              >
                <Eye className="w-4 h-4" />
                View
              </Button>
              <Button
                variant="outline"
                className="border border-foreground text-foreground w-full sm:w-auto"
                onClick={() => handleDownload(item)}
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
