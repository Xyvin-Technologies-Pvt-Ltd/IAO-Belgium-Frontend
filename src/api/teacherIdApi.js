import axiosInstance from "./axiosintercepter";

export const getMyTeacherId = async () => {
  const response = await axiosInstance.get("/teacher-id-card/me");
  return response.data;
};

export const submitTeacherIdPhoto = async (photo_key) => {
  const response = await axiosInstance.post("/teacher-id-card/me/submit", {
    photo_key,
  });
  return response.data;
};

export const getTeacherGoogleWalletSaveUrl = async () => {
  const response = await axiosInstance.get("/teacher-id-card/me/wallet/google");
  return response.data;
};

export const getTeacherIdCards = async (params = {}) => {
  const response = await axiosInstance.get("/teacher-id-card", { params });
  return response.data;
};

export const approveTeacherIdCard = async (id) => {
  const response = await axiosInstance.post(`/teacher-id-card/${id}/approve`);
  return response.data;
};

export const rejectTeacherIdCard = async (id, reason) => {
  const response = await axiosInstance.post(`/teacher-id-card/${id}/reject`, {
    reason,
  });
  return response.data;
};

export const revokeTeacherIdCard = async (id, reason) => {
  const response = await axiosInstance.post(`/teacher-id-card/${id}/revoke`, {
    reason,
  });
  return response.data;
};

export const reissueTeacherIdCard = async (id, photo_key) => {
  const body = {};
  if (photo_key) body.photo_key = photo_key;
  const response = await axiosInstance.post(
    `/teacher-id-card/${id}/reissue`,
    body,
  );
  return response.data;
};

export const checkIssueTeacherIdCard = async (user_id) => {
  const response = await axiosInstance.get("/teacher-id-card/issue-check", {
    params: { user_id },
  });
  return response.data;
};

export const issueTeacherIdCard = async ({ user_id, photo_key }) => {
  const response = await axiosInstance.post("/teacher-id-card/issue", {
    user_id,
    photo_key,
  });
  return response.data;
};

export const getTeacherIdUserActivity = async (userId) => {
  const response = await axiosInstance.get(
    `/teacher-id-card/user/${userId}/activity`,
  );
  return response.data;
};

export const getTeacherIdUserCard = async (userId) => {
  const response = await axiosInstance.get(
    `/teacher-id-card/user/${userId}/card`,
  );
  return response.data;
};
