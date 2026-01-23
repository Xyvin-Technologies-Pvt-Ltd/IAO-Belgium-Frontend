import { ErrorMessage, LoadingState } from "@/components/common";
import StudentCard from "@/components/student/StudentCard";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { useGetTeacherById } from "@/store/useTeacherStore";
import { useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const TeacherDetails = () => {
  const { t } = useTranslation();
  const params = useParams({ strict: false });
  const id = params.id;
  const { updateBreadcrumbs } = useBreadcrumb();

  const { data: teacher, isLoading, error, refetch } = useGetTeacherById(id);
  useEffect(() => {
    if (teacher?.data) {
      updateBreadcrumbs([
        {
          label: "Teacher Management",
          path: "/admin/teacher-management",
          navigable: true,
        },
        {
          label: "Teacher Details",
          path: "/admin/admission-administration/academics",
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
  if (!teacherData) {
    return null;
  }

  return (
    <div className="space-y-6 mt-4">
      <StudentCard student={teacherData} />
    </div>
  );
};

export default TeacherDetails;
