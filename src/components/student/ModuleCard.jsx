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
    console.log("Change location/date for module:", moduleId);
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
              className="bg-white rounded-2xl border border-[#EFEFEF] p-6"
            >
              {!showLocationChange && (
                <>
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <h3 className="text-2xl font-semibold">{module.title}</h3>
                    {!changeLocation && (
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() =>
                            console.log("Add to calendar:", module.id)
                          }
                        >
                          Add to Calendar
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => handleViewDetails(module.id)}
                        >
                          View Details
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="my-5 border-t border-gray-200" />
                </>
              )}

              <div className="flex flex-wrap lg:flex-nowrap justify-between gap-6 text-sm">
                <div className="flex items-start gap-2 text-muted-foreground">
                  <User className="w-4 h-4 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-sm">Tutor</span>
                    <span className="text-base font-semibold text-foreground">
                      {module.tutor}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-sm">Date</span>
                    <span className="text-base font-semibold text-foreground">
                      {module.date}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-sm">Time</span>
                    <span className="text-base font-semibold text-foreground">
                      {module.time}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-sm">Location</span>
                    <span
                      className={`text-base font-semibold ${
                        showLocationChange ? " text-primary" : "text-foreground"
                      } `}
                    >
                      {module.location}
                    </span>
                  </div>
                </div>
              </div>
              <div className="my-5 border-t border-gray-200" />
              {showLocationChange ? (
                <>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-start gap-4">
                    <p className="text-sm text-muted-foreground">
                      Need to attend at a different location or time?
                    </p>

                    <Button
                      variant="outline"
                      onClick={() => handleChangeLocation(module.id)}
                    >
                      Change Location/Date
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {!changeLocation && (
                    <div className="mt-5 flex justify-end items-center gap-2 text-sm">
                      <span className="text-base">Payment Status :</span>
                      <span className="px-6 py-2 rounded-[6px] bg-[#00B300]/10 text-[#00B300] font-bold">
                        Paid
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#EFEFEF] p-8 text-center">
          <p className="text-gray-500">No upcoming modules scheduled</p>
        </div>
      )}
    </div>
  );
};

export default ModuleCard;
