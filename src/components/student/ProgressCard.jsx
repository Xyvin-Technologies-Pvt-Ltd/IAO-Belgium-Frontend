const ProgressCard = ({
  title,
  totalLabel, 
  completed = 0, 
  total = 0, 
  message = "",
}) => {
  const progress = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="p-px bg-linear-to-b from-[#FFFFFF]/20 to-[#FFFFFF] rounded-[6px]">
      <div className="bg-[#D5D5D5] rounded-[6px] p-6 w-full space-y-4 min-h-50">
      <div className="flex items-center gap-3">
        <h3 className="text-2xl font-semibold">{title}</h3>
        {totalLabel && (
          <span className="px-4 py-2 rounded-2xl bg-[#EBEBEB] text-base font-semibold">
            {totalLabel}
          </span>
        )}
      </div>
      {message && <p className="text-base text-[#00A603]">{message}</p>}

      <div className="space-y-2">
        <div className="w-full h-3 bg-[#D9D9D9] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#39B0FF] rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-base text-muted-foreground">
          {completed} of {total} modules completed
        </p>
      </div>
    </div>
    </div>
  );
};

export default ProgressCard;
