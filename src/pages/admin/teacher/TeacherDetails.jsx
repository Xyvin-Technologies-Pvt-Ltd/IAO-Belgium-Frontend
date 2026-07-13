import UserCard from "@/components/admin/UserCard";
import { ErrorMessage, LoadingState } from "@/components/common";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { useGetTeacherById } from "@/store/useTeacherStore";
import { useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import TeacherSessions from "./TeacherSessions";
import TeacherAttachments from "./TeacherAttachments";

const TABS = ["sessions", "attachments"];

const TeacherDetails = () => {
  const { t } = useTranslation();
  const params = useParams({ strict: false });
  const id = params.id;
  const { updateBreadcrumbs } = useBreadcrumb();
  const [activeTab, setActiveTab] = useState("sessions");

  const { data: teacher, isLoading, error, refetch } = useGetTeacherById(id);

  useEffect(() => {
    if (teacher?.data) {
      updateBreadcrumbs([
        {
          label: "Lecturer Management",
          path: "/admin/teacher-management",
          navigable: true,
        },
        {
          label: "Lecturer Details",
          path: "/admin/teacher-management",
          navigable: false,
        },
      ]);
    }
    return () => {
      updateBreadcrumbs([]);
    };
  }, [teacher?.data, id]);

  if (isLoading) {
    return (
      <LoadingState text={t("intakeManagement.details.loading")} fullHeight />
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={error?.message || t("intakeManagement.details.loadFailed")}
          onRetry={refetch}
          variant="card"
        />
      </div>
    );
  }

  const teacherData = teacher.data;
  if (!teacherData) return null;

  return (
    <div className="space-y-6 mt-4 bg-sidebar rounded-xl p-5 border border-sidebar-border">
      <UserCard teacher={teacherData} isTeacher hide />

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-white/20">
        <nav className="-mb-px flex space-x-8">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                activeTab === tab
                  ? "border-[#ff8904] text-[#ff8904]"
                  : "border-transparent text-gray-500 dark:text-white/70 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/30"
              }`}
            >
              {tab === "attachments" 
                ? t("teacherManagement.notesAndAttachments", "Notes & Attachments") 
                : t(`planningManagement.${tab}`, tab)}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "sessions" && <TeacherSessions teacherId={id} />}
      {activeTab === "attachments" && <TeacherAttachments teacherId={id} attachments={teacherData.attachments || []} />}
    </div>
  );
};

export default TeacherDetails;
