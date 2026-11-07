import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCountries } from "@/hooks/useCountries";

//* Countries IAO companies use most, shown first.
const COMMON = ["BE", "NL", "DE", "DK", "FR", "LU", "AT", "CH"];

/**
 * Country picker that stores the ISO-2 code (what Exact Online needs), never
 * free text. Type a letter to jump in the list.
 */
const CountrySelect = ({ value, onChange, disabled, id }) => {
  const { t } = useTranslation();
  const countries = useCountries();
  const common = COMMON.map((code) => countries.find((c) => c.iso2 === code)).filter(Boolean);
  const rest = countries.filter((c) => !COMMON.includes(c.iso2));
  const known = countries.some((c) => c.iso2 === value);

  return (
    <Select
      key={`${value || ""}-${countries.length}`}
      value={known ? value : ""}
      onValueChange={onChange}
      disabled={disabled || !countries.length}
    >
      <SelectTrigger className="w-full" id={id}>
        <SelectValue placeholder={t("companyEdit.countryPlaceholder", "Select country")} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {common.map((c) => (
          <SelectItem key={`common-${c.iso2}`} value={c.iso2}>
            {c.name} ({c.iso2})
          </SelectItem>
        ))}
        {common.length ? <SelectSeparator /> : null}
        {rest.map((c) => (
          <SelectItem key={c.iso2} value={c.iso2}>
            {c.name} ({c.iso2})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CountrySelect;
