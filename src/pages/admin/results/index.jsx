import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import OnlineResultsTab from "./OnlineResultsTab";
import PracticalResultsTab from "./PracticalResultsTab";

const Results = () => {
  const { t } = useTranslation();
  
  // Use state to track the active tab, defaulting to "online"
  const [activeTab, setActiveTab] = useState(() => {
    // Read from URL query param if present
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") === "practical" ? "practical" : "online";
  });

  // Keep URL in sync with active tab
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (activeTab === "practical") {
      params.set("tab", "practical");
    } else {
      params.delete("tab");
    }
    const newRelativePathQuery = window.location.pathname + (params.toString() ? "?" + params.toString() : "");
    window.history.replaceState(null, "", newRelativePathQuery);
  }, [activeTab]);

  return (
    <div className="space-y-6 mt-4">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          {t("resultsManagement.title")}
        </h2>
      </div>

      {/* Tabs list */}
      <div className="border-b border-gray-200 dark:border-gray-700 flex gap-6">
        {[
          {
            key: "online",
            label: t("resultsManagement.tabs.online", "Online Exams"),
          },
          {
            key: "practical",
            label: t("resultsManagement.tabs.practical", "Practical Exams"),
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === tab.key
                ? "border-[#ff8904] text-[#ff8904]"
                : "border-transparent text-gray-500 dark:text-white/70 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/30"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab contents */}
      <div>
        {activeTab === "online" ? (
          <OnlineResultsTab />
        ) : (
          <PracticalResultsTab />
        )}
      </div>
    </div>
  );
};

export default Results;
