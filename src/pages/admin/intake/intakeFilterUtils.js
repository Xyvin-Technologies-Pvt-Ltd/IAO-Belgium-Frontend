//* IPB-152: Intake view filters — defaults, session persistence and query params

export const DEFAULT_INTAKE_FILTERS = {
  status: "all",
  country: "all",
  city: "all",
  language: "all",
  program_type: "all",
  program_name: "",
  fee_min: "",
  fee_max: "",
  start_date_from: "",
  start_date_to: "",
  end_date_from: "",
  end_date_to: "",
  deadline_from: "",
  deadline_to: "",
};

//* Keyed per academic year so filters of one year don't carry over to another
const filtersKey = (academicId) => `intake_management_filters_${academicId}`;
const searchKey = (academicId) => `intake_management_search_${academicId}`;

export const loadStoredIntakeFilters = (academicId) => {
  try {
    const saved = sessionStorage.getItem(filtersKey(academicId));
    if (saved) {
      return { ...DEFAULT_INTAKE_FILTERS, ...JSON.parse(saved) };
    }
  } catch {
    // ignore invalid session data
  }
  return { ...DEFAULT_INTAKE_FILTERS };
};

export const saveStoredIntakeFilters = (academicId, filters) => {
  try {
    sessionStorage.setItem(filtersKey(academicId), JSON.stringify(filters));
  } catch {
    // ignore storage errors
  }
};

export const loadStoredIntakeSearch = (academicId) => {
  try {
    return sessionStorage.getItem(searchKey(academicId)) || "";
  } catch {
    return "";
  }
};

export const saveStoredIntakeSearch = (academicId, search) => {
  try {
    sessionStorage.setItem(searchKey(academicId), search);
  } catch {
    // ignore storage errors
  }
};

//* Country is only a helper to narrow the city list, it isn't sent or counted
const isFilterActive = (key, value) => {
  if (key === "country") return false;
  return value !== "all" && value !== "" && value != null;
};

export const countActiveIntakeFilters = (filters) => {
  const ranges = [
    ["fee_min", "fee_max"],
    ["start_date_from", "start_date_to"],
    ["end_date_from", "end_date_to"],
    ["deadline_from", "deadline_to"],
  ];
  const rangeKeys = ranges.flat();
  //* a range counts once, whether one or both ends are set
  const single = Object.entries(filters).filter(
    ([key, value]) => !rangeKeys.includes(key) && isFilterActive(key, value),
  ).length;
  const rangeCount = ranges.filter(([from, to]) => filters[from] || filters[to]).length;
  return single + rangeCount;
};

export const buildIntakeQueryFilters = (filters, { search } = {}) => {
  const query = {};
  if (search) query.search = search;
  Object.entries(filters).forEach(([key, value]) => {
    if (!isFilterActive(key, value)) return;
    query[key] = typeof value === "string" ? value.trim() : value;
  });
  return query;
};

//* "to" before "from" — dates are YYYY-MM-DD so they compare as strings
export const isDateRangeInvalid = (from, to) => Boolean(from && to && to < from);

export const isFeeRangeInvalid = (min, max) =>
  min !== "" && max !== "" && Number(max) < Number(min);

export const hasInvalidIntakeRange = (filters) =>
  isFeeRangeInvalid(filters.fee_min, filters.fee_max) ||
  isDateRangeInvalid(filters.start_date_from, filters.start_date_to) ||
  isDateRangeInvalid(filters.end_date_from, filters.end_date_to) ||
  isDateRangeInvalid(filters.deadline_from, filters.deadline_to);
