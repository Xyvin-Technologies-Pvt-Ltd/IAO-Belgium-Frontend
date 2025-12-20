import React from "react";
import { useLanguageStore } from "@/store/useLanguageStore";

const ApplicationForm = () => {
  const { t } = useLanguageStore();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="mb-6">
          <p>
            <strong>Title:</strong> {t.form?.title}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;
