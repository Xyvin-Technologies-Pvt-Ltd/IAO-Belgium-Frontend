import axiosInstance from "./axiosintercepter";

export const getStudentIdCards = async (params = {}) => {
  const response = await axiosInstance.get("/student-id-card", { params });
  return response.data;
};

export const getStudentIdEligibility = async () => {
  const response = await axiosInstance.get("/student-id-card/eligibility");
  return response.data;
};

export const updateStudentIdEligibility = async (types) => {
  const response = await axiosInstance.patch("/student-id-card/eligibility", {
    types,
  });
  return response.data;
};

export const approveStudentIdCard = async (id) => {
  const response = await axiosInstance.post(`/student-id-card/${id}/approve`);
  return response.data;
};

export const rejectStudentIdCard = async (id, reason) => {
  const response = await axiosInstance.post(`/student-id-card/${id}/reject`, {
    reason,
  });
  return response.data;
};

export const revokeStudentIdCard = async (id, reason) => {
  const response = await axiosInstance.post(`/student-id-card/${id}/revoke`, {
    reason,
  });
  return response.data;
};

export const reissueStudentIdCard = async (id, photo_key) => {
  const body = {};
  if (photo_key) body.photo_key = photo_key;
  const response = await axiosInstance.post(
    `/student-id-card/${id}/reissue`,
    body,
  );
  return response.data;
};

export const checkIssueStudentIdCard = async (user_id, application_id = null) => {
  const response = await axiosInstance.get("/student-id-card/issue-check", {
    params: {
      user_id,
      ...(application_id ? { application_id } : {}),
    },
  });
  return response.data;
};

export const issueStudentIdCard = async ({
  user_id,
  photo_key,
  application_id = null,
}) => {
  const response = await axiosInstance.post("/student-id-card/issue", {
    user_id,
    photo_key,
    ...(application_id ? { application_id } : {}),
  });
  return response.data;
};

export const getStudentIdApplicationActivity = async (applicationId) => {
  const response = await axiosInstance.get(
    `/student-id-card/application/${applicationId}/activity`,
  );
  return response.data;
};

export const getStudentIdApplicationCard = async (applicationId) => {
  const response = await axiosInstance.get(
    `/student-id-card/application/${applicationId}/card`,
  );
  return response.data;
};
