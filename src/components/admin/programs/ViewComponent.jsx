import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { X, FileText, CheckCircle, XCircle, Eye, ChevronDown, ChevronUp, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { formatTZ } from "@/utils/dateUtils";
import { openSecureFile } from "@/utils/secureFile";
import { useSecureHtml } from "@/hooks/useSecureHtml";
import { useGetComponentById } from "@/store/useComponentStore";
import moment from "moment";

const ViewComponent = ({ open, onClose, componentData, program }) => {
  const { t, i18n } = useTranslation();
  const [isSharedProgramsOpen, setIsSharedProgramsOpen] = useState(false);

  const { data: componentResponse } = useGetComponentById(
    open ? componentData?._id : null,
  );
  const fetchedComponent = componentResponse?.data;
  const viewData = fetchedComponent
    ? { ...componentData, ...fetchedComponent }
    : componentData;

  useMemo(() => {
    if (i18n.language) {
      moment.locale(i18n.language);
    }
  }, [i18n.language]);

  //* Rewrite embedded private-file references in rich text to presigned URLs.
  const secureAdditionalContext = useSecureHtml(viewData?.additional_context);
  const secureInstruction = useSecureHtml(viewData?.instruction);

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

  const formatProgramLabel = (sharedProgram) => {
    const parts = [sharedProgram.name].filter(Boolean);
    const city = sharedProgram.city?.name;
    const language = sharedProgram.language?.name;
    if (city || language) {
      parts.push([city, language].filter(Boolean).join(" · "));
    }
    return parts.join(" — ");
  };

  const handleView = (file) => {
    //* Open file via a short-lived presigned URL.
    if (file.url) {
      openSecureFile(file.url);
    }
  };

  const sharedPrograms =
    viewData?.type === "module" && Array.isArray(viewData.shared_programs)
      ? viewData.shared_programs
      : [];

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
                {viewData.name || viewData.linked_exam?.name} -{" "}
                {viewData.uid}
              </h2>
              <p className="text-sm text-muted-foreground">
                {getTypeLabel(viewData.type)}
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
                <p className="text-lg">{viewData.year}</p>
              </div>

              {viewData.submission_deadline && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">
                    {t("componentManagement.submissionDeadlineLabel")}
                  </h3>
                  <p className="text-lg">
                    {formatTZ(viewData.submission_deadline, "DD-MM-YYYY")}
                  </p>
                </div>
              )}

              {viewData.amount !== undefined &&
                viewData.type === "module" && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">
                      {t("componentManagement.amountLabel")}
                    </h3>
                    <p className="text-lg">
                      {viewData.currency
                        ? `${viewData.currency} ${viewData.amount || 0}`
                        : viewData.amount || 0}
                    </p>
                  </div>
                )}
            </div>

            {viewData.type === "exam" && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/30">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">
                    {t("componentManagement.linkedModuleLabel")}
                  </h3>
                  <p className="text-base font-semibold">
                    {viewData.linked_module?.name || t("common.notAvailable")}
                    {viewData.linked_module?.module_number &&
                      ` (${
                        program?.duration_unit && program.duration_unit !== "years"
                          ? t("componentManagement.levelLabel", "Level")
                          : t("componentManagement.year")
                      } ${viewData.linked_module.module_number})`}
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
                    {viewData.linked_exam?.name || t("common.notAvailable")}
                    {viewData.linked_exam?.uid &&
                      ` (${viewData.linked_exam.uid})`}
                  </p>
                </div>
              </div>
            )}

            {viewData.type === "module" && sharedPrograms.length > 0 && (
              <Collapsible
                open={isSharedProgramsOpen}
                onOpenChange={setIsSharedProgramsOpen}
                className="border rounded-xl bg-muted/30 border-border/60 overflow-hidden transition-all duration-200"
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-3.5 text-left font-medium hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Layers className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <span className="text-sm font-semibold">
                        {t("componentManagement.sharedProgramsLabel")}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 rounded-full">
                        {sharedPrograms.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <span>
                        {isSharedProgramsOpen
                          ? t("common.hideDetails", "Hide details")
                          : t("common.showDetails", "Show details")}
                      </span>
                      {isSharedProgramsOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4 pt-1 space-y-3 border-t border-border/40 bg-background/50">
                  <p className="text-xs text-muted-foreground pt-2">
                    {t("componentManagement.sharedProgramsHint")}
                  </p>
                  <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {sharedPrograms.map((sharedProgram) => (
                      <li
                        key={sharedProgram._id}
                        className="text-sm bg-muted/50 hover:bg-muted/80 border border-border/40 rounded-lg px-3 py-2 flex items-center justify-between transition-colors"
                      >
                        <span className="font-medium text-foreground">
                          {formatProgramLabel(sharedProgram)}
                        </span>
                        {sharedProgram.uid && (
                          <span className="text-xs font-mono bg-background border px-2 py-0.5 rounded text-muted-foreground ml-2 shrink-0">
                            {sharedProgram.uid}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            )}

            {viewData.type === "module" && viewData.additional_context && (
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

            {viewData.instruction && (
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
            {viewData.files && viewData.files.length > 0 && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-3">
                  {t("resourceModule.resources.title")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {viewData.files.map((file, index) => (
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

            {viewData.submissions && viewData.type === "app" && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-3">
                  {t("componentManagement.submissionTypesLabel")}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {viewData.submissions.onboarding ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm">{t("componentManagement.onboarding")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {viewData.submissions.scientific_research_intro ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm">{t("componentManagement.scientificResearchIntro")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {viewData.submissions.peer_groups ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm">{t("componentManagement.peerGroups")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {viewData.submissions.internships ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm">{t("componentManagement.internships")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {viewData.submissions.essays ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm">{t("componentManagement.essays")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {viewData.submissions.case_studies ? (
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
                  className={`w-2 h-2 rounded-full ${viewData.status ? "bg-green-500" : "bg-red-500"}`}
                />
                <span className="text-sm font-medium">
                  {viewData.status ? t("common.active") : t("common.inactive")}
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
