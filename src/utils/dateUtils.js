import moment from "moment";


export const formatInKolkataTZ = (date, format) => {
  if (!date) return "";
  return moment.utc(date).format(format);
};

export const getKolkataMoment = (date) => {
 return moment.utc(date);
};

