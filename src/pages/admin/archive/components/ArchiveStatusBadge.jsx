//* CoachView status ids, shown verbatim (Dutch, primary) with an English
//* gloss underneath — display only, never used to derive pass/fail. See the
//* backend's archive.constants.js STATUS_LABELS for the source of truth.
const STATUS_LABELS = {
  Afgerond: "Completed",
  Ingepland: "Planned",
  Vervallen: "Cancelled",
  Wachtlijst: "Waitlist",
};

const STATUS_COLORS = {
  Afgerond: "text-green-600",
  Ingepland: "text-blue-600",
  Vervallen: "text-red-600",
  Wachtlijst: "text-amber-600",
};

const ArchiveStatusBadge = ({ status }) => {
  if (!status) return <span className="text-gray-400">—</span>;
  const gloss = STATUS_LABELS[status];
  const color = STATUS_COLORS[status] || "text-gray-800";

  return (
    <span className={`font-medium ${color}`}>
      {status}
      {gloss && (
        <span className="ml-1 text-xs font-normal text-gray-400 dark:text-white/40">
          ({gloss})
        </span>
      )}
    </span>
  );
};

export default ArchiveStatusBadge;
