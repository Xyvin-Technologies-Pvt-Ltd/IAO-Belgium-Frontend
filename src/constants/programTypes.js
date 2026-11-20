export const PROGRAM_TYPES = [
  "Master of Science",
  "Lateral Entry Master of Science",
  "Diploma",
  "Manual Therapie",
  "Post Academic Module",
];

/** Accounting-mapping-only — not used on Create Program / Program Type Config. */
export const STANDALONE_MODULE_PROGRAM_TYPE = "Standalone Module";

export const ACCOUNTING_PROGRAM_TYPES = [
  ...PROGRAM_TYPES,
  STANDALONE_MODULE_PROGRAM_TYPE,
];

export const PROGRAM_TYPE_I18N_KEYS = {
  "Master of Science": "programManagement.modal.programTypes.masterOfScience",
  "Lateral Entry Master of Science":
    "programManagement.modal.programTypes.lateralEntry",
  Diploma: "programManagement.modal.programTypes.diploma",
  "Manual Therapie": "programManagement.modal.programTypes.manualTherapie",
  "Post Academic Module": "programManagement.modal.programTypes.postAcademic",
};
