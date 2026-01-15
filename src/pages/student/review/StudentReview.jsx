import { Button } from "@/components/ui/button";
import { Check, Clock, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import PageHeading from "@/components/PageHeading";

const StudentReview = ({ userName = "Maria" }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    // Load current step from localStorage
    const savedStep = localStorage.getItem("currentStep");
    if (savedStep) {
      setCurrentStep(parseInt(savedStep));
    }
  }, []);

  const getStepStatus = (stepNumber, currentStep) => {
    if (stepNumber <= currentStep) return "completed";
    return "pending";
  };

  const getStepTitle = (stepNumber, status) => {
    const titles = {
      1: status === "completed" ? "Application Submitted" : "Basic Information",
      2: status === "completed" ? "Documents Submitted" : "Documents Pending",
      3: status === "completed" ? "Payment Completed" : "Payment Pending",
    };
    return titles[stepNumber];
  };

  const lastUpdated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const applicationData = {
    id: "IAO-2025-9ERQ9M",
    course: "MSc Osteopathy",
    status:
      currentStep === 3 ? "Application Complete" : "Incomplete Application",
    lastUpdated: lastUpdated,
    steps: [
      {
        number: 1,
        title: getStepTitle(1, getStepStatus(1, currentStep)),
        status: getStepStatus(1, currentStep),
      },
      {
        number: 2,
        title: getStepTitle(2, getStepStatus(2, currentStep)),
        status: getStepStatus(2, currentStep),
      },
      {
        number: 3,
        title: getStepTitle(3, getStepStatus(3, currentStep)),
        status: getStepStatus(3, currentStep),
      },
    ],
  };

  const handleContinueApplication = () => {
    // Navigate back to application form
    navigate({ to: "/application" });
  };

  return (
    <div className="min-h-screen ">
      <PageHeading userName={userName} />

      <div className=" px-15  mx-auto space-y-6 mt-8">
        <div className="bg-white rounded-2xl border border-[#EFEFEF] p-6 space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-[#FFB200]/10 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-[#006499] font-semibold text-xl">
              {applicationData.course}
            </p>
            <h2 className="text-3xl font-semibold">{applicationData.status}</h2>
            <p className="text-muted-foreground text-lg">
              Your application is currently incomplete
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 border-t border-b border-[#EDEDED]">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">
                Application ID
              </p>
              <div className="flex items-center gap-2 mt-1">
                <p className="font-semibold text-base">{applicationData.id}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-muted-foreground">
                Last updated on
              </p>
              <p className="font-semibold text-base mt-1">
                {applicationData.lastUpdated}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-base">
           Your Application Progress:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {applicationData.steps.map((step) => (
                <div
                  key={step.number}
                  className={`p-4 rounded-2xl  ${
                    step.status === "completed"
                      ? "bg-[#EBFFF1]"
                      : "bg-[#F0ECEA]"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.status === "completed"
                          ? "bg-[#77CC00]"
                          : "bg-[#E3DFDC]"
                      }`}
                    >
                      {step.status === "completed" ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : (
                        <Clock className="w-5 h-5 text-[#B1AAA4]" />
                      )}
                    </div>
                    <p
                      className={`text-sm ${
                        step.status === "completed"
                          ? ""
                          : "text-muted-foreground"
                      }`}
                    >
                      Step {step.number}
                    </p>
                    <p
                      className={`font-semibold text-sm ${
                        step.status === "completed"
                          ? ""
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center pt-4">
            <Button onClick={handleContinueApplication}>
             Continue Application
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentReview;
