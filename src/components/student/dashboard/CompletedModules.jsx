import { Button } from "@/components/ui/button";
import { Calendar, MapPin, User } from "lucide-react";
import noModule from "../../../assets/images/no-module.png";
const CompletedModules = ({ modules = [] }) => {
  return (
    <div className="space-y-4">
      <div
        className={` ${
          modules.length === 0
            ? "min-h-100 bg-white/60 p-8 flex flex-col  rounded-[6px] border border-[#EFEFEF]"
            : ""
        }`}
      >
        {modules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ">
            {modules.map((module) => (
              <div
                key={module.id}
                className="bg-white/60 border border-[#EDEDED] rounded-[6px] p-6 space-y-4 hover:shadow-md transition-shadow"
              >
                <h3 className="text-2xl font-semibold leading-tight">
                  {module.title}
                </h3>

                <div className="space-y-3 text-base">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{module.tutor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{module.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{module.location}</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full border-[#0088FF] text-[#0088FF] hover:bg-[#0088FF] hover:text-white"
                  onClick={() => console.log("View details:", module.id)}
                >
                  View Details
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center text-center space-y-6">
            <div className="flex justify-center">
              <img src={noModule} alt="No Module" className="w-62.5 h-50" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <p className="text-muted-foreground text-lg">
                No modules completed yet .Your completed modules will appear
                here
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompletedModules;
