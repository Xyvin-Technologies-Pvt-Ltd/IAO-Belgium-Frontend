import { Eye, Download, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

const StudentCard = ({ student }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border  space-y-6">
      <div className="flex items-start gap-4 pb-4 border-b border-sidebar-border">
        <img
          src="https://i.pravatar.cc/100?img=12"
          alt="Student"
          className="w-16 h-16 rounded-full object-cover"
        />

        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-sidebar-foreground">
              {student?.first_name && student?.last_name
                ? `${student.first_name} ${student.last_name}`
                : student?.email || "Unknown Student"}
            </h2>
            <span
              className={`px-1.5 py-0.5 text-xs font-medium rounded-full  bg-[#0A0A0A]/20`}
            >
              {student?.status?.charAt(0).toUpperCase() +
                student?.status?.slice(1) || "Active"}
            </span>
          </div>
          <p className="text-sm font-medium text-sidebar-foreground/70">
            {student?.program_name || "N/A"}
          </p>
        </div>
      </div>
      <div>
        <h3 className="text-base font-semibold mb-4 text-sidebar-foreground">
          {t("studentManagement.modal.basicInfo", "Basic Information")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InfoItem
            label={t("studentManagement.modal.phoneNumber", "Phone Number")}
            value={student?.phone || "N/A"}
          />
          <InfoItem
            label={t("studentManagement.modal.emailAddress", "Email Address")}
            value={student?.email || "N/A"}
          />
          <InfoItem
            label={t("studentManagement.modal.batch", "Batch")}
            value={student?.batch_name || "N/A"}
          />
          <InfoItem
           label={"Intake"}
            value={student?.intake_name || "N/A"}
          />
          <InfoItem
            label={t("studentManagement.modal.address", "Address")}
            value={student?.address || "N/A"}
          />
          <InfoItem
            label={t("studentManagement.modal.studentId", "Student ID")}
            value={student?.uid || "N/A"}
          />
          <InfoItem
            label={t("studentManagement.modal.enrolledDate", "Enrolled Date")}
            value={
              student?.enrolled_date
                ? new Date(student.enrolled_date).toLocaleDateString()
                : "N/A"
            }
          />
          <InfoItem
            label={t(
              "studentManagement.modal.previousEducation",
              "Previous Education",
            )}
            value={student?.previous_education || "N/A"}
          />
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold mb-4 text-sidebar-foreground">
          {t("studentManagement.modal.documents", "Documents")}
        </h3>

        {student?.id_card?.url && (
          <DocumentRow
            title={t("applicationReview.documents.idCard", "ID Card")}
            size={t("applicationReview.documents.pdfDocument", "PDF Document")}
            url={student.id_card.url}
          />
        )}

        {student?.qualification_certificate?.url && (
          <DocumentRow
            title={t(
              "applicationReview.documents.qualificationCertificate",
              "Qualification Certificate",
            )}
            size={t("applicationReview.documents.pdfDocument", "PDF Document")}
            url={student.qualification_certificate.url}
          />
        )}

        {!student?.id_card?.url && !student?.qualification_certificate?.url && (
          <p className="text-sm text-sidebar-foreground/70">
            {t("studentManagement.modal.noDocuments", "No documents available")}
          </p>
        )}
      </div>
    </div>
  );
};

export default StudentCard;

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
          label={t("applicationReview.documents.view", "View")}
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
