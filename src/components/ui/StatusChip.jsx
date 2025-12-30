const STATUS_STYLES = {
  paid: "bg-[#00B300]/10 text-[#00B300]",
  pass: "bg-[#00B300]/10 text-[#00B300]",
  submitted: "bg-[#00B300]/10 text-[#00B300]",
  notsubmitted: "bg-[#B32400]/10 text-[#B32400]",
  ongoing: "bg-primary/10 text-primary",
  unpaid: "bg-red-500/10 text-red-600",
  pending: "bg-yellow-500/10 text-yellow-600",
  cancelled: "bg-gray-500/10 text-gray-600",
  available: "bg-[#00B300]/5 text-[#00B300]",
  unavailable: "bg-[#FF2600]/10 text-[#FF2600]",
};

const StatusChip = ({ status = "paid", label }) => {
  const key = status.toLowerCase();

  return (
    <span
      className={`px-4 py-2 rounded-[6px] font-bold text-center text-sm inline-flex items-center justify-center capitalize
        ${STATUS_STYLES[key] || "bg-gray-200 text-gray-700"}
      `}
    >
      {label || status}
    </span>
  );
};

export default StatusChip;
