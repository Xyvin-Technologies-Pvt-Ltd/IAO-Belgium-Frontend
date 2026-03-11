import moment from "moment-timezone";

/**
 * Formats a date or time string to a specific format using the Asia/Kolkata timezone.
 * @param {string|Date} date - The date or time to format.
 * @param {string} format - The moment format string (e.g., "YYYY-MM-DD", "HH:mm").
 * @returns {string} - The formatted date/time string.
 */
export const formatInKolkataTZ = (date, format) => {
  if (!date) return "";
  return moment(date).tz("Asia/Kolkata").format(format);
};

/**
 * Returns a moment object in the Asia/Kolkata timezone.
 * @param {string|Date} [date] - Optional date to parse.
 * @returns {moment.Moment} - The moment object.
 */
export const getKolkataMoment = (date) => {
  return moment(date).tz("Asia/Kolkata");
};
