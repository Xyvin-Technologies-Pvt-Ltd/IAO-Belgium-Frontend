import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { BookOpen } from "lucide-react";
import { resolveAccountingMapping } from "@/api/accountingMappingApi";

const CODE_FIELDS = [
  { key: "gl_revenue_module", labelKey: "programManagement.modal.exactGlRevenueModuleLabel" },
  { key: "gl_revenue_research", labelKey: "programManagement.modal.exactGlRevenueResearchLabel" },
  {
    key: "gl_revenue_admission_fee",
    labelKey: "programManagement.modal.exactGlRevenueAdmissionFeeLabel",
  },
  {
    key: "gl_revenue_convenience_fee",
    labelKey: "programManagement.modal.exactGlRevenueConvenienceFeeLabel",
  },
  { key: "gl_revenue_fce_exam", labelKey: "programManagement.modal.exactGlRevenueFceExamLabel" },
];

const ProgramAccountingCodes = ({ program }) => {
  const { t } = useTranslation();

  const languageId = program?.language?._id || program?.language;
  const countryId = program?.city?.country?._id || program?.city?.country;
  const programType = program?.program_type;
  const isOnline = Boolean(program?.is_online);
  const canResolve = Boolean(languageId && programType && (isOnline || countryId));

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "program-accounting-codes",
      languageId,
      countryId,
      programType,
      isOnline,
    ],
    queryFn: () =>
      resolveAccountingMapping({
        language: languageId,
        program_type: programType,
        ...(isOnline ? { is_online: true } : { country: countryId }),
      }),
    enabled: canResolve,
    staleTime: 60000,
  });

  const codes = data?.data || {};
  const mappingFound = codes.found;

  const displayValue = (value) => {
    const trimmed = String(value || "").trim();
    return trimmed || t("programDetail.accounting.notConfigured", "Not configured");
  };

  return (
    <div className="rounded-xl border border-sidebar-border bg-sidebar p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-sidebar-foreground">
            {t("programDetail.accounting.title", "Exact Online Accounting Codes")}
          </h3>
          <p className="text-xs text-sidebar-foreground/60 mt-1">
            {t(
              "programDetail.accounting.subtitle",
              "Resolved from accounting mapping based on this programme's language, country, and type.",
            )}
          </p>
        </div>
        <BookOpen className="w-5 h-5 text-sidebar-foreground/50 shrink-0" />
      </div>

      {!canResolve && (
        <p className="text-sm text-sidebar-foreground/70">
          {t(
            "programDetail.accounting.incompleteProgram",
            "Complete programme language and location details to view accounting codes.",
          )}
        </p>
      )}

      {canResolve && isLoading && (
        <p className="text-sm text-sidebar-foreground/70">
          {t("programDetail.accounting.loading", "Loading accounting codes...")}
        </p>
      )}

      {canResolve && isError && (
        <p className="text-sm text-red-500">
          {t("programDetail.accounting.loadFailed", "Failed to load accounting codes.")}
        </p>
      )}

      {canResolve && !isLoading && !isError && (
        <>
          {!mappingFound && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {t(
                "programDetail.accounting.noMapping",
                "No accounting mapping found for this programme. Configure one in Accounting Mappings.",
              )}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CODE_FIELDS.map(({ key, labelKey }) => (
              <div key={key} className="space-y-1">
                <p className="text-xs text-sidebar-foreground/60">{t(labelKey)}</p>
                <p className="text-sm font-medium text-sidebar-foreground">
                  {displayValue(codes[key])}
                </p>
              </div>
            ))}
            <div className="space-y-1">
              <p className="text-xs text-sidebar-foreground/60">
                {t("programManagement.modal.exactVatCodeLabel", "Exact VAT Code")}
              </p>
              <p className="text-sm font-medium text-sidebar-foreground">
                {displayValue(codes.vat_code)}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProgramAccountingCodes;
