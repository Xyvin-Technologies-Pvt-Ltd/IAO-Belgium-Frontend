import { X, Eye, Download, Flag, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { useState, useEffect } from "react";
import { useUpdateApplication } from "@/store/useApplication";
import { useTranslation } from "react-i18next";
import { openSecureFile, downloadSecureFile } from "@/utils/secureFile";
import {
  getApplicationPreviousEducationOptions,
  resolvePreviousEducationLabel,
} from "@/utils/previousEducation";
import { useCanModify } from "@/hooks/useCanModify";
import AdmissionPaymentBadge from "@/components/admin/AdmissionPaymentBadge";
import ApplicationStatusConfirm from "@/components/admin/application-review/ApplicationStatusConfirm";

const getApplicantDisplayName = (application, t) => {
  if (application?.user?.first_name && application?.user?.last_name) {
    return `${application.user.last_name} ${application.user.first_name}`;
  }
  return application?.user?.email || t("applicationReview.modal.unknownApplicant");
};

const getRejectionReason = (application) => {
  const rejectedLogs = (application?.admin_logs || [])
    .filter((log) => log.status === "rejected" && log.remarks?.trim())
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (rejectedLogs.length > 0) {
    return rejectedLogs[0].remarks.trim();
  }

  return application?.remarks?.trim() || "";
};

const ViewApplication = ({ open, onClose, application }) => {
  const { t, i18n } = useTranslation();
  const canModify = useCanModify("operations");
  const [requestAdditionalInfo, setRequestAdditionalInfo] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [documentFlags, setDocumentFlags] = useState({
    id_card: false,
    qualification_certificate: [],
    qualification_missing: false,
  });
  const [pendingStatus, setPendingStatus] = useState(null);
  
  const updateApplicationMutation = useUpdateApplication();

  const getUploadedCertificates = (app) =>
    Array.isArray(app?.qualification_certificate)
      ? app.qualification_certificate.filter((cert) => cert?.url)
      : [];

  const getInitialDocumentFlags = (app) => {
    const uploadedCerts = getUploadedCertificates(app);
    const hasUploadedCerts = uploadedCerts.length > 0;
    const hasMissingCertFlag =
      !hasUploadedCerts &&
      Array.isArray(app?.qualification_certificate) &&
      app.qualification_certificate.some((cert) => cert?.flag === true && !cert?.url);

    return {
      id_card: app?.id_card?.flag || false,
      qualification_certificate: hasUploadedCerts
        ? uploadedCerts.map((cert) => cert?.flag || false)
        : [],
      qualification_missing: hasMissingCertFlag,
    };
  };

  useEffect(() => {
    if (open && application) {
      setRequestAdditionalInfo(false);
      setRemarks(application.remarks || "");
      setDocumentFlags(getInitialDocumentFlags(application));
    }
  }, [open, application?._id]);

  const toggleDocumentFlag = (documentType, index = null) => {
    if (documentType === 'qualification_certificate' && index !== null) {
      setDocumentFlags(prev => ({
        ...prev,
        qualification_certificate: prev.qualification_certificate.map((flag, i) => 
          i === index ? !flag : flag
        )
      }));
    } else {
      setDocumentFlags(prev => ({
        ...prev,
        [documentType]: !prev[documentType]
      }));
    }
  };

  const hasAnyFlaggedDocument = documentFlags.id_card ||
    documentFlags.qualification_missing ||
    (Array.isArray(documentFlags.qualification_certificate) && 
     documentFlags.qualification_certificate.some(flag => flag));

  const isPaymentPaid = application?.payment_status === "paid";

  if (!open || !application) return null;

  const handleStatusUpdate = (status, overrideRemarks) => {
    const updateData = {
      status,
    };

    if (status === "rejected") {
      updateData.remarks = overrideRemarks?.trim() || "";
    } else if (remarks.trim()) {
      updateData.remarks = remarks.trim();
    }

    if (documentFlags.id_card) {
      updateData.id_card = { flag: true };
    }

    const uploadedCerts = getUploadedCertificates(application);
    if (uploadedCerts.length > 0) {
      const hasFlaggedCerts = documentFlags.qualification_certificate.some((flag) => flag);
      if (hasFlaggedCerts) {
        updateData.qualification_certificate = documentFlags.qualification_certificate.map((flag) => ({
          flag,
        }));
      }
    } else if (documentFlags.qualification_missing) {
      updateData.qualification_certificate = [{ flag: true }];
    }

    updateApplicationMutation.mutate({
      id: application._id,
      data: updateData
    }, {
      onSuccess: () => {
        setRequestAdditionalInfo(false);
        setRemarks("");
        setPendingStatus(null);
        onClose(); 
      }
    });
  };

  const handleConfirmStatus = (overrideRemarks) => {
    if (!pendingStatus) return;
    handleStatusUpdate(pendingStatus, overrideRemarks);
  };

  const applicantDisplayName = getApplicantDisplayName(application, t);
  const rejectionReason = getRejectionReason(application);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-black w-full max-w-4xl rounded-xl shadow-lg overflow-hidden border dark:border-white/20">
        <div className="flex items-start justify-between p-6 border-b dark:border-white/20">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-[#ff8904] flex items-center justify-center text-white font-semibold text-xl">
              {application?.user?.first_name 
                ? application.user.first_name.charAt(0).toUpperCase()
                : application?.user?.email?.charAt(0).toUpperCase() || '?'}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-dashboard-text dark:text-white capitalize">
                  {application?.user?.first_name && application?.user?.last_name 
                    ? `${application.user.last_name} ${application.user.first_name}`
                    : application?.user?.email || t("applicationReview.modal.unknownApplicant")}
                </h2>
                <span className={`px-1.5 py-0.5 text-xs font-medium rounded-[6px] text-white ${
                  application?.status === 'pending' ? 'bg-[#DBA91C]' :
                  application?.status === 'drafted' ? 'bg-gray-500' :
                  application?.status === 'waitlisted' ? 'bg-blue-500' :
                  application?.status === 'resubmitted' ? 'bg-orange-500' :
                  application?.status === 'approved' ? 'bg-green-500' :
                  application?.status === 'rejected' ? 'bg-red-500' :
                  'bg-gray-500'
                }`}>
                  {t(`applicationReview.status.${application?.status || 'pending'}`)}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-white/70">{application?.uid || t("common.notAvailable")}</p>
            </div>
          </div>

          <button onClick={() => {
            // Reset state when manually closing
            setRequestAdditionalInfo(false);
            setRemarks("");
            // Reset flags to original values from application data
            setDocumentFlags(getInitialDocumentFlags(application));
            onClose();
          }}>
            <X className="text-muted-foreground dark:text-white/70 hover:text-gray-700 dark:hover:text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div>
            <h3 className="text-base font-semibold mb-4 text-dashboard-text dark:text-white">
              {t("applicationReview.modal.basicInfo")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <InfoItem label={t("applicationReview.modal.phoneNumber")} value={application?.user?.phone || t("common.notAvailable")} />
              <InfoItem label={t("applicationReview.modal.emailAddress")} value={application?.user?.email || t("common.notAvailable")} />
              <InfoItem label={t("applicationReview.modal.previousEducation")} value={
                application?.user?.previous_education_label ||
                resolvePreviousEducationLabel(
                  application?.user?.previous_education,
                  getApplicationPreviousEducationOptions(application),
                  i18n.language,
                ) ||
                t("common.notAvailable")
              } />
              <InfoItem label={t("applicationReview.modal.program")} value={application?.program_name || t("common.notAvailable")} />
              <InfoItem label={t("applicationReview.modal.programType", "Program Type")} value={application?.program_type || application?.intake?.program?.program_type || application?.batch?.intake?.program?.program_type || t("common.notAvailable")} />
              <InfoItem label={t("applicationReview.modal.address")} value={application?.user?.address || t("common.notAvailable")} />
              <InfoItem label={t("applicationReview.modal.applicationId")} value={application?.uid || t("common.notAvailable")} />
              <div className="min-w-0 break-words">
                <p className="text-sm text-muted-foreground dark:text-white/70">
                  {t("applicationReview.modal.paymentInfo", "Payment")}
                </p>
                <div className="mt-1">
                  <AdmissionPaymentBadge
                    payment_status={application?.payment_status}
                    payment_amount={application?.payment_amount}
                  />
                </div>
                {(application?.payment_amount ?? 0) === 0 && application?.payment_status === "paid" ? (
                  <p className="text-xs text-muted-foreground dark:text-white/60 mt-1">
                    {t("applicationReview.modal.noRegistrationFee", "No registration fee for this intake.")}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="mt-4 flex items-start gap-3 p-3 rounded-lg border dark:border-white/20 bg-gray-50 dark:bg-white/5">
              <input
                type="checkbox"
                id="completing-qualification-status"
                className="mt-1"
                checked={application?.completing_qualification === true}
                disabled
                readOnly
              />
              <label
                htmlFor="completing-qualification-status"
                className="text-sm font-semibold text-dashboard-text dark:text-white"
              >
                {t(
                  "applicationReview.modal.completingQualificationCheckbox",
                  "I'm still completing my qualification. I will submit my diploma later.",
                )}
              </label>
            </div>
            {(application.enrollment_mode || (application.selected_modules && application.selected_modules.length > 0)) && (
              <div className="mt-4 p-4 border dark:border-white/20 rounded-lg bg-gray-50 dark:bg-white/5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-dashboard-text dark:text-white">
                    {t("applicationReview.modal.moduleSelection", "Module Selectie")}
                  </h4>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    application.enrollment_mode === "full" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                  }`}>
                    {application.enrollment_mode === "full"
                      ? t("admin.manualTherapy.mode.full", "Volledig Programma")
                      : t("admin.manualTherapy.mode.partial", "Afzonderlijke Modules")}
                  </span>
                </div>
                {application.enrollment_mode === "partial" && (
                  <div className="flex flex-wrap gap-2">
                    {(application.selected_modules || []).map((module, idx) => (
                      <span key={module._id || idx} className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 px-2 py-1 rounded">
                        M{module.module_number}: {module.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {application.status === "rejected" && (
            <div className="p-4 border border-red-200 dark:border-red-900/50 rounded-lg bg-red-50 dark:bg-red-950/20">
              <h3 className="text-base font-semibold mb-2 text-dashboard-text dark:text-white">
                {t("applicationReview.modal.rejectionReason")}
              </h3>
              {rejectionReason ? (
                <p className="text-sm text-gray-700 dark:text-white/80 whitespace-pre-wrap">
                  {rejectionReason}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground dark:text-white/60 italic">
                  {t("applicationReview.modal.noRejectionReason")}
                </p>
              )}
            </div>
          )}

          <div>
            <h3 className="text-base font-semibold mb-4 text-dashboard-text dark:text-white">
              {t("applicationReview.modal.attachedDocuments")}
            </h3>

            <DocumentRow
              title={t("applicationReview.documents.idCard")}
              size={
                application?.id_card?.url
                  ? t("applicationReview.documents.pdfDocument")
                  : t("applicationReview.documents.notUploadedYet", "Not uploaded yet")
              }
              url={application?.id_card?.url}
              flagged={documentFlags.id_card}
              onToggleFlag={() => toggleDocumentFlag('id_card')}
            />

            {getUploadedCertificates(application).length > 0
              ? getUploadedCertificates(application).map((cert, index) => (
                  <DocumentRow
                    key={index}
                    title={`${t("applicationReview.documents.qualificationCertificate")} ${index + 1}`}
                    size={t("applicationReview.documents.pdfDocument")}
                    url={cert.url}
                    flagged={documentFlags.qualification_certificate[index] || false}
                    onToggleFlag={() => toggleDocumentFlag('qualification_certificate', index)}
                  />
                ))
              : (
                  <DocumentRow
                    title={t("applicationReview.documents.qualificationCertificate")}
                    size={t("applicationReview.documents.notUploadedYet", "Not uploaded yet")}
                    flagged={documentFlags.qualification_missing}
                    onToggleFlag={() => toggleDocumentFlag('qualification_missing')}
                  />
                )}
          </div>

          {application?.admin_logs && application.admin_logs.length > 0 && (
            <div>
              <h3 className="text-base font-semibold mb-3 text-dashboard-text dark:text-white">
                {t("applicationReview.modal.adminLog", "Admin Log / History")}
              </h3>
              <div className="space-y-3 max-h-48 overflow-y-auto border dark:border-white/20 rounded-lg p-4 bg-gray-50 dark:bg-white/5">
                {application.admin_logs.map((log, index) => (
                  <div key={log._id || index} className="text-sm border-b dark:border-white/10 pb-2 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center text-xs text-muted-foreground dark:text-white/60 mb-1">
                      <span className="font-semibold text-dashboard-text dark:text-white">
                        {log.admin 
                          ? `${log.admin.first_name || ""} ${log.admin.last_name || ""}`.trim() || log.admin.email 
                          : log.admin_name}
                      </span>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-white/80">{log.action}</p>
                    {log.remarks && (
                      <div className="mt-1 text-xs bg-white dark:bg-black/25 p-2 rounded border dark:border-white/5 italic text-muted-foreground dark:text-white/60" dangerouslySetInnerHTML={{ __html: log.remarks }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {application.status !== 'approved' && application.status !== 'rejected' && (
            <div>
              <h3 className="text-base font-semibold mb-4 text-dashboard-text dark:text-white">
                {t("applicationReview.modal.actions")}
              </h3>

              <div className="flex items-center gap-3 mb-4">
                <Switch 
                  id="request-info" 
                  checked={requestAdditionalInfo}
                  onCheckedChange={setRequestAdditionalInfo}
                />
                <label htmlFor="request-info" className="text-sm cursor-pointer text-gray-700 dark:text-white/70">
                  {t("applicationReview.modal.requestAdditionalInfo")}
                </label>
              </div>

              {requestAdditionalInfo && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-white/70">{t("applicationReview.modal.remarks")}</label>
                  <RichTextEditor
                    value={remarks}
                    onChange={setRemarks}
                    placeholder={t("applicationReview.modal.remarksPlaceholder")}
                    className="bg-white dark:bg-white/5"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {canModify && application.status !== 'approved' && application.status !== 'rejected' ? (
          <div className="flex items-center justify-end gap-3 p-6 border-t dark:border-white/20">
            <Button 
              variant="secondary"
              onClick={() => setPendingStatus("rejected")}
              disabled={updateApplicationMutation.isPending}
            >
              {updateApplicationMutation.isPending ? t("applicationReview.modal.processing") : t("applicationReview.modal.reject")}
            </Button>
            <Button 
              variant="secondary"
              onClick={() => setPendingStatus("waitlisted")}
              disabled={updateApplicationMutation.isPending}
            >
              {updateApplicationMutation.isPending ? t("applicationReview.modal.processing") : t("applicationReview.modal.waitlist")}
            </Button>
            {isPaymentPaid && (
              <Button 
                disabled={requestAdditionalInfo || hasAnyFlaggedDocument || updateApplicationMutation.isPending}
                className={`${requestAdditionalInfo || hasAnyFlaggedDocument ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => setPendingStatus("approved")}
              >
                {updateApplicationMutation.isPending ? t("applicationReview.modal.processing") : t("applicationReview.modal.accept")}
              </Button>
            )}
            {!isPaymentPaid && (
              <p className="text-sm text-muted-foreground dark:text-white/60 mr-auto">
                {t("applicationReview.modal.acceptRequiresPayment", "Accept is available after admission fee is paid.")}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-end p-6 border-t dark:border-white/20">
            <Button variant="secondary" onClick={onClose}>
              {t("common.close", "Close")}
            </Button>
          </div>
        )}
      </div>

      <ApplicationStatusConfirm
        open={pendingStatus !== null}
        status={pendingStatus}
        studentName={applicantDisplayName}
        onClose={() => setPendingStatus(null)}
        onConfirm={handleConfirmStatus}
        isLoading={updateApplicationMutation.isPending}
      />
    </div>
  );
};

export default ViewApplication;

const InfoItem = ({ label, value }) => (
  <div className="min-w-0 break-words">
    <p className="text-sm text-muted-foreground dark:text-white/70">{label}</p>
    <p className="text-base font-semibold text-dashboard-text dark:text-white">{value}</p>
  </div>
);

const DocumentRow = ({ title, size, url, flagged, onToggleFlag }) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center justify-between border dark:border-white/20 rounded-lg px-4 py-3 mb-3 bg-white dark:bg-white/5">
      <div className="flex items-center gap-3">
        <FileText size={18} className="text-muted-foreground dark:text-white/70" />
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-dashboard-text dark:text-white">{title}</p>
            {flagged && (
              <Flag size={14} className="text-red-500" title={t("applicationReview.documents.documentFlagged")} />
            )}
          </div>
          <p className="text-xs text-muted-foreground dark:text-white/70">{size}</p>
        </div>
      </div>

      {(url || onToggleFlag) && (
        <div className="flex items-center gap-4">
          {url && (
            <>
              <Action
                icon={Eye}
                label={t("applicationReview.documents.view")}
                onClick={() => openSecureFile(url)}
              />
              <Action
                icon={Download}
                label={t("applicationReview.documents.download")}
                onClick={() => downloadSecureFile(url, url.split("/").pop() || "document")}
              />
            </>
          )}
          {onToggleFlag && (
            <Action
              icon={Flag}
              label={flagged ? t("applicationReview.documents.unflagDocument") : t("applicationReview.documents.flagDocument")}
              onClick={onToggleFlag}
              className={flagged ? "text-red-500 hover:text-red-700 dark:hover:text-red-400" : ""}
            />
          )}
        </div>
      )}
    </div>
  );
};

const Action = ({ icon: Icon, label, onClick, className = "" }) => (
  <button 
    className={`flex items-center gap-1 text-sm font-semibold cursor-pointer text-muted-foreground dark:text-white/70 hover:text-black dark:hover:text-white ${className}`}
    onClick={onClick}
  >
    <Icon size={16} />
    {label}
  </button>
);
