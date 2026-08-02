import { useQuery } from "@tanstack/react-query";
import * as archiveApi from "@/api/archiveApi";

//* The snapshot backing the archive is frozen (see docs/COACHVIEW_MIGRATION.md
//* in the backend repo) — it never changes between refreshes, so there is no
//* reason to ever treat cached archive data as stale.
const ARCHIVE_STALE_TIME = Infinity;

export const useArchiveStatus = (options = {}) =>
  useQuery({
    queryKey: ["archive-status"],
    queryFn: archiveApi.getArchiveStatus,
    staleTime: 60000,
    ...options,
  });

//* Backend caches this for 6h server-side; the frontend caches it forever
//* per session on top of that — one fetch for the whole archive portal.
export const useArchiveFacets = (options = {}) =>
  useQuery({
    queryKey: ["archive-facets"],
    queryFn: archiveApi.getArchiveFacets,
    staleTime: ARCHIVE_STALE_TIME,
    gcTime: ARCHIVE_STALE_TIME,
    ...options,
  });

// -- LMS student pre-migration history ----------------------------------

//* enabled defaults to false: callers pass enabled only once they know the
//* student has a migration_ref, so non-migrated students never fire this.
export const useLmsStudentArchiveSummary = (applicationId, options = {}) =>
  useQuery({
    queryKey: ["archive-lms-student-summary", applicationId],
    queryFn: () => archiveApi.getLmsStudentArchiveSummary(applicationId),
    staleTime: ARCHIVE_STALE_TIME,
    enabled: false,
    ...options,
  });

// -- Persons -----------------------------------------------------------

export const useArchivePersons = (params, options = {}) =>
  useQuery({
    queryKey: ["archive-persons", params],
    queryFn: () => archiveApi.getArchivePersons(params),
    staleTime: ARCHIVE_STALE_TIME,
    placeholderData: (previous) => previous,
    ...options,
  });

export const useArchivePerson = (id, options = {}) =>
  useQuery({
    queryKey: ["archive-person", id],
    queryFn: () => archiveApi.getArchivePerson(id),
    staleTime: ARCHIVE_STALE_TIME,
    enabled: !!id,
    ...options,
  });

export const useArchivePersonEnrolments = (id, params, options = {}) =>
  useQuery({
    queryKey: ["archive-person-enrolments", id, params],
    queryFn: () => archiveApi.getArchivePersonEnrolments(id, params),
    staleTime: ARCHIVE_STALE_TIME,
    enabled: !!id,
    placeholderData: (previous) => previous,
    ...options,
  });

export const useArchiveEnrolmentModules = (id, vraagId, options = {}) =>
  useQuery({
    queryKey: ["archive-enrolment-modules", id, vraagId],
    queryFn: () => archiveApi.getArchiveEnrolmentModules(id, vraagId),
    staleTime: ARCHIVE_STALE_TIME,
    enabled: !!id && !!vraagId,
    ...options,
  });

export const useArchivePersonResults = (id, params, options = {}) =>
  useQuery({
    queryKey: ["archive-person-results", id, params],
    queryFn: () => archiveApi.getArchivePersonResults(id, params),
    staleTime: ARCHIVE_STALE_TIME,
    enabled: !!id,
    placeholderData: (previous) => previous,
    ...options,
  });

export const useArchivePersonAttendance = (id, params, options = {}) =>
  useQuery({
    queryKey: ["archive-person-attendance", id, params],
    queryFn: () => archiveApi.getArchivePersonAttendance(id, params),
    staleTime: ARCHIVE_STALE_TIME,
    enabled: !!id,
    placeholderData: (previous) => previous,
    ...options,
  });

export const useArchivePersonInvoices = (id, params, options = {}) =>
  useQuery({
    queryKey: ["archive-person-invoices", id, params],
    queryFn: () => archiveApi.getArchivePersonInvoices(id, params),
    staleTime: ARCHIVE_STALE_TIME,
    enabled: !!id,
    placeholderData: (previous) => previous,
    ...options,
  });

// -- Catalogue -----------------------------------------------------------

export const useArchiveProgrammes = (params, options = {}) =>
  useQuery({
    queryKey: ["archive-programmes", params],
    queryFn: () => archiveApi.getArchiveProgrammes(params),
    staleTime: ARCHIVE_STALE_TIME,
    placeholderData: (previous) => previous,
    ...options,
  });

export const useArchiveProgramme = (id, options = {}) =>
  useQuery({
    queryKey: ["archive-programme", id],
    queryFn: () => archiveApi.getArchiveProgramme(id),
    staleTime: ARCHIVE_STALE_TIME,
    enabled: !!id,
    ...options,
  });

export const useArchiveCohorts = (params, options = {}) =>
  useQuery({
    queryKey: ["archive-cohorts", params],
    queryFn: () => archiveApi.getArchiveCohorts(params),
    staleTime: ARCHIVE_STALE_TIME,
    placeholderData: (previous) => previous,
    ...options,
  });

export const useArchiveCohort = (id, options = {}) =>
  useQuery({
    queryKey: ["archive-cohort", id],
    queryFn: () => archiveApi.getArchiveCohort(id),
    staleTime: ARCHIVE_STALE_TIME,
    enabled: !!id,
    ...options,
  });

export const useArchiveSessions = (params, options = {}) =>
  useQuery({
    queryKey: ["archive-sessions", params],
    queryFn: () => archiveApi.getArchiveSessions(params),
    staleTime: ARCHIVE_STALE_TIME,
    placeholderData: (previous) => previous,
    ...options,
  });

// -- Invoices -----------------------------------------------------------

export const useArchiveInvoices = (params, options = {}) =>
  useQuery({
    queryKey: ["archive-invoices", params],
    queryFn: () => archiveApi.getArchiveInvoices(params),
    staleTime: ARCHIVE_STALE_TIME,
    placeholderData: (previous) => previous,
    ...options,
  });

export const useArchiveInvoice = (id, options = {}) =>
  useQuery({
    queryKey: ["archive-invoice", id],
    queryFn: () => archiveApi.getArchiveInvoice(id),
    staleTime: ARCHIVE_STALE_TIME,
    enabled: !!id,
    ...options,
  });

// -- Generic entity browser --------------------------------------------------

export const useArchiveEntities = (options = {}) =>
  useQuery({
    queryKey: ["archive-entities"],
    queryFn: archiveApi.getArchiveEntities,
    staleTime: ARCHIVE_STALE_TIME,
    ...options,
  });

export const useArchiveEntityRows = (entity, params, options = {}) =>
  useQuery({
    queryKey: ["archive-entity-rows", entity, params],
    queryFn: () => archiveApi.getArchiveEntityRows(entity, params),
    staleTime: ARCHIVE_STALE_TIME,
    enabled: !!entity,
    placeholderData: (previous) => previous,
    ...options,
  });
