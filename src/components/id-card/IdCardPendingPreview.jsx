const IdCardPendingPreview = ({ card }) => {
  const lastName =
    card?.teacher_last_name || card?.student_last_name || "";
  const firstName =
    card?.teacher_first_name || card?.student_first_name || "";
  const displayName =
    [lastName, firstName].filter(Boolean).join(" ") ||
    card?.teacher_name ||
    card?.student_name ||
    "—";

  return (
    <div className="w-full max-w-xl mx-auto overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm dark:border-white/20 dark:bg-white">
      <div className="flex min-h-[11rem]">
        <div className="w-3 shrink-0 bg-[#5a6570] sm:w-3.5" />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="bg-[#e8eaed] px-4 py-3">
            <p className="text-center text-[11px] font-bold uppercase tracking-wide text-[#3d4650] sm:text-xs">
              The International Academy of Osteopathy
            </p>
          </div>
          <div className="flex flex-1 items-start gap-4 px-4 py-4 sm:gap-5 sm:px-5">
            <div className="flex h-24 w-20 shrink-0 items-center justify-center border border-gray-400 bg-[#d1d5db] text-sm text-gray-500 sm:h-28 sm:w-24">
              Photo
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-base font-bold text-[#3d4650] sm:text-lg">
                {card?.card_title ||
                  card?.identity_card_label ||
                  "Teacher Identity Card"}
              </p>
              <p className="mt-4 text-xs text-gray-500">
                {card?.name_label || "Name"}
              </p>
              <p className="mt-1 text-sm font-bold text-[#3d4650] sm:text-base">
                {displayName}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdCardPendingPreview;
