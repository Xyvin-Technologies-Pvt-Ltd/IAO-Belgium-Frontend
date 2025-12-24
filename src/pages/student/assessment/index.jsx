import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import ExamList from "./ExamList";
import Certificates from "./Certificates";

const Assessment = () => {
  const [activeTab, setActiveTab] = useState("exams");

  return (
    <div className="space-y-6 px-15 pt-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8 border-b border-[#EDEDED]">
          <button
            onClick={() => setActiveTab("exams")}
            className={`pb-3 text-sm font-medium transition ${
              activeTab === "exams"
                ? " border-b-2 border-foreground"
                : "text-muted-foreground hover:text-black"
            }`}
          >
            Exams
          </button>

          <button
            onClick={() => setActiveTab("certificates")}
            className={`pb-3 text-base font-medium transition ${
              activeTab === "certificates"
                ? "text-black border-b-2 border-black"
                : "text-muted-foreground hover:text-black"
            }`}
          >
            Certificates
          </button>
        </div>
        <Button variant="outline">
          Filter
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
      </div>

      <div>
        {activeTab === "exams" && <ExamList />}
        {activeTab === "certificates" && <Certificates />}
      </div>
    </div>
  );
};

export default Assessment;
