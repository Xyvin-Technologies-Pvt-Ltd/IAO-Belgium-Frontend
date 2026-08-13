export const DEFAULT_STUDENT_FILTERS = {
  country: "all",
  city: "all",
  language: "all",
  program: "all",
  batch: "all",
  status: "active",
  year_status: "all",
  payment_status: "all",
  payment_method: "all",
  module: "all",
  module_start_from: "",
  module_start_to: "",
  last_login_from: "",
  last_login_to: "",
  has_id_card: "all",
  has_qualification_certificate: "all",
  has_outstanding_invoices: false,
  has_missed_modules: false,
  has_unpurchased_modules: false,
  fachkursfoerderung: false,
};

export const STUDENT_MANAGEMENT_FILTERS_KEY = "student_management_filters";
export const STUDENT_MANAGEMENT_SEARCH_KEY = "student_management_search";

export const loadStoredStudentFilters = () => {
  try {
    const saved = sessionStorage.getItem(STUDENT_MANAGEMENT_FILTERS_KEY);
    if (saved) {
      return { ...DEFAULT_STUDENT_FILTERS, ...JSON.parse(saved) };
    }
  } catch {
    // ignore invalid session data
  }
  return { ...DEFAULT_STUDENT_FILTERS };
};

export const loadStoredStudentSearch = () =>
  sessionStorage.getItem(STUDENT_MANAGEMENT_SEARCH_KEY) || "";

export const buildStudentQueryFilters = (filters, { search, studentId } = {}) => {
  const query = {};

  if (search) query.search = search;
  if (studentId) query.student_id = studentId;
  if (filters.program !== "all") query.program = filters.program;
  if (filters.batch !== "all") query.batch = filters.batch;
  if (filters.status !== "all") query.status = filters.status;
  if (filters.year_status !== "all") query.year_status = filters.year_status;
  if (filters.payment_status !== "all") query.payment_status = filters.payment_status;
  if (filters.payment_method !== "all") query.payment_method = filters.payment_method;
  if (filters.module !== "all") query.module = filters.module;
  if (filters.module_start_from) query.module_start_from = filters.module_start_from;
  if (filters.module_start_to) query.module_start_to = filters.module_start_to;
  if (filters.last_login_from) query.last_login_from = filters.last_login_from;
  if (filters.last_login_to) query.last_login_to = filters.last_login_to;
  if (filters.has_id_card !== "all") query.has_id_card = filters.has_id_card;
  if (filters.has_qualification_certificate !== "all") {
    query.has_qualification_certificate = filters.has_qualification_certificate;
  }
  if (filters.has_outstanding_invoices) query.has_outstanding_invoices = true;
  if (filters.has_missed_modules) query.has_missed_modules = true;
  if (filters.has_unpurchased_modules) query.has_unpurchased_modules = true;
  if (filters.fachkursfoerderung) query.fachkursfoerderung = true;

  return query;
};

export const getThisWeekDateRange = () => {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const toInputDate = (date) => date.toISOString().slice(0, 10);
  return { from: toInputDate(monday), to: toInputDate(sunday) };
};
