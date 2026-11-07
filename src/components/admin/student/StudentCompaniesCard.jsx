import { useState } from "react";
import { AlertTriangle, Building2, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useGetUserCompanies } from "@/store/useCompanyStore";
import { useCountries, countryLabel, isCountryCode } from "@/hooks/useCountries";
import CompanyEditDialog from "./CompanyEditDialog";

/** Admin: the student's billing companies, with Edit (country as a dropdown). */
const StudentCompaniesCard = ({ userId, canEdit = true }) => {
  const { t } = useTranslation();
  const c = (key, fallback, opts) => t(`companyEdit.${key}`, fallback, opts);
  const countries = useCountries();
  const [editId, setEditId] = useState(null);
  const { data, isLoading } = useGetUserCompanies(userId);
  const companies = data?.data?.companies ?? [];

  if (isLoading || !companies.length) return null;

  return (
    <div className="rounded-xl border dark:border-white/10 bg-white dark:bg-white/5 p-5 space-y-3">
      <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
        <Building2 className="h-4 w-4" />
        {c("cardTitle", "Billing companies")}
      </h3>
      <div className="divide-y dark:divide-white/10">
        {companies.map((co) => {
          const bad_country = Boolean(co.country) && countries.length > 0 && !isCountryCode(countries, co.country);
          return (
            <div key={co._id} className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm">
              <div className="space-y-0.5">
                <div className="font-medium text-gray-900 dark:text-white">
                  {co.company_name}
                  {co.is_default ? (
                    <span className="ml-2 rounded-full bg-gray-100 dark:bg-white/10 px-2 py-0.5 text-xs">{c("default", "Default")}</span>
                  ) : null}
                  {co.exact_account_id ? (
                    <span className="ml-2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 text-xs">
                      {c("inExact", "In Exact")}
                    </span>
                  ) : null}
                </div>
                <div className="text-muted-foreground">
                  {[co.vat_number && `${c("fields.vat", "VAT")}: ${co.vat_number}`, co.contact_email].filter(Boolean).join(" · ") || "—"}
                </div>
                <div className="text-muted-foreground">
                  {[co.address_line_1, co.address_line_2, [co.postal_code, co.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
                  {co.country ? (
                    <span className={bad_country ? "text-amber-700 dark:text-amber-300" : ""}>
                      {" · "}
                      {countryLabel(countries, co.country)}
                      {bad_country ? (
                        <span className="inline-flex items-center gap-1 ml-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {c("countryNotCode", "not a country code — Exact will refuse it")}
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                </div>
              </div>
              {canEdit ? (
                <Button size="sm" variant="outline" onClick={() => setEditId(co._id)}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  {c("edit", "Edit")}
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>
      <CompanyEditDialog companyId={editId} onClose={() => setEditId(null)} />
    </div>
  );
};

export default StudentCompaniesCard;
