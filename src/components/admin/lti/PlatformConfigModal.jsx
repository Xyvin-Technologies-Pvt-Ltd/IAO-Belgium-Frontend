import { useState } from "react";
import { X, Copy, Check, Download } from "lucide-react";
import { useGetLtiPlatformConfig } from "@/store/useLtiStore";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const ConfigRow = ({ label, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wide">
        {label}
      </p>
      <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border dark:border-white/10 rounded-lg px-3 py-2">
        <span className="flex-1 text-sm font-mono text-gray-800 dark:text-white break-all">
          {value || "—"}
        </span>
        <button
          onClick={handleCopy}
          className="shrink-0 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          title={label}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};

const PlatformConfigModal = ({ open, onClose, toolId }) => {
  const { t } = useTranslation();
  const { data, isLoading } = useGetLtiPlatformConfig(toolId, { enabled: open });
  const config = data?.data;

  const handleExportJson = () => {
    if (!config) return;
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "iao-hub-lti-platform-config.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b dark:border-white/20">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("lti.platformConfig.title")}
              </h2>
              <p className="text-sm text-gray-500 dark:text-white/70 mt-1">
                {t("lti.platformConfig.subtitle")}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-gray-700 dark:hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className="h-3 w-24 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
                  <div className="h-9 bg-gray-100 dark:bg-white/5 rounded-lg animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <ConfigRow
                label={t("lti.platformConfig.issuer")}
                value={config?.issuer}
              />
              <ConfigRow
                label={t("lti.platformConfig.clientId")}
                value={config?.client_id}
              />
              <ConfigRow
                label={t("lti.platformConfig.deploymentId")}
                value={config?.deployment_id}
              />
              <ConfigRow
                label={t("lti.platformConfig.jwksUrl")}
                value={config?.jwks_url}
              />
              <ConfigRow
                label={t("lti.platformConfig.oidcAuthEndpoint")}
                value={config?.oidc_auth_endpoint}
              />
              <ConfigRow
                label={t("lti.platformConfig.accessTokenUrl")}
                value={config?.access_token_url}
              />
              {config?.openid_configuration_url && (
                <ConfigRow
                  label={t("lti.platformConfig.oidcConfigUrl")}
                  value={config?.openid_configuration_url}
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t dark:border-white/20 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleExportJson} disabled={isLoading || !config}>
            <Download className="h-4 w-4 mr-2" />
            {t("lti.platformConfig.exportJson")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlatformConfigModal;
