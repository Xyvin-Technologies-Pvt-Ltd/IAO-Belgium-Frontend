import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { X, FileText, CheckCircle, XCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatTZ } from "@/utils/dateUtils";
import { openSecureFile } from "@/utils/secureFile";
import { useSecureHtml } from "@/hooks/useSecureHtml";
import moment from "moment";

const ViewComponent = ({ open, onClose, componentData, program }) => {
  const { t, i18n } = useTranslation();

  useMemo(() => {
    if (i18n.language) {
      moment.locale(i18n.language);
    }
  }, [i18n.language]);

  //* Rewrite embedded private-file references in rich text to presigned URLs.
  const secureAdditionalContext = useSecureHtml(componentData?.additional_context);
  const secureInstruction = useSecureHtml(componentData?.instruction);

  if (!open || !componentData) return null;

  const getTypeLabel = (type) => {
    const typeLabels = {
      module: t("componentManagement.types.module"),
      app: t("componentManagement.types.app"),
      resource: t("componentManagement.types.resource"),
      exam: t("componentManagement.types.exam"),
    };
    return typeLabels[type] || type;
  };

  const handleView = (file) => {
    //* Open file via a short-lived presigned URL.
    if (file.url) {
      openSecureFile(file.url);
    }
  };

  return (
    <>
      <style jsx>{`
        .instruction-content p {
          margin: 0.25rem 0;
        }
        .instruction-content p:first-child {
          margin-top: 0;
        }
        .instruction-content p:last-child {
          margin-bottom: 0;
        }
        .instruction-content ul {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
          list-style-type: disc;
        }
        .instruction-content ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
          list-style-type: decimal;
        }
        .instruction-content li {
          margin: 0.125rem 0;
        }
        .instruction-content strong {
          font-weight: 600;
        }
        .instruction-content ul ul,
        .instruction-content ol ol,
        .instruction-content ul ol,
        .instruction-content ol ul {
          margin: 0.25rem 0;
        }
      `}</style>
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div className="bg-white dark:bg-black border rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-bold">
                {componentData.name || componentData.linked_exam?.name} -{" "}
                {componentData.uid}
              </h2>
              <p className="text-sm text-muted-foreground">
                {getTypeLabel(componentData.type)}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">
                  {program?.duration_unit && program.duration_unit !== "years"
                    ? t("componentManagement.levelLabel", "Level")
                    : t("componentManagement.year")}
                </h3>
                <p className="text-lg">{componentData.year}</p>
              </div>

              {componentData.submission_deadline && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">
                    {t("componentManagement.submissionDeadlineLabel")}
                  </h3>
                  <p className="text-lg">
                    {formatTZ(componentData.submission_deadline, "DD-MM-YYYY")}
                  </p>
                </div>
              )}

              {componentData.amount !== undefined &&
                componentData.type === "module" && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">
                      {t("componentManagement.amountLabel")}
                    </h3>
                    <p className="text-lg">
                      {componentData.currency
                        ? `${componentData.currency} ${componentData.amount || 0}`
                        : componentData.amount || 0}
                    </p>
                  </div>
                )}
            </div>

            {componentData.type === "exam" && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/30">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">
                    {t("componentManagement.linkedModuleLabel")}
                  </h3>
                  <p className="text-base font-semibold">
                    {componentData.linked_module?.name || t("common.notAvailable")}
                    {componentData.linked_module?.module_number &&
                      ` (${
                        program?.duration_unit && program.duration_unit !== "years"
                          ? t("componentManagement.levelLabel", "Level")
                          : t("componentManagement.year")
                      } ${componentData.linked_module.module_number})`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    {t("componentManagement.linkedModuleHint")}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">
                    {t("componentManagement.linkedExamLabel")}
                  </h3>
                  <p className="text-base font-semibold">
                    {componentData.linked_exam?.name || t("common.notAvailable")}
                    {componentData.linked_exam?.uid &&
                      ` (${componentData.linked_exam.uid})`}
                  </p>
                </div>
              </div>
            )}

            {componentData.type === "module" && componentData.additional_context && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">
                  {t("componentManagement.additionalContextLabel", "Additional Context")}
                </h3>
                <div className="bg-muted rounded-lg p-4">
                  <div
                    className="text-sm leading-relaxed instruction-content"
                    dangerouslySetInnerHTML={{
                      __html: secureAdditionalContext,
                    }}
                  />
                </div>
              </div>
            )}

            {componentData.instruction && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">
                  {t("componentManagement.instructionsLabel")}
                </h3>
                <div className="bg-muted rounded-lg p-4">
                  <div
                    className="text-sm leading-relaxed instruction-content"
                    dangerouslySetInnerHTML={{
                      __html: secureInstruction,
                    }}
                  />
                </div>
              </div>
            )}
            {componentData.files && componentData.files.length > 0 && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-3">
                  {t("resourceModule.resources.title")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {componentData.files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between hover:bg-muted/50 p-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-orange-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-700 dark:text-white truncate">
                            {file.name}
                          </p>
                        </div>
                      </div>
                      <button
                        className="flex items-center gap-1 text-sm font-semibold text-muted-foreground dark:text-white/70 hover:text-black dark:hover:text-white"
                        onClick={() => handleView(file)}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {componentData.submissions && componentData.type === "app" && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-3">
                  {t("componentManagement.submissionTypesLabel")}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {componentData.submissions.onboarding ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm">{t("componentManagement.onboarding")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {componentData.submissions.scientific_research_intro ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm">{t("componentManagement.scientificResearchIntro")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {componentData.submissions.peer_groups ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm">{t("componentManagement.peerGroups")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {componentData.submissions.internships ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm">{t("componentManagement.internships")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {componentData.submissions.essays ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm">{t("componentManagement.essays")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {componentData.submissions.case_studies ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm">{t("componentManagement.caseStudies")}</span>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <span className="font-medium text-sm text-muted-foreground">
                {t("componentManagement.activeStatus")}
              </span>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${componentData.status ? "bg-green-500" : "bg-red-500"}`}
                />
                <span className="text-sm font-medium">
                  {componentData.status ? t("common.active") : t("common.inactive")}
                </span>
              </div>
            </div>
          </div>
          <div className="flex justify-end p-6 border-t">
            <Button variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewComponent;
