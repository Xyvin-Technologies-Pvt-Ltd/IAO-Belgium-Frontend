import { User, FileText, CreditCard, Check } from "lucide-react";

const ApplicationHeader = ({ currentStep = 1 }) => {
  const steps = [
    { id: 1, label: "Basic Informations", icon: User },
    { id: 2, label: "Documents", icon: FileText },
    { id: 3, label: "Payment", icon: CreditCard },
  ];

  return (
    <div className="mb-8">
      <h1 className="text-4xl font-semibold">
        Msc Osteopathy- Application form
      </h1>
      <p className="text-lg text-muted-foreground mt-1">
        Let’s complete your application
      </p>

      <div className="flex items-center mt-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <div key={step.id} className="flex items-start w-full last:w-auto">
              <div className="flex flex-col items-center">
                <div className="relative flex items-center justify-center">
                  {isActive ? (
                    <div className="h-9 w-9 rounded-full border border-[#0162DD] flex items-center justify-center">
                      <div className="h-7 w-7 rounded-full bg-[#0162DD] flex items-center justify-center">
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  ) : isCompleted ? (
                    <div className="h-10 w-10 rounded-full bg-[#00B300] flex items-center justify-center">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full border-2 border-[#A1AEBE] flex items-center justify-center">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <span
                  className={`text-sm mt-2 text-center ${
                    isActive
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index !== steps.length - 1 && (
                <div className="flex-1 flex items-center mt-4.5 mx-4">
                  <div
                    className={`h-0.5 w-full ${
                      step.id < currentStep ? "bg-[#00B300]" : "bg-[#A1AEBE]"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ApplicationHeader;
