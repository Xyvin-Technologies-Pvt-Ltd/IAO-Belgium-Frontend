import moment from "moment-timezone";

const DISPLAY_TZ = "Europe/Brussels";

// Session/planning times are stored as UTC wall-clock values — keep UTC formatting.
export const formatTZ = (date, format) => {
  if (!date) return "";
  return moment.utc(date).format(format);
};

export const getMoment = (date) => {
  return moment.utc(date);
};

// Real UTC instants (e.g. createdAt, paid_at) — show in app timezone.
export const formatInstant = (date, format = "DD-MM-YYYY, HH:mm") => {
  if (!date) return "";
  return moment(date).tz(DISPLAY_TZ).format(format);
};