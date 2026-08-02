import BilingualLabel from "./BilingualLabel";

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
  const color = STATUS_COLORS[status] || "text-gray-800";

  return <BilingualLabel nl={status} en={STATUS_LABELS[status]} className={`font-medium ${color}`} />;
};

export default ArchiveStatusBadge;
