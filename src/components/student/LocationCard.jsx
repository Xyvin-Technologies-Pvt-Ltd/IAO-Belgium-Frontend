import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, User } from "lucide-react";

const LocationCard = ({ module }) => {
  const { date, campus, seats, tutor, time, isAvailable } = module;

  return (
    <div className="bg-white/60 rounded-[6px] border border-[#EFEFEF] p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="font-medium text-foreground">{date}</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="font-medium text-foreground">{campus}</span>
          </div>

          <span
            className={`px-4 py-2 rounded-full text-xs font-semibold ${
              isAvailable
                ? "bg-[#00B300]/5 text-[#00B300]"
                : "bg-[#FF2600]/10 text-[#FF2600]"
            }`}
          >
            Available seats: {seats}
          </span>
        </div>

        <Button
          disabled={!isAvailable}
        >
          Request Switch
        </Button>
      </div>

      <div className="border-t border-gray-200" />

      <div className="flex flex-col lg:flex-row gap-8 text-sm">
        <div className="flex items-start gap-2 text-muted-foreground">
          <User className="w-4 h-4 mt-0.5" />
          <div className="flex flex-col">
            <span>Tutor</span>
            <span className="text-base font-semibold text-foreground">
              {tutor}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 text-muted-foreground">
          <Clock className="w-4 h-4 mt-0.5" />
          <div className="flex flex-col">
            <span>Time</span>
            <span className="text-base font-semibold text-foreground">
              {time}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationCard;
