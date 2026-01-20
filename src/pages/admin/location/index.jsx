import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Countries from "./Countries";
import Cities from "./Cities";

const Locations = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("locationsActiveTab") || "countries";
  });

  useEffect(() => {
    localStorage.setItem("locationsActiveTab", activeTab);
  }, [activeTab]);

  const tabs = [
    { id: "countries", label: t("locationManagement.tabs.countries"), component: Countries },
    { id: "cities", label: t("locationManagement.tabs.cities"), component: Cities },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="space-y-6 mt-4">
      <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
        {t("locationManagement.title")}
      </h2>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-white/20">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-[#ff8904] text-[#ff8904]"
                  : "border-transparent text-gray-500 dark:text-white/70 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/30"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
};

export default Locations;
