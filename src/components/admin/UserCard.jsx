import { useState } from "react";
import { Eye, Download, FileText, Upload, Plus, Loader2 } from "lucide-react";
import moment from "moment";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { openSecureFile, downloadSecureFile } from "@/utils/secureFile";
import { resolvePreviousEducationLabel } from "@/utils/previousEducation";
import { uploadFile } from "@/api/uploadApi";
import { usePutApplication } from "@/store/useApplication";

const UserCard = ({ student, teacher, isTeacher = false, hide }) => {
  const { t, i18n } = useTranslation();
  const user = isTeacher ? teacher : student;
  const [uploadingIdCard, setUploadingIdCard] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const putApplicationMutation = usePutApplication();

  const handleIdCardUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingIdCard(true);
      const res = await uploadFile(file);
      await putApplicationMutation.mutateAsync({
        id: user.application_id || user._id, // Application ID
        data: {
          id_card: { url: res.data.file_url }
        }
      });
      toast.success(t("studentManagement.modal.idCardUploaded", "ID Card uploaded successfully"));
    } catch (err) {
      toast.error(err?.message || t("studentManagement.modal.uploadFailed", "Upload failed"));
    } finally {
      setUploadingIdCard(false);
    }
  };

  const handleCertUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingCert(true);
      const res = await uploadFile(file);
      const currentCerts = Array.isArray(user?.qualification_certificate) ? user.qualification_certificate : [];
      await putApplicationMutation.mutateAsync({
        id: user.application_id || user._id, // Application ID
        data: {
          qualification_certificate: [...currentCerts, { url: res.data.file_url }]
        }
      });
      toast.success(t("studentManagement.modal.certUploaded", "Qualification Certificate uploaded successfully"));
    } catch (err) {
      toast.error(err?.message || t("studentManagement.modal.uploadFailed", "Upload failed"));
    } finally {
      setUploadingCert(false);
    }
  };

  const programLocation = [user?.program_city, user?.program_country]
    .filter(Boolean)
    .join(", ");

  const programMeta = [user?.program_language, programLocation]
    .filter(Boolean)
    .join(" • ");

  const programDisplay = user?.program_name
    ? programMeta
      ? `${user.program_name} • ${programMeta}`
      : user.program_name
    : t("common.notAvailable");

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
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-sidebar-foreground/70">
              {isTeacher
                ? user?.teacher_role?.name || t("common.notAvailable")
                : programDisplay}
            </p>
            {!isTeacher && user?.is_online && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300 border border-green-200 dark:border-green-900/50">
                {t("common.online", "Online")}
              </span>
            )}
          </div>
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

          {isTeacher && (
            <>
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
            </>
          )}

          {isTeacher ? (
            <>
              <InfoItem
                label={t("studentManagement.modal.academicDegree")}
                value={
                  Array.isArray(user?.academic_degree)
                    ? user.academic_degree
                        .map((d) => d?.name)
                        .filter(Boolean)
                        .join(", ") || t("common.notAvailable")
                    : user?.academic_degree?.name || t("common.notAvailable")
                }
              />
              <InfoItem
                label={t("studentManagement.modal.teacherRole")}
                value={user?.teacher_role?.name || t("common.notAvailable")}
              />
              <InfoItem
                label={t("teacherManagement.modal.motherTongueLabel", "Mother Tongue")}
                value={user?.mother_tongue?.name || t("common.notAvailable")}
              />
              <InfoItem
                label={t("teacherManagement.modal.contractTypeLabel", "Contract Type")}
                value={user?.contract_type?.name || t("common.notAvailable")}
              />
              <InfoItem
                label={t("teacherManagement.modal.departmentLabel", "Department")}
                value={
                  user?.department?.length > 0
                    ? user.department.map((d) => d.name).join(", ")
                    : t("common.notAvailable")
                }
              />
              <InfoItem
                label={t("teacherManagement.modal.regionLabel", "Region")}
                value={
                  user?.region?.length > 0
                    ? user.region.map((r) => r.name).join(", ")
                    : t("common.notAvailable")
                }
              />
              <InfoItem
                label={t("teacherManagement.modal.teachingRegionsLabel", "Regions Where They Teach")}
                value={
                  user?.teaching_regions?.length > 0
                    ? user.teaching_regions.map((r) => r.name).join(", ")
                    : t("common.notAvailable")
                }
              />
              <InfoItem
                label={t("studentManagement.modal.employmentStartDate")}
                value={
                  user?.iao_employment_start_date
                    ? moment(user.iao_employment_start_date).format(
                        "DD-MM-YYYY",
                      )
                    : t("common.notAvailable")
                }
              />
              <InfoItem
                label="IAO ID"
                value={user?.iao_id || t("common.notAvailable")}
              />
              <InfoItem
                label={t("teacherManagement.modal.languageLabel")}
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
                    ? moment(user.enrolled_date).format("DD-MM-YYYY")
                    : t("common.notAvailable")
                }
              />
              <InfoItem
                label={t("studentManagement.modal.lastLogin", "Last Login")}
                value={
                  user?.last_login
                    ? moment(user.last_login).format("DD MMM YYYY, HH:mm")
                    : t("common.notAvailable")
                }
              />
              <InfoItem
                label={t("studentManagement.modal.previousEducation")}
                value={
                  resolvePreviousEducationLabel(
                    user?.previous_education,
                    user?.previous_education_options || [],
                    i18n.language,
                  ) || t("common.notAvailable")
                }
              />
            </>
          )}
        </div>
      </div>

      {!isTeacher && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-sidebar-foreground">
            {t("studentManagement.modal.documents")}
          </h3>

          <div className="space-y-3">
            {/* ID Card */}
            <div>
              <p className="text-xs font-semibold text-sidebar-foreground/70 mb-1">
                {t("applicationReview.documents.idCard")}
              </p>
              {user?.id_card?.url ? (
                <DocumentRow
                  title={t("applicationReview.documents.idCard")}
                  size={t("applicationReview.documents.pdfDocument")}
                  url={user.id_card.url}
                />
              ) : (
                <div className="flex items-center justify-between border border-dashed border-sidebar-border rounded-lg px-4 py-3 bg-sidebar-accent/5">
                  <span className="text-sm text-sidebar-foreground/50">
                    {t("studentManagement.modal.idCardMissing", "ID Card not uploaded")}
                  </span>
                  {user?.application_status === "drafted" && (
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ff8904] text-white rounded-[6px] text-xs font-semibold cursor-pointer hover:bg-[#ff8904]/90 transition-colors">
                      {uploadingIdCard ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload size={14} />
                      )}
                      {t("studentManagement.modal.upload", "Upload")}
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        className="hidden"
                        onChange={handleIdCardUpload}
                        disabled={uploadingIdCard}
                      />
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* Qualification Certificates */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-sidebar-foreground/70">
                  {t("applicationReview.documents.qualificationCertificate")}
                </p>
                {user?.application_status === "drafted" && (
                  <label className="flex items-center gap-1 px-2 py-1 bg-sidebar-accent/20 text-sidebar-foreground hover:bg-sidebar-accent/40 rounded-[4px] text-xs font-medium cursor-pointer transition-colors">
                    {uploadingCert ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus size={12} />
                    )}
                    {t("studentManagement.modal.addCert", "Add Certificate")}
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      className="hidden"
                      onChange={handleCertUpload}
                      disabled={uploadingCert}
                    />
                  </label>
                )}
              </div>

              {Array.isArray(user?.qualification_certificate) &&
              user.qualification_certificate.length > 0 ? (
                user.qualification_certificate.map((cert, index) => (
                  <DocumentRow
                    key={index}
                    title={`${t("applicationReview.documents.qualificationCertificate")} ${index + 1}`}
                    size={t("applicationReview.documents.pdfDocument")}
                    url={cert.url}
                  />
                ))
              ) : (
                <div className="border border-dashed border-sidebar-border rounded-lg px-4 py-3 bg-sidebar-accent/5">
                  <span className="text-sm text-sidebar-foreground/50">
                    {t("studentManagement.modal.certsMissing", "Qualification certificates not uploaded")}
                  </span>
                </div>
              )}
            </div>
          </div>
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
          onClick={() => url && openSecureFile(url)}
        />
        <Action
          icon={Download}
          label={t("applicationReview.documents.download", "Download")}
          onClick={() => url && downloadSecureFile(url, url.split("/").pop() || "document")}
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
