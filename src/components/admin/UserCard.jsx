import { Eye, Download, FileText } from "lucide-react";
import moment from "moment";
import { useTranslation } from "react-i18next";
import axiosInstance from "@/api/axiosintercepter";

const UserCard = ({ student, teacher, isTeacher = false, hide }) => {
  const { t } = useTranslation();
  const user = isTeacher ? teacher : student;

  return (
    <div
      className={`${hide ? "" : "rounded-xl p-5 border border-sidebar-border"} bg-sidebar   space-y-6`}
    >
      <div className="flex items-start gap-4 pb-4 border-b border-sidebar-border">
        <div className="w-16 h-16 rounded-full bg-[#ff8904] flex items-center justify-center text-white font-semibold text-xl">
          {user?.first_name
            ? user.first_name.charAt(0).toUpperCase()
            : user?.email?.charAt(0).toUpperCase() || "?"}
        </div>

        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-sidebar-foreground capitalize">
              {user?.first_name && user?.last_name
                ? `${user.last_name} ${user.first_name}`
                : user?.email ||
                  t("userCard.unknownUser", {
                    type: isTeacher ? t("common.teacher") : t("common.student"),
                  })}
            </h2>
            {user?.uid && (
              <span
                className={`px-1.5 py-0.5 text-xs font-medium rounded-[6px] text-sidebar-foreground bg-[#0A0A0A]/20`}
              >
                {user?.uid}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-sidebar-foreground/70">
            {isTeacher
              ? user?.teacher_role?.name || t("common.notAvailable")
              : user?.program_name || t("common.notAvailable")}
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
            value={user?.phone || t("common.notAvailable")}
          />
          <InfoItem
            label={t("studentManagement.modal.emailAddress")}
            value={user?.email || t("common.notAvailable")}
          />

          {isTeacher ? (
            <>
              <InfoItem
                label={t("studentManagement.modal.academicDegree")}
                value={user?.academic_degree?.name || t("common.notAvailable")}
              />
              <InfoItem
                label={t("studentManagement.modal.teacherRole")}
                value={user?.teacher_role?.name || t("common.notAvailable")}
              />
              <InfoItem
                label={t("studentManagement.modal.employmentStartDate")}
                value={
                  user?.iao_employment_start_date
                    ? moment(user.iao_employment_start_date).format(
                        "DD MMM YYYY",
                      )
                    : t("common.notAvailable")
                }
              />
              <InfoItem
                label={t("studentManagement.modal.languages")}
                value={
                  user?.language?.length > 0
                    ? user.language.map((lang) => lang.name).join(", ")
                    : t("common.notAvailable")
                }
              />
              <InfoItem
                label={t("studentManagement.modal.locations")}
                value={
                  user?.location?.length > 0
                    ? user.location
                        .map((loc) => loc.name)
                        .join(", ")
                    : t("common.notAvailable")
                }
              />
            </>
          ) : (
            <>
              <InfoItem
                label={t("studentManagement.modal.batch")}
                value={user?.batch_name || t("common.notAvailable")}
              />
              <InfoItem
                label={t("userCard.intake")}
                value={user?.intake_name || t("common.notAvailable")}
              />
              <InfoItem
                label={t("studentManagement.modal.address")}
                value={user?.address || t("common.notAvailable")}
              />
              <InfoItem
                label={t("studentManagement.modal.country")}
                value={user?.country || t("common.notAvailable")}
              />
              <InfoItem
                label={t("studentManagement.modal.city")}
                value={user?.city || t("common.notAvailable")}
              />
              <InfoItem
                label={t("studentManagement.modal.postalCode")}
                value={user?.postal_code || t("common.notAvailable")}
              />
              <InfoItem
                label={t("studentManagement.modal.studentId")}
                value={user?.uid || t("common.notAvailable")}
              />
              <InfoItem
                label={t("studentManagement.modal.enrolledDate")}
                value={
                  user?.enrolled_date
                    ? moment(user.enrolled_date).format("YYYY-MM-DD")
                    : t("common.notAvailable")
                }
              />
              <InfoItem
                label={t("studentManagement.modal.previousEducation")}
                value={user?.previous_education || t("common.notAvailable")}
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

          {Array.isArray(user?.qualification_certificate) &&
            user.qualification_certificate.length > 0 &&
            user.qualification_certificate.map((cert, index) => (
              <DocumentRow
                key={index}
                title={`${t("applicationReview.documents.qualificationCertificate")} ${index + 1}`}
                size={t("applicationReview.documents.pdfDocument")}
                url={cert.url}
              />
            ))}

          {!user?.id_card?.url &&
            (!Array.isArray(user?.qualification_certificate) ||
              user.qualification_certificate.length === 0) && (
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
          onClick={async () => {
            if (!url) return;
            try {
              // Extract path from full URL so axios uses its configured baseURL
              let downloadPath = url;
              try {
                const parsedUrl = new URL(url);
                downloadPath = parsedUrl.pathname;
              } catch {
                // url is already a relative path
              }
              const response = await axiosInstance.get(downloadPath, {
                responseType: "blob",
              });
              const blobUrl = window.URL.createObjectURL(response.data);
              const link = document.createElement("a");
              link.href = blobUrl;
              link.download = url.split("/").pop() || "document";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(blobUrl);
            } catch {
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
