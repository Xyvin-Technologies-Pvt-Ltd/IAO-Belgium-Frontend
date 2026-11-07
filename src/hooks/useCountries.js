import { useEffect, useState } from "react";
import { getCountriesCached } from "@/utils/countriesCache";

/** Full country list (name + ISO-2), loaded once and shared. */
export function useCountries() {
  const [countries, setCountries] = useState([]);
  useEffect(() => {
    let cancelled = false;
    getCountriesCached()
      .then((list) => {
        if (!cancelled) setCountries(list.filter((c) => c?.iso2));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return countries;
}

/** Display name for a stored country value (ISO-2 → name), else the raw value. */
export function countryLabel(countries, value) {
  if (!value) return "";
  const hit = countries.find((c) => c.iso2 === String(value).toUpperCase() && String(value).length === 2);
  return hit ? `${hit.name} (${hit.iso2})` : String(value);
}

/** True when the stored value is a 2-letter ISO code from the list. */
export function isCountryCode(countries, value) {
  return Boolean(value) && String(value).length === 2 && countries.some((c) => c.iso2 === String(value).toUpperCase());
}
