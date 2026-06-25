import { X, Eye, Download, Flag, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { useState, useEffect } from "react";
import { useUpdateApplication } from "@/store/useApplication";
import { useTranslation } from "react-i18next";
import axiosInstance from "@/api/axiosintercepter";

const ViewApplication = ({ open, onClose, application }) => {
  const { t } = useTranslation();
  const [requestAdditionalInfo, setRequestAdditionalInfo] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [documentFlags, setDocumentFlags] = useState({
    id_card: false,
    qualification_certificate: []
  });
  
  const updateApplicationMutation = useUpdateApplication();
  useEffect(() => {
    if (open && application) {
      setRequestAdditionalInfo(false);
      setRemarks(application.remarks || "");
      
      setDocumentFlags({
        id_card: application.id_card?.flag || false,
        qualification_certificate: Array.isArray(application.qualification_certificate)
          ? application.qualification_certificate.map(cert => cert?.flag || false)
          : []
      });
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
    (Array.isArray(documentFlags.qualification_certificate) && 
     documentFlags.qualification_certificate.some(flag => flag));

  if (!open || !application) return null;

  const handleStatusUpdate = (status) => {
    const updateData = {
      status,
    };

    if (remarks.trim()) {
      updateData.remarks = remarks.trim();
    }

    if (application.id_card && documentFlags.id_card) {
      updateData.id_card = { flag: true };
    }
    
    // Only send flags for qualification certificates, not the full objects
    if (Array.isArray(documentFlags.qualification_certificate) && 
        documentFlags.qualification_certificate.length > 0) {
      const hasFlaggedCerts = documentFlags.qualification_certificate.some(flag => flag);
      if (hasFlaggedCerts) {
        updateData.qualification_certificate = documentFlags.qualification_certificate.map(flag => ({
          flag: flag
        }));
      }
    }

    updateApplicationMutation.mutate({
      id: application._id,
      data: updateData
    }, {
      onSuccess: () => {
        setRequestAdditionalInfo(false);
        setRemarks("");
        onClose(); 
      }
    });
  };

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
            setDocumentFlags({
              id_card: application?.id_card?.flag || false,
              qualification_certificate: Array.isArray(application?.qualification_certificate)
                ? application.qualification_certificate.map(cert => cert?.flag || false)
                : []
            });
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
              <InfoItem label={t("applicationReview.modal.previousEducation")} value={application?.user?.previous_education || t("common.notAvailable")} />
              <InfoItem label={t("applicationReview.modal.program")} value={application?.program_name || t("common.notAvailable")} />
              <InfoItem label={t("applicationReview.modal.address")} value={application?.user?.address || t("common.notAvailable")} />
              <InfoItem label={t("applicationReview.modal.applicationId")} value={application?.uid || t("common.notAvailable")} />
              <InfoItem
                label={t("applicationReview.modal.qualificationStatus", "Qualification status")}
                value={
                  application?.completing_qualification
                    ? t(
                        "applicationReview.modal.stillCompletingQualification",
                        "Still completing qualification",
                      )
                    : t(
                        "applicationReview.modal.qualificationNotDeferred",
                        "Not deferred",
                      )
                }
              />
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold mb-4 text-dashboard-text dark:text-white">
              {t("applicationReview.modal.attachedDocuments")}
            </h3>

            {application?.completing_qualification && (
              <div className="flex items-start gap-2 p-3 mb-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-100">
                <FileText size={18} className="shrink-0 mt-0.5" />
                <p className="text-sm">
                  {t(
                    "applicationReview.modal.completingQualificationNotice",
                    "The applicant indicated they are still completing their qualification. A certificate has not been uploaded yet.",
                  )}
                </p>
              </div>
            )}

            {application?.id_card?.url && (
              <DocumentRow 
                title={t("applicationReview.documents.idCard")} 
                size={t("applicationReview.documents.pdfDocument")} 
                url={application.id_card.url}
                flagged={documentFlags.id_card}
                onToggleFlag={() => toggleDocumentFlag('id_card')}
              />
            )}
            
            {Array.isArray(application?.qualification_certificate) && 
             application.qualification_certificate.length > 0 && 
             application.qualification_certificate.map((cert, index) => (
              <DocumentRow 
                key={index}
                title={`${t("applicationReview.documents.qualificationCertificate")} ${index + 1}`} 
                size={t("applicationReview.documents.pdfDocument")} 
                url={cert.url}
                flagged={documentFlags.qualification_certificate[index] || false}
                onToggleFlag={() => toggleDocumentFlag('qualification_certificate', index)}
              />
            ))}

            {!application?.id_card?.url && 
             (!Array.isArray(application?.qualification_certificate) || 
              application.qualification_certificate.length === 0) &&
             !application?.completing_qualification && (
              <p className="text-sm text-muted-foreground dark:text-white/70">{t("applicationReview.modal.noDocuments")}</p>
            )}
          </div>

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
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t dark:border-white/20">
          <Button 
            variant="secondary"
            onClick={() => handleStatusUpdate('rejected')}
            disabled={updateApplicationMutation.isPending}
          >
            {updateApplicationMutation.isPending ? t("applicationReview.modal.processing") : t("applicationReview.modal.reject")}
          </Button>
          <Button 
            variant="secondary"
            onClick={() => handleStatusUpdate('waitlisted')}
            disabled={updateApplicationMutation.isPending}
          >
            {updateApplicationMutation.isPending ? t("applicationReview.modal.processing") : t("applicationReview.modal.waitlist")}
          </Button>
          <Button 
            disabled={requestAdditionalInfo || hasAnyFlaggedDocument || updateApplicationMutation.isPending}
            className={`${requestAdditionalInfo || hasAnyFlaggedDocument ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => handleStatusUpdate('approved')}
          >
            {updateApplicationMutation.isPending ? t("applicationReview.modal.processing") : t("applicationReview.modal.accept")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ViewApplication;

const InfoItem = ({ label, value }) => (
  <div>
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

      <div className="flex items-center gap-4">
        <Action 
          icon={Eye} 
          label={t("applicationReview.documents.view")} 
          onClick={() => url && window.open(url, '_blank')}
        />
        <Action 
          icon={Download} 
          label={t("applicationReview.documents.download")} 
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
        <Action 
          icon={Flag} 
          label={flagged ? t("applicationReview.documents.unflagDocument") : t("applicationReview.documents.flagDocument")}
          onClick={onToggleFlag}
          className={flagged ? "text-red-500 hover:text-red-700 dark:hover:text-red-400" : ""}
        />
      </div>
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
