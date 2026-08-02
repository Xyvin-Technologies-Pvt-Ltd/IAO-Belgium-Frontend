//* Read-only CoachView Archive API. Every function is a GET — this module has
//* no create/update/delete by design, mirroring the backend's read-only
//* src/modules/coachview-archive/. See docs/COACHVIEW_MIGRATION.md (backend repo).
import axiosInstance from "./axiosintercepter";

const unwrap = async (promise) => {
  try {
    const response = await promise;
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getArchiveStatus = () => unwrap(axiosInstance.get("/archive/status"));

export const getArchiveFacets = () => unwrap(axiosInstance.get("/archive/facets"));

// -- Persons ---------------------------------------------------------------

export const getArchivePersons = (params) =>
  unwrap(axiosInstance.get("/archive/persons", { params }));

export const getArchivePerson = (id) =>
  unwrap(axiosInstance.get(`/archive/persons/${id}`));

export const getArchivePersonEnrolments = (id, params) =>
  unwrap(axiosInstance.get(`/archive/persons/${id}/enrolments`, { params }));

export const getArchiveEnrolmentModules = (id, vraagId) =>
  unwrap(axiosInstance.get(`/archive/persons/${id}/enrolments/${vraagId}/modules`));

export const getArchivePersonResults = (id, params) =>
  unwrap(axiosInstance.get(`/archive/persons/${id}/results`, { params }));

export const getArchivePersonAttendance = (id, params) =>
  unwrap(axiosInstance.get(`/archive/persons/${id}/attendance`, { params }));

export const getArchivePersonInvoices = (id, params) =>
  unwrap(axiosInstance.get(`/archive/persons/${id}/invoices`, { params }));

// -- Catalogue ---------------------------------------------------------------

export const getArchiveProgrammes = (params) =>
  unwrap(axiosInstance.get("/archive/programmes", { params }));

export const getArchiveProgramme = (id) =>
  unwrap(axiosInstance.get(`/archive/programmes/${id}`));

export const getArchiveCohorts = (params) =>
  unwrap(axiosInstance.get("/archive/cohorts", { params }));

export const getArchiveCohort = (id) =>
  unwrap(axiosInstance.get(`/archive/cohorts/${id}`));

export const getArchiveSessions = (params) =>
  unwrap(axiosInstance.get("/archive/sessions", { params }));

// -- Invoices ---------------------------------------------------------------

export const getArchiveInvoices = (params) =>
  unwrap(axiosInstance.get("/archive/invoices", { params }));

export const getArchiveInvoice = (id) =>
  unwrap(axiosInstance.get(`/archive/invoices/${id}`));

// -- Generic entity browser --------------------------------------------------

export const getArchiveEntities = () => unwrap(axiosInstance.get("/archive/entities"));

export const getArchiveEntityRows = (entity, params) =>
  unwrap(axiosInstance.get(`/archive/entities/${entity}`, { params }));
