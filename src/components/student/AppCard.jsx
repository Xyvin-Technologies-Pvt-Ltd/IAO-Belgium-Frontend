import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { FileDown } from "lucide-react";

const AppCard = ({ data }) => {
  const {
    title,
    deadline,
    status = "Ongoing",
    downloadableCount = 0,
    progress = 0,
    showVideo = false,
    videoUrl = "",
    view = false,
  } = data || {};
  const navigate = useNavigate();
  const handleViewDetails = (appId) => {
    navigate({
      to: "/student/app/$id",
      params: { id: appId },
    });
  };
  return (
    <div className="bg-white/60 rounded-[6px] border border-[#EFEFEF] p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {showVideo && videoUrl && (
          <div className="relative w-full lg:w-[320px] aspect-video rounded-xl overflow-hidden bg-black/10">
            <iframe
              src={videoUrl}
              title={title}
              className="w-full h-full rounded-xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        <div className="flex-1 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <h3 className="text-2xl font-semibold">{title}</h3>

            <div className="flex items-center gap-2 text-base">
              <span>Status :</span>
              {status === "Submitted" ? (
                <span className="px-6 py-2 rounded-[6px] bg-[#00B300]/10 text-[#00B300] font-bold text-sm">
                  {status}
                </span>
              ) : status === "Ongoing" ? (
                <span className="px-6 py-2 rounded-[6px] bg-primary/10 text-primary font-bold text-sm">
                  {status}
                </span>
              ) : (
                <span className="px-6 py-2 rounded-[6px] bg-[#B32400]/10 text-[#B32400] font-bold text-sm">
                  {status}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {status === "Ongoing" ? (
              <>
                {" "}
                <span className="px-4 py-2 rounded-[6px] bg-[#00B300]/10 text-[#00B300] font-medium">
                  Submission by {deadline}
                </span>{" "}
                <span className="text-xs">
                  Submit all entries by the deadline; late submissions won’t be
                  accepted.
                </span>
              </>
            ) : (
              <>
                <span className="px-4 py-2 rounded-[6px] bg-[#B32400]/10 text-[#B32400] font-medium">
                  Submission by {deadline}
                </span>{" "}
                <span className="text-xs">
                  You havent submitted all the files
                </span>
              </>
            )}
          </div>

          <div className="border-t border-[#EDEDED]" />
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <FileDown className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold text-base">
                {downloadableCount} downloadable content
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="font-semibold text-base">
                {progress}% completed
              </span>
            </div>
          </div>
          <div className="border-b border-[#EDEDED]" />
          {view && (
            <div className="pt-2">
              <Button
                variant="outline"
                className="px-6 text-[#0088FF] border-[#0088FF]"
                onClick={() => {
                  handleViewDetails(data.id);
                }}
              >
                View Details
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppCard;
