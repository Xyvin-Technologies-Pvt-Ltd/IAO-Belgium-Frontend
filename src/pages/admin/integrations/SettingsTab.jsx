import { useState } from "react";
import { FileCheck, Unplug, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  useBackfillExactContacts,
  useDisconnectExact,
  useGetExactSendMode,
  useSetExactSendMode,
  useCheckExactDocumentTypes,
} from "@/store/useExactStore";
import MollieRefBackfillCard from "./MollieRefBackfillCard";

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function Section({ title, hint, children }) {
  return (
    <div className="rounded-lg border dark:border-white/10 px-4 py-3 space-y-3 text-sm">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{title}</p>
        {hint ? <p className="text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

/** Settings: send mode, PDF permission check, one-off tools, disconnect. */
const SettingsTab = ({ isConnected, canModify }) => {
  const { t } = useTranslation();
  const e = (key, opts) => t(`integrations.exact.${key}`, opts);
  const [docCheck, setDocCheck] = useState(null);

  const { data: sendModeResponse, error: sendModeError } = useGetExactSendMode();
  const { mutate: setSendMode, isPending: isSavingSendMode } = useSetExactSendMode();
  const { mutate: checkDocumentTypes, isPending: isCheckingDocs } = useCheckExactDocumentTypes();
  const { mutate: backfillContacts, isPending: isBackfillingContacts } = useBackfillExactContacts();
  const { mutate: disconnect, isPending: isDisconnecting } = useDisconnectExact();

  const sendMode = sendModeResponse?.data?.mode === "auto" ? "auto" : "manual";

  const handleSendModeChange = (checked) => {
    const next = checked ? "auto" : "manual";
    const question = next === "auto" ? e("sendMode.confirmAuto") : e("sendMode.confirmManual");
    if (!window.confirm(question)) return;
    setSendMode(next);
  };

  const handleCheckDocuments = () => {
    setDocCheck(null);
    checkDocumentTypes(undefined, {
      onSuccess: (res) => {
        const d = res?.data || {};
        setDocCheck(
          d.ok
            ? { ok: true, text: e("docCheck.ok", { id: d.configured_type_id, name: d.configured?.description || "" }) }
            : { ok: false, text: e("docCheck.notOk", { reason: res?.message || "" }) },
        );
      },
      onError: (err) => setDocCheck({ ok: false, text: e("docCheck.notOk", { reason: err?.message || "" }) }),
    });
  };

  const handleDisconnect = () => {
    if (!window.confirm(e("disconnectConfirm"))) return;
    disconnect();
  };

  if (!isConnected) {
    return <p className="text-sm text-muted-foreground">{e("authoriseFirst")}</p>;
  }

  return (
    <div className="space-y-4">
      <Section
        title={
          <>
            {e("sendMode.title")}:{" "}
            <span className={sendMode === "auto" ? "text-blue-700 dark:text-blue-300" : "text-amber-700 dark:text-amber-300"}>
              {sendMode === "auto" ? e("sendMode.auto") : e("sendMode.manual")}
            </span>
          </>
        }
        hint={sendMode === "auto" ? e("sendMode.autoHint") : e("sendMode.manualHint")}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            {sendModeResponse?.data?.changed_at ? (
              <p className="text-xs text-muted-foreground">
                {e("sendMode.changed", { when: formatDateTime(sendModeResponse.data.changed_at) })}
              </p>
            ) : null}
            {sendModeError ? (
              <p className="text-xs text-amber-700 dark:text-amber-300">{e("sendMode.loadFailed")}</p>
            ) : null}
          </div>
          {canModify ? (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{e("sendMode.manual")}</span>
              <Switch
                checked={sendMode === "auto"}
                onCheckedChange={handleSendModeChange}
                disabled={isSavingSendMode || Boolean(sendModeError)}
                aria-label={e("sendMode.title")}
              />
              <span className="text-muted-foreground">{e("sendMode.auto")}</span>
            </div>
          ) : null}
        </div>
      </Section>

      <Section title={e("settings.pdfTitle")} hint={e("settings.pdfHint")}>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleCheckDocuments} disabled={isCheckingDocs}>
            <FileCheck className="w-4 h-4 mr-2" />
            {isCheckingDocs ? e("docCheck.checking") : e("docCheck.button")}
          </Button>
          {docCheck ? (
            <span className={docCheck.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}>
              {docCheck.text}
            </span>
          ) : null}
        </div>
      </Section>

      {canModify ? (
        <Section title={e("backfillContacts")} hint={e("backfillContactsHint")}>
          <Button variant="outline" size="sm" onClick={() => backfillContacts()} disabled={isBackfillingContacts}>
            <Users className={`w-4 h-4 mr-2 ${isBackfillingContacts ? "animate-pulse" : ""}`} />
            {isBackfillingContacts ? e("backfillingContacts") : e("backfillContacts")}
          </Button>
        </Section>
      ) : null}

      <MollieRefBackfillCard isConnected={isConnected} canModify={canModify} />

      {canModify ? (
        <Section title={e("settings.connectionTitle")} hint={e("settings.connectionHint")}>
          <Button variant="destructive" size="sm" onClick={handleDisconnect} disabled={isDisconnecting}>
            <Unplug className="w-4 h-4 mr-2" />
            {isDisconnecting ? e("disconnecting") : e("disconnect")}
          </Button>
        </Section>
      ) : null}
    </div>
  );
};

export default SettingsTab;
