import { GetCountries } from "react-country-state-city";

let countriesCache = null;
let countriesPromise = null;

/** Fetch countries once and reuse across remounts / StrictMode. */
export function getCountriesCached() {
  if (countriesCache) {
    return Promise.resolve(countriesCache);
  }
  if (!countriesPromise) {
    countriesPromise = GetCountries()
      .then((result) => {
        countriesCache = Array.isArray(result) ? result : [];
        return countriesCache;
      })
      .catch((err) => {
        countriesPromise = null;
        throw err;
      });
  }
  return countriesPromise;
}
