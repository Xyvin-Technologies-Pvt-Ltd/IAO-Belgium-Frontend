import moment from "moment-timezone";

const CARD_TZ = "Europe/Brussels";
const IAO_LOGO = "/images/iao-logo.png";

const formatCardDate = (value) =>
  value ? moment.tz(value, CARD_TZ).format("DD.MM.YYYY") : "—";

/**
 * Front-only IAO identity card.
 * Teacher cards pass hideProgram / card.hide_program to omit the programme row.
 */
const IdCardFront = ({ card, muted = false, stamp = null, hideProgram = false }) => {
  const omitProgram = hideProgram || card?.hide_program;
  const validFrom = formatCardDate(card?.valid_from);
  const validUntil = formatCardDate(card?.valid_until);
  const lastName = (
    card?.student_last_name ||
    card?.teacher_last_name ||
    ""
  ).toUpperCase();
  const firstName =
    card?.student_first_name || card?.teacher_first_name || "";
  const initials = `${(firstName || "").charAt(0)}${(lastName || "").charAt(0)}`
    .toUpperCase()
    .trim();
  const uid = card?.student_uid || card?.teacher_uid || "—";
  const roleLabel =
    card?.teacher_role_label ||
    card?.student_role_label ||
    (omitProgram ? "Teacher" : "Student");
  const academicYearLabel =
    card?.academic?.name ||
    card?.academic_year ||
    (card?.valid_from && card?.valid_until
      ? `${moment.tz(card.valid_from, CARD_TZ).year()} – ${moment.tz(card.valid_until, CARD_TZ).year()}`
      : "—");

  return (
    <div
      className={`relative w-full max-w-xl mx-auto overflow-hidden rounded-2xl shadow-lg ${
        muted ? "opacity-70 grayscale" : ""
      }`}
      style={{
        aspectRatio: "85.6 / 54",
        background:
          "linear-gradient(135deg, #0a1a2e 0%, #1a3350 45%, #12243a 100%)",
        color: "#fff",
      }}
    >
      <img
        src={IAO_LOGO}
        alt=""
        aria-hidden
        className="pointer-events-none absolute -right-10 top-[42%] w-[42%] -translate-y-1/2 opacity-[0.07] object-contain"
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "repeating-linear-gradient(95deg, transparent 0 18px, rgba(255,255,255,0.04) 18px 19px)",
        }}
      />

      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-3 px-5 pt-3 pb-1">
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-2.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center">
                <img
                  src={IAO_LOGO}
                  alt="IAO"
                  className="h-full w-full object-contain"
                />
              </div>
              <p className="text-[10px] font-bold uppercase leading-tight tracking-wide text-white sm:text-[11px]">
                The International
                <br />
                Academy of Osteopathy
              </p>
            </div>
            <div className="ml-1 mt-1 h-0.5 w-9 rounded-full bg-[#ff8904]" />
          </div>
          <div className="shrink-0 pt-0.5 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#ff8904] sm:text-[11px]">
              {card?.identity_card_label ||
                (omitProgram
                  ? "Teacher Identity Card"
                  : "Student Identity Card")}
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-white/70">
              EST. 1987
            </p>
          </div>
        </div>

        <div className="relative flex flex-1 items-center gap-8 px-5 pb-3 pt-1 min-h-0 sm:gap-10">
          <div className="relative my-auto aspect-[3/4] h-[82%] max-h-[8.5rem] w-auto shrink-0 overflow-hidden rounded-2xl border-2 border-white/90 bg-[#f3d5b5] shadow-md">
            {card?.photo_url ? (
              <img
                src={card.photo_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-[#1D3547]/70">
                {initials || "—"}
              </div>
            )}
          </div>

          <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-center gap-3 py-1 pr-11">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-[#ff8904]">
                {card?.name_label || "Name"}
              </p>
              <p className="mt-1 truncate text-lg font-extrabold uppercase leading-none tracking-wide text-white sm:text-xl">
                {lastName ||
                  card?.student_name ||
                  card?.teacher_name ||
                  "—"}
              </p>
              {firstName ? (
                <p className="mt-1.5 truncate text-sm font-medium text-white sm:text-base">
                  {firstName}
                </p>
              ) : null}
            </div>

            {omitProgram ? (
              <div className="flex items-start gap-5 sm:gap-7">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-[#ff8904]">
                    {card?.id_label || "ID"}
                  </p>
                  <span className="mt-1.5 inline-flex rounded-full bg-[#ff8904] px-3.5 py-1 text-[11px] font-bold text-[#1D3547] sm:text-xs">
                    {uid}
                  </span>
                </div>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-[#ff8904]">
                    {card?.valid_from_label || "Valid from"}
                  </p>
                  <p className="mt-1.5 text-xs font-bold text-white sm:text-sm tracking-wide">
                    {validFrom}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-[#ff8904]">
                    {card?.valid_until_label || "Valid to"}
                  </p>
                  <p className="mt-1.5 text-xs font-bold text-white sm:text-sm tracking-wide">
                    {validUntil}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-[#ff8904]">
                    {card?.id_label || "Student ID"}
                  </p>
                  <span className="mt-1.5 inline-flex rounded-full bg-[#ff8904] px-3 py-1 text-[11px] font-bold text-[#1D3547] sm:text-xs">
                    {uid}
                  </span>
                </div>

                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-[#ff8904]">
                    {card?.program_label || "Program"}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-white sm:text-[15px]">
                    {card?.program?.name || card?.card_title || "—"}
                  </p>
                </div>
              </>
            )}
          </div>

          <img
            src={IAO_LOGO}
            alt=""
            aria-hidden
            className="absolute bottom-2 right-3 h-9 w-9 rounded-full object-contain opacity-90 ring-1 ring-white/20"
          />
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 bg-[#ff8904] px-5 py-2">
          {omitProgram ? (
            <p className="min-w-0 text-[10px] font-bold uppercase tracking-wide text-[#1D3547] sm:text-[11px]">
              <span className="font-semibold">
                {card?.academic_year_label || "Academic Year"}
              </span>{" "}
              <span className="font-extrabold">{academicYearLabel}</span>
            </p>
          ) : (
            <p className="min-w-0 text-[10px] font-bold uppercase tracking-wide text-[#1D3547] sm:text-[11px]">
              <span className="font-semibold">
                {card?.valid_from_label || "Valid from"}
              </span>{" "}
              <span className="font-extrabold">{validFrom}</span>
              <span className="mx-1.5 font-semibold">–</span>
              <span className="font-semibold">
                {card?.valid_until_label || "Valid until"}
              </span>{" "}
              <span className="font-extrabold">{validUntil}</span>
            </p>
          )}
          <p className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#1D3547]">
            {roleLabel}
          </p>
        </div>
      </div>

      {stamp ? (
        <div className="absolute bottom-12 right-3 rounded border border-white/40 bg-black/50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white">
          {stamp}
        </div>
      ) : null}
    </div>
  );
};

export default IdCardFront;
