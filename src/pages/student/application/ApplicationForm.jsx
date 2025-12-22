import { useState } from "react";
import StepOne from "../steps/StepOne";
import StepTwo from "../steps/StepTwo";
import StepThree from "../steps/StepThree";
import ApplicationHeader from "./ApplicationHeader";

const ApplicationForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationData, setApplicationData] = useState({});

  const handleNext = (stepData) => {
    // Save step data
    setApplicationData(prev => ({ ...prev, ...stepData }));
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      console.log(`➡️ Move to Step ${currentStep + 1}`);
    }
  };



  const handleSaveAndLogout = () => {
    console.log("🔐 Saved & Logged out");
  };

  const handleFinalSubmit = () => {
    console.log("🎉 Application submitted successfully!", applicationData);
    // Handle final submission logic here
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepOne 
            onNext={handleNext} 
            onSaveAndLogout={handleSaveAndLogout}
            applicationData={applicationData}
          />
        );
      case 2:
        return (
          <StepTwo 
            onNext={handleNext} 
            onSaveAndLogout={handleSaveAndLogout}
            applicationData={applicationData}
          />
        );
      case 3:
        return (
          <StepThree 
            onSubmit={handleFinalSubmit}
            onSaveAndLogout={handleSaveAndLogout}
            applicationData={applicationData}
          />
        );
      default:
        return (
          <StepOne 
            onNext={handleNext} 
            onSaveAndLogout={handleSaveAndLogout} 
          />
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <ApplicationHeader currentStep={currentStep} />
      {renderCurrentStep()}
    </div>
  );
};

export default ApplicationForm;
