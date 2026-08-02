//* Dutch primary, English gloss in muted brackets — the treatment
//* ArchiveStatusBadge already used for CoachView statuses, extracted so
//* every bilingual label in the archive (column headers, filter options,
//* category names, ...) renders identically.
//*
//* Renders Dutch alone when there's nothing to gloss: `en` missing, or equal
//* to `nl` (case-insensitive) — never "Groep A (Groep A)".
const BilingualLabel = ({ nl, en, className = "" }) => {
  const show_en = en && en.trim() && en.trim().toLowerCase() !== String(nl).trim().toLowerCase();

  return (
    <span className={className}>
      {nl}
      {show_en && (
        <span className="ml-1 text-xs font-normal text-gray-400 dark:text-white/40">({en})</span>
      )}
    </span>
  );
};

export default BilingualLabel;
