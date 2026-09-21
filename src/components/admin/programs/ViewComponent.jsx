import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, FileText, CheckCircle, XCircle, Eye, Unlink2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatTZ } from "@/utils/dateUtils";
import { openSecureFile } from "@/utils/secureFile";
import { useSecureHtml } from "@/hooks/useSecureHtml";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useGetComponentById,
  useLinkComponentSystemId,
  useUnlinkComponentSystemId,
} from "@/store/useComponentStore";
import { useGetComponents } from "@/store/useDropdownStore";
import { toast } from "sonner";
import moment from "moment";

const ViewComponent = ({ open, onClose, componentData, program }) => {
  const { t, i18n } = useTranslation();
  const [linkSearch, setLinkSearch] = useState("");
  const [showLinkSuggestions, setShowLinkSuggestions] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const debouncedLinkSearch = useDebounce(linkSearch, 200);

  const componentId = open ? componentData?._id : null;
  const { data: componentResponse } = useGetComponentById(componentId);
  const fetchedComponent = componentResponse?.data;
  const viewData = fetchedComponent
    ? { ...componentData, ...fetchedComponent }
    : componentData;

  const programLanguageId =
    program?.language?._id || program?.language || null;

  const { data: linkModulesData } = useGetComponents(
    {
      type: "module",
      search: debouncedLinkSearch,
      ...(programLanguageId && { language: programLanguageId }),
    },
    {
      enabled:
        open &&
        viewData?.type === "module" &&
        debouncedLinkSearch.length > 2,
    },
  );

  const linkMutation = useLinkComponentSystemId();
  const unlinkMutation = useUnlinkComponentSystemId();

  useMemo(() => {
    if (i18n.language) {
      moment.locale(i18n.language);
    }
  }, [i18n.language]);

  //* Rewrite embedded private-file references in rich text to presigned URLs.
  const secureAdditionalContext = useSecureHtml(viewData?.additional_context);
  const secureInstruction = useSecureHtml(viewData?.instruction);

  const linkSuggestions = (() => {
    const modules = linkModulesData?.data || [];
    const seenSystemIds = new Set();
    const unique = [];
    const currentId = viewData?._id?.toString();
    const currentSystemId = viewData?.system_id;

    for (const module of modules) {
      if (module._id?.toString() === currentId) continue;
      if (currentSystemId && module.system_id === currentSystemId) continue;
      if (module.system_id) {
        if (seenSystemIds.has(module.system_id)) continue;
        seenSystemIds.add(module.system_id);
      }
      unique.push(module);
    }
    return unique;
  })();

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

  const isLinking = linkMutation.isPending;
  const isUnlinking = unlinkMutation.isPending;
  const isBusy = isLinking || isUnlinking;

  const showSuccessReminder = (response) => {
    const warnings = response?.data?.warnings;
    toast.success(response?.message || t("common.success", "Success"));
    if (warnings?.review_shared_plannings || warnings?.review_location_switch) {
      toast.message(
        t("componentManagement.reviewAfterChange", {
          count: warnings?.shared_plannings || 0,
        }),
      );
    }
  };

  const formatFlags = (flags = {}) =>
    t("componentManagement.financialFlagsSummary", {
      paid: flags.paid || 0,
      pendingFkf: flags.pending_fkf || 0,
      kmo: flags.kmo || 0,
    });

  const runLink = (module, force = false) => {
    if (!viewData?._id || !module?._id) return;
    setLinkSearch(module.name);
    setShowLinkSuggestions(false);
    linkMutation.mutate(
      {
        id: viewData._id,
        target_component_id: module._id,
        force,
      },
      {
        onSuccess: (response) => {
          setLinkSearch("");
          setConfirmAction(null);
          showSuccessReminder(response);
        },
        onError: (error) => {
          if (error?.status === 409 || error?.code === "SYSTEM_ID_LINK_BLOCKED") {
            setConfirmAction({
              type: "link_force",
              module,
              block: error.data || {},
            });
            return;
          }
          setConfirmAction(null);
          toast.error(error?.message || t("componentManagement.linkFailed"));
        },
      },
    );
  };

  const runUnlink = (force = false) => {
    if (!viewData?._id) return;
    unlinkMutation.mutate(
      { id: viewData._id, force },
      {
        onSuccess: (response) => {
          setConfirmAction(null);
          showSuccessReminder(response);
        },
        onError: (error) => {
          if (error?.status === 409 || error?.code === "SYSTEM_ID_UNLINK_BLOCKED") {
            setConfirmAction({
              type: "unlink_force",
              block: error.data || {},
            });
            return;
          }
          setConfirmAction(null);
          toast.error(error?.message || t("componentManagement.unlinkFailed"));
        },
      },
    );
  };

  const handleLinkSelect = (module) => {
    if (!viewData?._id || !module?._id || isBusy) return;
    setLinkSearch(module.name);
    setShowLinkSuggestions(false);
    setConfirmAction({
      type: "link",
      module,
      familyCount: sharedPrograms.length,
    });
  };

  const handleUnlink = () => {
    if (!viewData?._id || isBusy) return;
    setConfirmAction({ type: "unlink" });
  };

  const closeConfirm = () => {
    if (isBusy) return;
    setConfirmAction(null);
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === "link") {
      runLink(confirmAction.module, false);
      return;
    }
    if (confirmAction.type === "link_force") {
      runLink(confirmAction.module, true);
      return;
    }
    if (confirmAction.type === "unlink") {
      runUnlink(false);
      return;
    }
    if (confirmAction.type === "unlink_force") {
      runUnlink(true);
    }
  };

  const confirmTitle = (() => {
    switch (confirmAction?.type) {
      case "unlink":
      case "unlink_force":
        return t("componentManagement.unlinkConfirmTitle");
      case "link_force":
        return t("componentManagement.linkForceTitle");
      default:
        return t("componentManagement.linkConfirmTitle");
    }
  })();

  const confirmDescription = (() => {
    if (!confirmAction) return null;
    if (confirmAction.type === "unlink") {
      return t("componentManagement.unlinkConfirm");
    }
    if (confirmAction.type === "link") {
      return confirmAction.familyCount > 0
        ? t("componentManagement.linkConfirmFamily", {
            count: confirmAction.familyCount,
          })
        : t("componentManagement.linkConfirm");
    }
    if (confirmAction.type === "link_force") {
      const block = confirmAction.block || {};
      return (
        <>
          <p>{t("componentManagement.linkForceIntro")}</p>
          {block.name_mismatch && (
            <p className="mt-2">{t("componentManagement.linkNameMismatch")}</p>
          )}
          <p className="mt-2">
            {t("componentManagement.linkForceSource", {
              summary: formatFlags(block.source),
            })}
          </p>
          <p className="mt-1">
            {t("componentManagement.linkForceTarget", {
              summary: formatFlags(block.target),
            })}
          </p>
          {(block.shared_plannings || 0) > 0 && (
            <p className="mt-2">
              {t("componentManagement.sharedPlanningsWarning", {
                count: block.shared_plannings,
              })}
            </p>
          )}
        </>
      );
    }
    if (confirmAction.type === "unlink_force") {
      const block = confirmAction.block || {};
      return (
        <>
          <p>{t("componentManagement.unlinkForceIntro")}</p>
          <p className="mt-2">
            {t("componentManagement.unlinkForceFamily", {
              summary: formatFlags(block.family),
            })}
          </p>
          {(block.shared_plannings || 0) > 0 && (
            <p className="mt-2">
              {t("componentManagement.sharedPlanningsWarning", {
                count: block.shared_plannings,
              })}
            </p>
          )}
        </>
      );
    }
    return null;
  })();

  const confirmButtonLabel = (() => {
    if (confirmAction?.type === "unlink" || confirmAction?.type === "unlink_force") {
      if (isUnlinking) return t("componentManagement.unlinking");
      if (confirmAction.type === "unlink_force") {
        return t("componentManagement.forceContinue");
      }
      return t("componentManagement.unlinkLabel");
    }
    if (isLinking) return t("componentManagement.linking");
    if (confirmAction?.type === "link_force") {
      return t("componentManagement.forceContinue");
    }
    return t("common.confirm");
  })();

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

            {viewData.type === "module" && (
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">
                      {t("componentManagement.sharedProgramsLabel")}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("componentManagement.sharedProgramsHint")}
                    </p>
                  </div>
                  {sharedPrograms.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUnlink}
                      disabled={isUnlinking || isLinking}
                      className="shrink-0"
                    >
                      <Unlink2 className="h-4 w-4 mr-1.5" />
                      {isUnlinking
                        ? t("componentManagement.unlinking")
                        : t("componentManagement.unlinkLabel")}
                    </Button>
                  )}
                </div>

                {sharedPrograms.length > 0 ? (
                  <ul className="space-y-2 mb-4">
                    {sharedPrograms.map((sharedProgram) => (
                      <li
                        key={sharedProgram._id}
                        className="text-sm bg-muted/50 rounded-lg px-3 py-2"
                      >
                        {formatProgramLabel(sharedProgram)}
                        {sharedProgram.uid && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({sharedProgram.uid})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("componentManagement.sharedProgramsEmpty")}
                  </p>
                )}

                <div className="relative">
                  <label className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5" />
                    {t("componentManagement.linkToModuleLabel")}
                  </label>
                  <Input
                    value={linkSearch}
                    placeholder={t("componentManagement.linkToModulePlaceholder")}
                    disabled={isLinking || isUnlinking}
                    onChange={(e) => {
                      setLinkSearch(e.target.value);
                      setShowLinkSuggestions(true);
                    }}
                    onFocus={() => {
                      if (linkSearch.length > 2) setShowLinkSuggestions(true);
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowLinkSuggestions(false), 150);
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("componentManagement.linkToModuleHint")}
                  </p>
                  {showLinkSuggestions &&
                    debouncedLinkSearch.length > 2 &&
                    linkSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border rounded-md shadow-md max-h-60 overflow-y-auto">
                        {linkSuggestions.map((module) => (
                          <button
                            type="button"
                            key={module._id}
                            className="w-full text-left p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer border-b last:border-b-0"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleLinkSelect(module)}
                            disabled={isLinking}
                          >
                            <p className="font-medium text-sm">{module.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {[
                                module.program?.name,
                                module.program?.city?.name,
                                module.uid || module.program?.uid,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  {isLinking && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {t("componentManagement.linking")}
                    </p>
                  )}
                </div>
              </div>
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

      <Dialog open={!!confirmAction} onOpenChange={(isOpen) => !isOpen && closeConfirm()}>
        <DialogContent
          className="z-[100] sm:max-w-md"
          overlayClassName="z-[100]"
          showCloseButton={!isBusy}
          onPointerDownOutside={(e) => {
            if (isBusy) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (isBusy) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>{confirmTitle}</DialogTitle>
            <DialogDescription asChild>
              <div className="text-sm text-muted-foreground space-y-1">
                {confirmDescription}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeConfirm} disabled={isBusy}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleConfirm} disabled={isBusy}>
              {confirmButtonLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ViewComponent;
