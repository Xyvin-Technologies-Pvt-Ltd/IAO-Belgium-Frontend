import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, User } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

const ModuleCard = ({
  modules = [],
  showLocationChange = false,
  changeLocation = false,
}) => {
  const navigate = useNavigate();

  const handleViewDetails = (moduleId) => {
    navigate({
      to: "/student/module/$id",
      params: { id: moduleId },
    });
  };

  const handleChangeLocation = (moduleId) => {
    navigate({
      to: "/student/change-location/$id",
      params: { id: moduleId },
    });
  };

  return (
    <div className="space-y-4">
      {modules.length > 0 ? (
        <div className="space-y-4">
          {modules.map((module) => (
            <div
              key={module.id}
              className="bg-white/60 rounded-[6px] border border-[#EFEFEF] p-4 sm:p-6"
            >
              {!showLocationChange && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <h3 className="text-lg sm:text-2xl font-semibold">
                      {module.title}
                    </h3>

                    {!changeLocation && (
                      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          className="w-full sm:w-auto"
                          onClick={() =>
                            console.log("Add to calendar:", module.id)
                          }
                        >
                          Add to Calendar
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full sm:w-auto"
                          onClick={() => handleViewDetails(module.id)}
                        >
                          View Details
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="my-4 border-t border-[#EDEDED]" />
                </>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-sm">
                <div className="flex items-start gap-2 text-muted-foreground">
                  <User className="w-4 h-4 mt-0.5" />
                  <div>
                    <p className="text-xs">Tutor</p>
                    <p className="text-base font-semibold text-foreground">
                      {module.tutor}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4 mt-0.5" />
                  <div>
                    <p className="text-xs">Date</p>
                    <p className="text-base font-semibold text-foreground">
                      {module.date}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4 mt-0.5" />
                  <div>
                    <p className="text-xs">Time</p>
                    <p className="text-base font-semibold text-foreground">
                      {module.time}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <div>
                    <p className="text-xs">Location</p>
                    <p
                      className={`text-base font-semibold ${
                        showLocationChange ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {module.location}
                    </p>
                  </div>
                </div>
              </div>

              <div className="my-4 border-t border-[#EDEDED]" />
              {showLocationChange ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    Need to attend at a different location or time?
                  </p>

                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => handleChangeLocation(module.id)}
                  >
                    Change Location / Date
                  </Button>
                </div>
              ) : (
                !changeLocation && (
                  <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-3 text-sm">
                    <span className="text-base">Payment Status :</span>
                    <span className="px-4 py-2 rounded-[6px] bg-[#00B300]/10 text-[#00B300] font-bold text-center">
                      Paid
                    </span>
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/60 rounded-[6px] border border-[#EFEFEF] p-8 text-center">
          <p className="text-gray-500">No upcoming modules scheduled</p>
        </div>
      )}
    </div>
  );
};

export default ModuleCard;
