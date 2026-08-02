//* Bilingual column headers, keyed by surface, shared by SortableTableHead
//* AND the CSV exporter — so a downloaded file's headers match the screen it
//* came from. Cell values (Actief/Active, Betaald/Paid, ...) use
//* BilingualLabel directly at the call site instead of a lookup table here.

export const COLUMN_LABELS = {
  students: {
    name: { nl: "Naam", en: "Name" },
    email: { nl: "E-mail", en: "Email" },
    phone: { nl: "Telefoon", en: "Phone" },
    city: { nl: "Plaats", en: "City" },
    country: { nl: "Land", en: "Country" },
    status: { nl: "Status", en: "Status" },
    changed: { nl: "Gewijzigd", en: "Last changed" },
  },
  programmes: {
    code: { nl: "Code", en: "Code" },
    name: { nl: "Naam", en: "Name" },
    level: { nl: "Niveau", en: "Level" },
    family: { nl: "Familie", en: "Family" },
    year: { nl: "Jaar", en: "Year" },
    status: { nl: "Status", en: "Status" },
  },
  cohorts: {
    code: { nl: "Code", en: "Code" },
    city: { nl: "Plaats", en: "City" },
    group: { nl: "Groep", en: "Group" },
    academic_year: { nl: "Studiejaar", en: "Academic year" },
    sessions: { nl: "Sessies", en: "Sessions" },
    students: { nl: "Studenten", en: "Students" },
  },
  invoices: {
    number: { nl: "Nummer", en: "Number" },
    student: { nl: "Student", en: "Student" },
    date: { nl: "Datum", en: "Date" },
    amount: { nl: "Bedrag", en: "Amount" },
    status: { nl: "Status", en: "Status" },
    description: { nl: "Omschrijving", en: "Description" },
  },
  entities: {
    entity: { nl: "Entiteit", en: "Entity" },
    what: { nl: "Wat het is", en: "What it is" },
    count: { nl: "Aantal rijen", en: "Row count" },
  },
  entity_rows: {
    key: { nl: "Sleutel", en: "Key" },
    changed: { nl: "Gewijzigd", en: "Last changed" },
  },
  enrolments: {
    programme: { nl: "Opleiding", en: "Programme" },
    level: { nl: "Niveau", en: "Level" },
    status: { nl: "Status", en: "Status" },
    cohort: { nl: "Cohort/plaats", en: "Cohort / city" },
    started: { nl: "Startdatum", en: "Started" },
    avg: { nl: "Gemiddeld resultaat", en: "Avg. result" },
  },
  results: {
    date: { nl: "Datum", en: "Date" },
    programme: { nl: "Opleiding", en: "Programme" },
    score: { nl: "Resultaat", en: "Score" },
    code: { nl: "Resultaatcode", en: "Grade code" },
    comment: { nl: "Opmerking", en: "Comment" },
  },
  attendance: {
    date: { nl: "Sessiedatum", en: "Session date" },
    session: { nl: "Sessie", en: "Session" },
    present: { nl: "Aanwezig", en: "Present" },
    passed: { nl: "Geslaagd", en: "Passed" },
    exam: { nl: "Examen", en: "Exam" },
  },
  person_invoices: {
    number: { nl: "Nummer", en: "Number" },
    date: { nl: "Datum", en: "Date" },
    description: { nl: "Omschrijving", en: "Description" },
    amount: { nl: "Bedrag", en: "Amount" },
    status: { nl: "Status", en: "Status" },
    paid_on: { nl: "Betaald op", en: "Paid on" },
  },
  programme_modules: {
    order: { nl: "#", en: "#" },
    code: { nl: "Code", en: "Code" },
    name: { nl: "Naam", en: "Name" },
    exam: { nl: "Examen", en: "Exam" },
    status: { nl: "Status", en: "Status" },
  },
  programme_cohorts: {
    code: { nl: "Code", en: "Code" },
    city: { nl: "Plaats", en: "City" },
    group: { nl: "Groep", en: "Group" },
    academic_year: { nl: "Studiejaar", en: "Academic year" },
  },
  cohort_sessions: {
    date: { nl: "Datum", en: "Date" },
    name: { nl: "Naam", en: "Name" },
    location: { nl: "Locatie", en: "Location" },
    exam: { nl: "Examen", en: "Exam" },
  },
  cohort_students: {
    name: { nl: "Naam", en: "Name" },
    email: { nl: "E-mail", en: "Email" },
  },
  invoice_lines: {
    description: { nl: "Omschrijving", en: "Description" },
    qty: { nl: "Aantal", en: "Qty" },
    unit_price: { nl: "Stuksprijs", en: "Unit price" },
    amount: { nl: "Bedrag", en: "Amount" },
    vat: { nl: "Btw", en: "VAT" },
    enrolment: { nl: "Gekoppelde opleidingsvraag", en: "Linked enrolment" },
  },
};

//* CSV headers as a single bilingual string per column, in the order given —
//* e.g. buildCsvHeaders("students", ["name","email","status"]) ->
//* ["Naam (Name)", "E-mail (Email)", "Status (Status)"]
export const buildCsvHeaders = (surface, keys) =>
  keys.map((key) => {
    const label = COLUMN_LABELS[surface]?.[key];
    if (!label) return key;
    return label.en && label.en !== label.nl ? `${label.nl} (${label.en})` : label.nl;
  });
