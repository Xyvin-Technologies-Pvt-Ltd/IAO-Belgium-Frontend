const SUPPORTED = ["en", "nl", "fr", "de"];

const LABELS = {
  en: {
    title: "Expense Note",
    issuedBy: "Issued By",
    proformaNo: "Pro-forma No.",
    date: "Date",
    lecturer: "Lecturer",
    contact: "Contact",
    role: "Role",
    bankAccount: "Bank account",
    additionalInfo1: "Additional info 1",
    additionalInfo2: "Additional info 2",
    program: "Program",
    module: "Module",
    venue: "Venue",
    dates: "Dates",
    region: "Region",
    items: "Items",
    amount: "Amount",
    total: "Total",
    signature: "Signature",
    signaturePending: "Signature pending",
    signedOn: "Electronically signed on",
    approvedForFinance: "Approved for finance",
    teachingFee: "Teaching fee",
    travelFixed: "Travel (fixed module)",
    travel: (mode) => `Travel (${mode})`,
    mealAllowance: "Meal allowance",
    accommodation: "Accommodation",
    miscellaneous: "Miscellaneous",
  },
  nl: {
    title: "Onkostennota",
    issuedBy: "Uitgegeven door",
    proformaNo: "Pro-forma nr.",
    date: "Datum",
    lecturer: "Docent",
    contact: "Contactpersoon",
    role: "Rol",
    bankAccount: "Bankrekening",
    additionalInfo1: "Extra info 1",
    additionalInfo2: "Extra info 2",
    program: "Opleiding",
    module: "Module",
    venue: "Locatie",
    dates: "Data",
    region: "Regio",
    items: "Posten",
    amount: "Bedrag",
    total: "Totaal",
    signature: "Handtekening",
    signaturePending: "Handtekening in afwachting",
    signedOn: "Elektronisch ondertekend op",
    approvedForFinance: "Goedgekeurd voor financiën",
    teachingFee: "Lesvergoeding",
    travelFixed: "Reis (vaste module)",
    travel: (mode) => `Reis (${mode})`,
    mealAllowance: "Maaltijdvergoeding",
    accommodation: "Verblijf",
    miscellaneous: "Diversen",
  },
  fr: {
    title: "Note de frais",
    issuedBy: "Émise par",
    proformaNo: "N° pro forma",
    date: "Date",
    lecturer: "Enseignant",
    contact: "Personne de contact",
    role: "Rôle",
    bankAccount: "Compte bancaire",
    additionalInfo1: "Info supplémentaire 1",
    additionalInfo2: "Info supplémentaire 2",
    program: "Programme",
    module: "Module",
    venue: "Lieu",
    dates: "Dates",
    region: "Région",
    items: "Postes",
    amount: "Montant",
    total: "Total",
    signature: "Signature",
    signaturePending: "Signature en attente",
    signedOn: "Signé électroniquement le",
    approvedForFinance: "Approuvé pour la finance",
    teachingFee: "Honoraires d'enseignement",
    travelFixed: "Déplacement (module fixe)",
    travel: (mode) => `Déplacement (${mode})`,
    mealAllowance: "Indemnité repas",
    accommodation: "Hébergement",
    miscellaneous: "Divers",
  },
  de: {
    title: "Kostenaufstellung",
    issuedBy: "Ausgestellt von",
    proformaNo: "Proforma-Nr.",
    date: "Datum",
    lecturer: "Dozent",
    contact: "Kontaktperson",
    role: "Rolle",
    bankAccount: "Bankkonto",
    additionalInfo1: "Zusatzinfo 1",
    additionalInfo2: "Zusatzinfo 2",
    program: "Programm",
    module: "Modul",
    venue: "Ort",
    dates: "Daten",
    region: "Region",
    items: "Positionen",
    amount: "Betrag",
    total: "Gesamt",
    signature: "Unterschrift",
    signaturePending: "Unterschrift ausstehend",
    signedOn: "Elektronisch unterschrieben am",
    approvedForFinance: "Für Finanzen freigegeben",
    teachingFee: "Unterrichtshonorar",
    travelFixed: "Reise (feste Modulvergütung)",
    travel: (mode) => `Reise (${mode})`,
    mealAllowance: "Verpflegungspauschale",
    accommodation: "Unterkunft",
    miscellaneous: "Sonstiges",
  },
};

export function resolveProformaInvoiceLocale(proforma) {
  const planning = proforma?.planning_id || {};
  const program =
    planning?.component?.program ||
    planning?.batch?.intake?.program ||
    null;
  const raw =
    program?.language?.code ||
    program?.language_code ||
    (typeof program?.language === "string" ? program.language : null) ||
    "";
  const code = String(raw).trim().toLowerCase();
  return SUPPORTED.includes(code) ? code : "en";
}

export function proformaInvoiceLabels(locale) {
  const code = SUPPORTED.includes(locale) ? locale : "en";
  return LABELS[code] || LABELS.en;
}

export function localizedItemLabel(item, t) {
  if (item.item_type === "TEACHING") return t.teachingFee;
  if (item.item_type === "TRAVEL") {
    const mode = String(item.travel_mode || "ROAD").toUpperCase();
    if (mode === "FIXED") return t.travelFixed;
    return t.travel(mode.toLowerCase());
  }
  if (item.item_type === "FOOD") return t.mealAllowance;
  if (item.item_type === "STAY") return t.accommodation;
  return item.description || t.miscellaneous;
}
