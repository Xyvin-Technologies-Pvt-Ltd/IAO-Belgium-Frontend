import UserCard from "@/components/admin/UserCard";
import { ErrorMessage, LoadingState } from "@/components/common";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { useGetStudentByApplication } from "@/store/useIntakeStore";
import { useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const StudentDetails = () => {
  const { t } = useTranslation();
  const params = useParams({ strict: false });
  const id = params.id;
  const { updateBreadcrumbs } = useBreadcrumb();

  const {
    data: student,
    isLoading,
    error,
    refetch,
  } = useGetStudentByApplication(id);
  useEffect(() => {
    if (student?.data) {
      updateBreadcrumbs([
        {
          label: t("common.admissionAdministration"),
          path: "/admin/admission-administration",
          navigable: false,
        },
         {
          label: t("common.academics"),
          path: "/admin/admission-administration/academics",
          navigable: true,
        },
        {
          label: t("common.intakes"),
          path: `/admin/admission-administration/academics/${student?.data?.academic}`,
          navigable: true,
        },
        {
          label: t("common.intakeDetails"),
          path: `/admin/admission-administration/academics/intakes/${student?.data?.intake_id}`,
          navigable: true,
        },
        {
          label: t("common.batchDetails"),
          path: `/admin/admission-administration/academics/intakes/batch/${student?.data?.batch_id}`,
          navigable: true,
        },
        {
          label: t("common.studentDetails"),
          path: `/admin/admission-administration/academics/intakes/batch/student/${id}`,
          navigable: false,
        },
      ]);
    }
    return () => {
      updateBreadcrumbs([]);
    };
  }, [student?.data, id]);

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

  const studentData = student?.data;
  if (!studentData) return null;

  return (
    <div className="space-y-6 mt-4">
      <UserCard student={studentData} />
    </div>
  );
};

export default StudentDetails;
