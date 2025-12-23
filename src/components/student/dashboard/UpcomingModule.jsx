import { Button } from "@/components/ui/button";
import { useLanguageStore } from "@/store/useLanguageStore";
import { Calendar, Clock, MapPin, User } from "lucide-react";

const UpcomingModule = ({ modules = [] }) => {
  const { t } = useLanguageStore();

  return (
    <div className="space-y-4">
      <h2 className="text-xl">
        {t?.dashboard?.upcomingModule || "Upcoming Module"}
      </h2>

      {modules.length > 0 ? (
        <div className="space-y-4">
          {modules.map((module) => (
            <div
              key={module.id}
              className="bg-white rounded-2xl border border-[#EFEFEF] p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <h3 className="text-2xl font-semibold ">{module.title}</h3>

                <div className="flex gap-3">
                  <Button variant="outline">Add to Calendar</Button>

                  <Button variant="outline">View Details</Button>
                </div>
              </div>
              <div className="my-5 border-t border-gray-200" />
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
                     <span className="text-base font-semibold text-foreground">
                      {module.location}
                    </span>
                  </div>
                </div>
              </div>
              <div className="my-5 border-t border-gray-200" />

              <div className="mt-5 flex justify-end items-center gap-2 text-sm">
                <span className="text-base">Payment Status :</span>
                <span className="px-6 py-2 rounded-[6px] bg-[#00B300]/10 text-[#00B300] font-bold">
                  Paid
                </span>
              </div>
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

export default UpcomingModule;
