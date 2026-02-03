import { Eye, Download, FileText } from "lucide-react";
import moment from "moment";
import { useTranslation } from "react-i18next";

const UserCard= ({ student, teacher, isTeacher = false }) => {
  const { t } = useTranslation();
  const user = isTeacher ? teacher : student;

  return (
    <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border  space-y-6">
      <div className="flex items-start gap-4 pb-4 border-b border-sidebar-border">
        <div className="w-16 h-16 rounded-full bg-[#ff8904] flex items-center justify-center text-white font-semibold text-xl">
          {user?.first_name 
            ? user.first_name.charAt(0).toUpperCase()
            : user?.email?.charAt(0).toUpperCase() || '?'}
        </div>

        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-sidebar-foreground">
              {user?.first_name && user?.last_name
                ? `${user.first_name} ${user.last_name}`
                : user?.email ||
                  `Unknown ${isTeacher ? "Teacher" : "Student"}`}
            </h2>
            <span
              className={`px-1.5 py-0.5 text-xs font-medium rounded-[6px] text-white ${
                user?.status === 'active' ? 'bg-green-500' :
                user?.status === 'inactive' ? 'bg-gray-500' :
                user?.status === 'deleted' ? 'bg-red-500' :
                'bg-gray-500'
              }`}
            >
              {user?.status?.charAt(0).toUpperCase() +
                user?.status?.slice(1) || "Active"}
            </span>
          </div>
          <p className="text-sm font-medium text-sidebar-foreground/70">
            {isTeacher
              ? user?.teacher_role?.name || "N/A"
              : user?.program_name || "N/A"}
          </p>
        </div>
      </div>
      <div>
        <h3 className="text-base font-semibold mb-4 text-sidebar-foreground">
          {t("studentManagement.modal.basicInfo")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InfoItem
            label={t("studentManagement.modal.phoneNumber")}
            value={user?.phone || "N/A"}
          />
          <InfoItem
            label={t("studentManagement.modal.emailAddress")}
            value={user?.email || "N/A"}
          />

          {isTeacher ? (
            <>
              <InfoItem
                label={t("studentManagement.modal.academicDegree")}
                value={user?.academic_degree?.name || "N/A"}
              />
              <InfoItem
                label={t("studentManagement.modal.teacherRole")}
                value={user?.teacher_role?.name || "N/A"}
              />
              <InfoItem
                label={t("studentManagement.modal.employmentStartDate")}
                value={
                  user?.iao_employment_start_date
                    ? moment(user.iao_employment_start_date).format(
                        "DD MMM YYYY",
                      )
                    : "N/A"
                }
              />
              <InfoItem
                label={t("studentManagement.modal.languages")}
                value={
                  user?.language?.length > 0
                    ? user.language.map((lang) => lang.name).join(", ")
                    : "N/A"
                }
              />
              <InfoItem
                label={t("studentManagement.modal.locations")}
                value={
                  user?.location?.length > 0
                    ? user.location
                        .map((loc) => `${loc.name}, ${loc.country.name}`)
                        .join("; ")
                    : "N/A"
                }
              />
            </>
          ) : (
            <>
              <InfoItem
                label={t("studentManagement.modal.batch")}
                value={user?.batch_name || "N/A"}
              />
              <InfoItem label={"Intake"} value={user?.intake_name || "N/A"} />
              <InfoItem
                label={t("studentManagement.modal.address")}
                value={user?.address || "N/A"}
              />
              <InfoItem
                label={t("studentManagement.modal.country")}
                value={user?.country || "N/A"}
              />
              <InfoItem
                label={t("studentManagement.modal.city")}
                value={user?.city || "N/A"}
              />
              <InfoItem
                label={t("studentManagement.modal.postalCode")}
                value={user?.postal_code || "N/A"}
              />
              <InfoItem
                label={t("studentManagement.modal.studentId")}
                value={user?.uid || "N/A"}
              />
              <InfoItem
                label={t("studentManagement.modal.enrolledDate")}
                value={
                  user?.enrolled_date
                    ? moment(user.enrolled_date).format("YYYY-MM-DD")
                    : "N/A"
                }
              />
              <InfoItem
                label={t("studentManagement.modal.previousEducation")}
                value={user?.previous_education || "N/A"}
              />
            </>
          )}
        </div>
      </div>

      {!isTeacher && (
        <div>
          <h3 className="text-base font-semibold mb-4 text-sidebar-foreground">
            {t("studentManagement.modal.documents")}
          </h3>

          {user?.id_card?.url && (
            <DocumentRow
              title={t("applicationReview.documents.idCard")}
              size={t("applicationReview.documents.pdfDocument")}
              url={user.id_card.url}
            />
          )}

          {user?.qualification_certificate?.url && (
            <DocumentRow
              title={t("applicationReview.documents.qualificationCertificate")}
              size={t("applicationReview.documents.pdfDocument")}
              url={user.qualification_certificate.url}
            />
          )}

          {!user?.id_card?.url && !user?.qualification_certificate?.url && (
            <p className="text-sm text-sidebar-foreground/70">
              {t("studentManagement.modal.noDocuments")}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default UserCard;

const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-sm text-sidebar-foreground/70">{label}</p>
    <p className="text-base font-semibold text-sidebar-foreground">{value}</p>
  </div>
);

const DocumentRow = ({ title, size, url }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between border border-sidebar-border rounded-lg px-4 py-3 mb-3 bg-sidebar-accent/5">
      <div className="flex items-center gap-3">
        <FileText size={18} className="text-sidebar-foreground/70" />
        <div>
          <p className="text-sm font-semibold text-sidebar-foreground">
            {title}
          </p>
          <p className="text-xs text-sidebar-foreground/70">{size}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Action
          icon={Eye}
          label={t("applicationReview.documents.view")}
          onClick={() => url && window.open(url, "_blank")}
        />
        <Action
          icon={Download}
          label={t("applicationReview.documents.download", "Download")}
          onClick={() => {
            if (url) {
              window.open(url, "_blank");
            }
          }}
        />
      </div>
    </div>
  );
};

const Action = ({ icon: Icon, label, onClick, className = "" }) => (
  <button
    className={`flex items-center gap-1 text-sm font-semibold text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors ${className}`}
    onClick={onClick}
  >
    <Icon size={16} />
    {label}
  </button>
);
