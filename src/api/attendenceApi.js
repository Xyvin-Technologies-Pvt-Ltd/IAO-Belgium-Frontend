import axiosInstance from "./axiosintercepter";

export const markAttendance = async (data) => {
  const response = await axiosInstance.post("/student/attendance/mark", data);
  return response.data;
};
