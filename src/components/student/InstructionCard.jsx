import { Lightbulb } from "lucide-react";

const InstructionCard = ({ data }) => {
  const { description, points = [], email } = data || {};

  return (
    <div className="bg-white/60 rounded-[6px] border border-[#EFEFEF] p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold">Instructions</h3>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}

        {points.length > 0 && (
          <ul className="space-y-2 pl-5 text-sm">
            {points.map((point, index) => (
              <li
                key={index}
                className="list-disc marker:text-primary text-muted-foreground"
              >
                {point}
              </li>
            ))}
          </ul>
        )}
        {email && (
          <p className="text-sm text-muted-foreground">
            We will send updates to {email}.
          </p>
        )}
      </div>
    </div>
  );
};

export default InstructionCard;
