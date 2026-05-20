import moment from "moment";

export const formatTZ = (date, format) => {
  if (!date) return "";
  return moment.utc(date).format(format);
};

export const getMoment = (date) => {
  return moment.utc(date);
};