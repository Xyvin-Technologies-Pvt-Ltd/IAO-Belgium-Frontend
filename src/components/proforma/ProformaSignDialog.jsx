import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Download,
  Eye,
  Info,
  Loader2,
  PenTool,
  Pencil,
} from "lucide-react";
import { ProformaInvoiceDocument, downloadProformaInvoicePdf } from "@/components/admin/ProformaInvoiceDocument";
import { proformaTeacherName } from "@/utils/proformaCourseLabel";

function normalizeBank(value) {
  return String(value || "").replace(/\s+/g, "").toUpperCase();
}

function teacherFullAddress(teacher = {}) {
  return [teacher.address, teacher.postal_code, teacher.city, teacher.country]
    .map((p) => (p != null ? String(p).trim() : ""))
    .filter(Boolean)
    .join(", ");
}

function validateBank(bank, t) {
  if (!bank) return t("proforma.sign.bankRequired");
  if (bank.length < 8) return t("proforma.sign.bankMin");
  if (bank.length > 34) return t("proforma.sign.bankMax");
  if (!/^[A-Z0-9]+$/.test(bank)) return t("proforma.sign.bankChars");
  return null;
}

function validateDetailsForm(
  {
    signedByName,
    bankAccount,
    useDifferentDetails,
    companyName,
    companyAddress,
    companyBank,
  },
  t
) {
  const errors = {};
  const name = String(signedByName || "").trim();
  if (!name) errors.signed_by_name = t("proforma.sign.nameRequired");
  else if (name.length < 2) errors.signed_by_name = t("proforma.sign.nameMin");

  if (!useDifferentDetails) {
    const bankErr = validateBank(normalizeBank(bankAccount), t);
    if (bankErr) errors.bank_account_number = bankErr;
  } else {
    if (!String(companyName || "").trim()) errors.company_name = t("proforma.sign.companyNameRequired");
    if (!String(companyAddress || "").trim()) errors.address = t("proforma.sign.addressRequired");
    const bankErr = validateBank(normalizeBank(companyBank), t);
    if (bankErr) errors.company_bank = bankErr;
  }
  return { errors, valid: Object.keys(errors).length === 0 };
}

/**
 * Preview & sign wizard: invoice details → preview → sign → download PDF.
 */
export default function ProformaSignDialog({
  open,
  onOpenChange,
  proforma,
  busy = false,
  onConfirm,
}) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [signedByName, setSignedByName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [useDifferentDetails, setUseDifferentDetails] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyBank, setCompanyBank] = useState("");
  const [errors, setErrors] = useState({});
  const [signed, setSigned] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [signedProforma, setSignedProforma] = useState(null);

  const teacher = proforma?.teacher_id || {};
  const teacherName = proformaTeacherName(teacher, "");
  const teacherAddress = teacherFullAddress(teacher);

  useEffect(() => {
    if (!open || !proforma) return;
    setStep(1);
    setSignedByName(teacherName);
    setBankAccount(normalizeBank(teacher.IBAN || ""));
    setUseDifferentDetails(false);
    setCompanyName("");
    setCompanyAddress("");
    setCompanyBank("");
    setErrors({});
    setSigned(false);
    setSignedProforma(null);
    setDownloading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only on open
  }, [open]);

  const draftPayload = useMemo(() => {
    const bank = useDifferentDetails
      ? normalizeBank(companyBank)
      : normalizeBank(bankAccount);
    return {
      signed_by_name: String(signedByName || "").trim(),
      bank_account_number: bank,
      invoice_party: useDifferentDetails
        ? {
            use_different_details: true,
            company_name: String(companyName || "").trim(),
            contact_person_name: String(signedByName || "").trim(),
            address: String(companyAddress || "").trim(),
          }
        : { use_different_details: false },
    };
  }, [
    useDifferentDetails,
    companyBank,
    bankAccount,
    signedByName,
    companyName,
    companyAddress,
  ]);

  const previewParty = useMemo(
    () => ({
      forceUnsigned: !signed,
      bank_account_number: draftPayload.bank_account_number,
      signed_by_name: draftPayload.signed_by_name,
      use_different_details: draftPayload.invoice_party.use_different_details,
      company_name: draftPayload.invoice_party.company_name,
      contact_person_name: draftPayload.invoice_party.contact_person_name,
      address: draftPayload.invoice_party.address,
    }),
    [draftPayload, signed]
  );

  const displayProforma = signedProforma || proforma;

  const goPreview = () => {
    const { errors: nextErrors, valid } = validateDetailsForm(
      {
        signedByName,
        bankAccount,
        useDifferentDetails,
        companyName,
        companyAddress,
        companyBank,
      },
      t
    );
    setErrors(nextErrors);
    if (!valid) return;
    setStep(2);
  };

  const handleSign = async () => {
    const result = await onConfirm?.(draftPayload);
    if (result === false) return;
    const next = result?.data || result || null;
    setSignedProforma({
      ...proforma,
      ...(next && typeof next === "object" ? next : {}),
      teacher_id: proforma.teacher_id,
      planning_id: proforma.planning_id,
      course_meta: proforma.course_meta,
      digital_signature:
        next?.digital_signature || {
          is_signed: true,
          signed_at: new Date().toISOString(),
          signed_by_name: draftPayload.signed_by_name,
          bank_account_number: draftPayload.bank_account_number,
          invoice_party: draftPayload.invoice_party,
        },
      status: next?.status || "TEACHER_SIGNED_APPROVED",
    });
    setSigned(true);
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const ok = await downloadProformaInvoicePdf(displayProforma);
      if (!ok) throw new Error(t("proforma.sign.couldNotPreparePdf"));
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const eur = Number(proforma?.grand_total || 0).toFixed(2);
  const title =
    step === 1
      ? t("proforma.sign.invoiceDetails")
      : signed
        ? t("proforma.sign.invoiceSigned")
        : t("proforma.sign.previewInvoiceTitle");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-xs text-muted-foreground pt-0.5">
            {t("proforma.sign.stepOf", {
              step,
              number: proforma?.proforma_number,
              amount: eur,
            })}
          </p>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-1">
            <div className="flex gap-2.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm text-sky-950">
              <Info className="w-4 h-4 mt-0.5 shrink-0 text-sky-600" />
              <p>{t("proforma.sign.infoBanner")}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                {teacherAddress || t("proforma.sign.noAddress")}
              </p>
            </div>

            <div>
              <Label htmlFor="sign-name" className="text-xs font-semibold">
                {t("proforma.sign.fullName")}
              </Label>
              <Input
                id="sign-name"
                className="mt-1.5"
                value={signedByName}
                onChange={(e) => {
                  setSignedByName(e.target.value);
                  if (errors.signed_by_name) {
                    setErrors((p) => ({ ...p, signed_by_name: undefined }));
                  }
                }}
                placeholder={t("proforma.sign.fullNamePlaceholder")}
                disabled={busy}
                autoFocus
              />
              {errors.signed_by_name && (
                <p className="text-xs text-destructive mt-1">{errors.signed_by_name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="sign-bank" className="text-xs font-semibold">
                {t("proforma.sign.bankAccountIban")}
              </Label>
              <Input
                id="sign-bank"
                className="mt-1.5 font-mono"
                value={bankAccount}
                onChange={(e) => {
                  setBankAccount(normalizeBank(e.target.value));
                  if (errors.bank_account_number) {
                    setErrors((p) => ({ ...p, bank_account_number: undefined }));
                  }
                }}
                placeholder={t("proforma.sign.bankPlaceholder")}
                disabled={busy || useDifferentDetails}
                readOnly={useDifferentDetails}
              />
              {errors.bank_account_number && (
                <p className="text-xs text-destructive mt-1">{errors.bank_account_number}</p>
              )}
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <Checkbox
                checked={useDifferentDetails}
                onCheckedChange={(v) => {
                  const on = Boolean(v);
                  setUseDifferentDetails(on);
                  setErrors({});
                  if (on) {
                    setCompanyName("");
                    setCompanyAddress("");
                    setCompanyBank("");
                  }
                }}
                disabled={busy}
              />
              <span className="text-sm font-medium text-foreground">
                {t("proforma.sign.differentDetails")}
              </span>
            </label>

            {useDifferentDetails && (
              <div className="rounded-lg border border-sky-200 bg-sky-50/40 p-4 space-y-3">
                <div>
                  <Label htmlFor="company-name" className="text-xs font-semibold">
                    {t("proforma.sign.companyName")}
                  </Label>
                  <Input
                    id="company-name"
                    className="mt-1.5"
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      if (errors.company_name) setErrors((p) => ({ ...p, company_name: undefined }));
                    }}
                    placeholder={t("proforma.sign.companyNamePlaceholder")}
                    disabled={busy}
                  />
                  {errors.company_name && (
                    <p className="text-xs text-destructive mt-1">{errors.company_name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="company-address" className="text-xs font-semibold">
                    {t("proforma.sign.address")}
                  </Label>
                  <Input
                    id="company-address"
                    className="mt-1.5"
                    value={companyAddress}
                    onChange={(e) => {
                      setCompanyAddress(e.target.value);
                      if (errors.address) setErrors((p) => ({ ...p, address: undefined }));
                    }}
                    placeholder={t("proforma.sign.addressPlaceholder")}
                    disabled={busy}
                  />
                  {errors.address && (
                    <p className="text-xs text-destructive mt-1">{errors.address}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="company-bank" className="text-xs font-semibold">
                    {t("proforma.sign.companyBankIban")}
                  </Label>
                  <Input
                    id="company-bank"
                    className="mt-1.5 font-mono"
                    value={companyBank}
                    onChange={(e) => {
                      setCompanyBank(normalizeBank(e.target.value));
                      if (errors.company_bank) setErrors((p) => ({ ...p, company_bank: undefined }));
                    }}
                    placeholder={t("proforma.sign.companyBankPlaceholder")}
                    disabled={busy}
                  />
                  {errors.company_bank && (
                    <p className="text-xs text-destructive mt-1">{errors.company_bank}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && displayProforma && (
          <div className="space-y-3 py-1">
            <div className="rounded-lg border border-border overflow-hidden bg-muted/20 max-h-[55vh] overflow-y-auto">
              <ProformaInvoiceDocument
                proforma={displayProforma}
                previewParty={signed ? null : previewParty}
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-3 sm:justify-end">
          {step === 1 && (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => onOpenChange?.(false)}
              >
                {t("proforma.sign.cancel")}
              </Button>
              <Button
                type="button"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={busy}
                onClick={goPreview}
              >
                <Eye className="w-4 h-4 mr-2" />
                {t("proforma.sign.previewInvoice")}
              </Button>
            </>
          )}

          {step === 2 && !signed && (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setStep(1)}
              >
                <Pencil className="w-4 h-4 mr-2" />
                {t("proforma.sign.edit")}
              </Button>
              <Button
                type="button"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={busy}
                onClick={handleSign}
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <PenTool className="w-4 h-4 mr-2" />
                )}
                {t("proforma.sign.sign")}
              </Button>
            </>
          )}

          {step === 2 && signed && (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={busy || downloading}
                onClick={() => onOpenChange?.(false)}
              >
                {t("proforma.sign.close")}
              </Button>
              <Button
                type="button"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={busy || downloading}
                onClick={handleDownload}
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {t("proforma.sign.downloadPdf")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
