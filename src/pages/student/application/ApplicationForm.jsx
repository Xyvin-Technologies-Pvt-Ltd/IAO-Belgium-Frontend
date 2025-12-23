import { useState, useEffect } from "react";
import StepOne from "../steps/StepOne";
import StepTwo from "../steps/StepTwo";
import StepThree from "../steps/StepThree";
import ApplicationHeader from "./ApplicationHeader";
import ApplicationSaved from "./ApplicationSaved";

const ApplicationForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationData, setApplicationData] = useState({});
  const [showSavedScreen, setShowSavedScreen] = useState(false);

  useEffect(() => {
    const savedStep = localStorage.getItem('currentStep');
    if (savedStep) {
      setCurrentStep(parseInt(savedStep));
    }
  }, []);

  const handleNext = (stepData) => {
    // Save step data
    const updatedData = { ...applicationData, ...stepData };
    setApplicationData(updatedData);
    
    if (currentStep < 3) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      // Auto-save only current step
      localStorage.setItem('currentStep', nextStep.toString());
      
      console.log(`➡️ Move to Step ${nextStep}`);
    }
  };

  const handleSaveAndLogout = () => {
    console.log("🔐 Saved & Logged out");
    localStorage.setItem('currentStep', currentStep.toString());
    setShowSavedScreen(true);
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

  // Show saved screen after save and logout
  if (showSavedScreen) {
    return (
      <ApplicationSaved 
        applicationReference="IAO-2025-9ERQ9M"
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <ApplicationHeader currentStep={currentStep} />
      {renderCurrentStep()}
    </div>
  );
};

export default ApplicationForm;
