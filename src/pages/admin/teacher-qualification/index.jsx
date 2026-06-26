import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Titles from "./Titles";
import TeacherRole from "./TeacherRole";
import ContractTypes from "../contract-type";
import Departments from "../department";
import Regions from "../region";
import TeachingRegions from "../teaching-region";

const TeacherQualification = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("teacherActiveTab") || "titles";
  });

  useEffect(() => {
    localStorage.setItem("teacherActiveTab", activeTab);
  }, [activeTab]);

  const tabs = [
    {
      id: "titles",
      label: t("teacherQualification.tabs.titles"),
      component: Titles,
    },
    {
      id: "roles",
      label: t("teacherQualification.tabs.roles"),
      component: TeacherRole,
    },
    {
      id: "departments",
      label: t("sidebar.admin.departments", "Departments"),
      component: Departments,
    },
    {
      id: "regions",
      label: t("sidebar.admin.regions", "Regions"),
      component: Regions,
    },
    {
      id: "teaching-regions",
      label: t("sidebar.admin.teachingRegions", "Teaching Regions"),
      component: TeachingRegions,
    },
    {
      id: "contract-types",
      label: t("sidebar.admin.contractTypes", "Contract Types"),
      component: ContractTypes,
    },
  ];

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  return (
    <div className="space-y-6 mt-4">
      <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
        {t("teacherQualification.title")}
      </h2>

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

      <div className="mt-6">{ActiveComponent && <ActiveComponent />}</div>
    </div>
  );
};

export default TeacherQualification;
