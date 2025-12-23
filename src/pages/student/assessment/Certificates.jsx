import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

const certificatesData = [
  {
    id: 1,
    name: "Foot Exam Certificate",
    size: "23 MB",
  },
  {
    id: 2,
    name: "Knee Exam Certificate",
    size: "23 MB",
  },
];

const Certificates = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Year 1</h2>

        <button className="text-sm text-[#0088FF] font-bold underline">
          Download All
        </button>
      </div>
      <div className="bg-white/60 rounded-[6px] border border-[#EFEFEF] p-6">
        <div className="grid grid-cols-3 text-base font-semibold pb-4">
          <span>Exam Name</span>
          <span>File Size</span>
          <span>Action</span>
        </div>
        <div className="space-y-4">
          {certificatesData.map((item) => (
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
                  onClick={() => console.log("Download", item.name)}
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Certificates;
