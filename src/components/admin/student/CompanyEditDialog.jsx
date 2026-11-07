import { useState } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGetCompany, useUpdateCompany } from "@/store/useCompanyStore";
import { useCountries, isCountryCode } from "@/hooks/useCountries";
import CountrySelect from "./CountrySelect";

const FIELDS = [
  ["company_name", "companyName"],
  ["vat_number", "vat"],
  ["registration_number", "registration"],
  ["contact_email", "email"],
  ["phone", "phone"],
  ["address_line_1", "address1"],
  ["address_line_2", "address2"],
  ["postal_code", "postalCode"],
  ["city", "city"],
];
const ALL_FIELDS = [...FIELDS.map(([f]) => f), "country"];

/** The form for one loaded company (remounted per company, so no syncing effect). */
function CompanyForm({ company, countries, c, onCancel, onSave, saving }) {
  const [form, setForm] = useState(() => Object.fromEntries(ALL_FIELDS.map((f) => [f, company[f] ?? ""])));

  const stored_country = company.country || "";
  const country_needs_fix = Boolean(stored_country) && countries.length > 0 && !isCountryCode(countries, stored_country);
  const changed = Object.fromEntries(
    ALL_FIELDS.filter((f) => String(form[f] ?? "").trim() !== String(company[f] ?? "").trim()).map((f) => [
      f,
      String(form[f] ?? "").trim(),
    ]),
  );
  const has_changes = Object.keys(changed).length > 0;
  const name_missing = !String(form.company_name || "").trim();

  return (
    <>
      <div className="space-y-4">
        {company.exact_account_id ? (
          <div className="flex gap-2 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-sm text-blue-800 dark:text-blue-200">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            {c("inExactNote", "Already a customer in Exact Online — changes here don't update the existing Exact customer.")}
          </div>
        ) : null}
        {country_needs_fix ? (
          <div className="flex gap-2 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            {c("countryNeedsFix", 'Country is saved as "{{value}}", which Exact Online doesn\'t accept. Pick the country below.', {
              value: stored_country,
            })}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map(([field, key]) => (
            <div key={field} className={field === "company_name" || field.startsWith("address") ? "sm:col-span-2 space-y-1" : "space-y-1"}>
              <Label htmlFor={`company-${field}`}>{c(`fields.${key}`, key)}</Label>
              <Input
                id={`company-${field}`}
                value={form[field] ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
              />
            </div>
          ))}
          <div className="space-y-1">
            <Label htmlFor="company-country">{c("fields.country", "Country")}</Label>
            <CountrySelect
              id="company-country"
              value={form.country}
              onChange={(code) => setForm((prev) => ({ ...prev, country: code }))}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-4">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          {c("cancel", "Cancel")}
        </Button>
        <Button onClick={() => onSave(changed)} disabled={!has_changes || name_missing || saving}>
          {saving ? c("saving", "Saving…") : c("save", "Save")}
        </Button>
      </div>
    </>
  );
}

/**
 * Admin view / edit of one company (a student's billing company). Country is a
 * dropdown that stores the ISO-2 code — Exact Online refuses a typed name.
 * Saves only the fields that changed; every change is in the audit log.
 */
const CompanyEditDialog = ({ companyId, onClose, onSaved }) => {
  const { t } = useTranslation();
  const c = (key, fallback, opts) => t(`companyEdit.${key}`, fallback, opts);
  const countries = useCountries();
  const { data, isLoading, error } = useGetCompany(companyId);
  const { mutate: save, isPending } = useUpdateCompany();
  const company = data?.data;

  const handleSave = (changed) => {
    save(
      { id: companyId, ...changed },
      {
        onSuccess: () => {
          onSaved?.();
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open={Boolean(companyId)} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{c("title", "Company details")}</DialogTitle>
          <DialogDescription>{company?.company_name || ""}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{c("loading", "Loading company…")}</p>
        ) : error || !company ? (
          <p className="text-sm text-red-600">{error?.message || c("loadFailed", "Failed to load this company")}</p>
        ) : (
          <CompanyForm
            key={`${company._id}-${company.updatedAt || ""}`}
            company={company}
            countries={countries}
            c={c}
            onCancel={onClose}
            onSave={handleSave}
            saving={isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CompanyEditDialog;
