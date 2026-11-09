import {
  createThesis,
  getThesisById,
  getTheses,
  updateThesis,
  updateThesisStatus,
  getThesisRoles,
  createThesisRole,
  updateThesisRole,
  deleteThesisRole,
  getThesisTeachers,
  assignThesisTeacher,
  createExternalThesisTeacher,
  updateExternalThesisTeacher,
  updateThesisTeacherRole,
  removeThesisTeacher,
  getThesisSteps,
  saveThesisSteps,
  getTrajectories,
  createTrajectory,
  updateTrajectory,
  deleteTrajectory,
  getThesisDeadlines,
  saveThesisDeadlines,
  getTrajectoryStudents,
  getTrajectoryFormData,
  exportTrajectoryFormDataCsv,
  getThesisEligibleStudents,
  exportTrajectoryStudentsCsv,
  exportThesisEligibleStudentsCsv,
  addThesisEligibleStudents,
  removeThesisEligibleStudent,
  getTrajectoryStudentDetail,
  updateTrajectoryStudentReader,
  updateTrajectoryStudentAdditionalReader,
  updateTrajectoryStudentSupervisor,
  updateTrajectoryStudentAttemptStatus,
  reenrollTrajectoryStudent,
  moveTrajectoryEnrolment,
  updateTrajectoryStudentStepDeadline,
  uploadStaffThesisDocument,
  renameStaffThesisDocument,
  deleteStaffThesisDocument,
  createStudentPersonalNote,
  getStudentPersonalNotes,
  getAdminStudentTheses,
  getTrajectoryQnaAnnouncements,
  getTrajectoryQnaAnnouncementById,
  createTrajectoryQnaAnnouncement,
  updateTrajectoryQnaAnnouncement,
  deleteTrajectoryQnaAnnouncement,
} from "@/api/thesisApi";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const triggerBlobDownload = (blobData, filename) => {
  const url = window.URL.createObjectURL(new Blob([blobData]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const useGetTheses = (filter, options = {}) => {
  return useQuery({
    queryKey: ["theses", filter],
    queryFn: () => getTheses(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetThesisById = (id, options = {}) => {
  const { type, ...queryOptions } = options;
  return useQuery({
    queryKey: ["thesis", id, type || "any"],
    queryFn: () => getThesisById(id, type ? { type } : {}),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    enabled: !!id,
    ...queryOptions,
  });
};

export const useCreateThesis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createThesis,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["theses"] });
      toast.success(response?.message || "Thesis created successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create thesis");
    },
  });
};

export const useUpdateThesis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateThesis(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["theses"] });
      queryClient.invalidateQueries({ queryKey: ["thesis", variables.id] });
      toast.success(response?.message || "Thesis updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update thesis");
    },
  });
};

export const useUpdateThesisStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) => updateThesisStatus(id, status),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["theses"] });
      queryClient.invalidateQueries({ queryKey: ["thesis", variables.id] });
      toast.success(response?.message || "Thesis status updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update thesis status");
    },
  });
};

export const useGetThesisRoles = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["thesis-roles", params],
    queryFn: () => getThesisRoles(params),
    staleTime: 60000,
    ...options,
  });
};

export const useCreateThesisRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createThesisRole(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["thesis-roles"] });
      queryClient.invalidateQueries({ queryKey: ["thesis-teachers"] });
      toast.success(response?.message || "Role created successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create role");
    },
  });
};

export const useUpdateThesisRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }) => updateThesisRole(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["thesis-roles"] });
      queryClient.invalidateQueries({ queryKey: ["thesis-teachers"] });
      toast.success(response?.message || "Role updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update role");
    },
  });
};

export const useDeleteThesisRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deleteThesisRole(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["thesis-roles"] });
      queryClient.invalidateQueries({ queryKey: ["thesis-teachers"] });
      toast.success(response?.message || "Role deactivated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to deactivate role");
    },
  });
};

export const useGetThesisTeachers = (thesisId, filter = {}, options = {}) => {
  return useQuery({
    queryKey: ["thesis-teachers", thesisId, filter],
    queryFn: () => getThesisTeachers(thesisId, filter),
    enabled: !!thesisId,
    staleTime: 10000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useAssignThesisTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ thesisId, teacherId, teacherIds }) =>
      assignThesisTeacher(thesisId, {
        ...(teacherIds ? { teachers: teacherIds } : {}),
        ...(teacherId ? { teacher: teacherId } : {}),
      }),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["thesis-teachers", variables.thesisId],
      });
      toast.success(response?.message || "Teacher assigned successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to assign teacher");
    },
  });
};

export const useCreateExternalThesisTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ thesisId, ...data }) =>
      createExternalThesisTeacher(thesisId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["thesis-teachers", variables.thesisId],
      });
      toast.success(response?.message || "External teacher added successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to add external teacher");
    },
  });
};

export const useUpdateExternalThesisTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ thesisId, assignmentId, ...data }) =>
      updateExternalThesisTeacher(thesisId, assignmentId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["thesis-teachers", variables.thesisId],
      });
      toast.success(response?.message || "External teacher updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update external teacher");
    },
  });
};

export const useUpdateThesisTeacherRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ thesisId, assignmentId, role, enabled }) =>
      updateThesisTeacherRole(thesisId, assignmentId, { role, enabled }),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["thesis-teachers", variables.thesisId],
      });
      toast.success(response?.message || "Role updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update role");
    },
  });
};

export const useRemoveThesisTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ thesisId, assignmentId }) =>
      removeThesisTeacher(thesisId, assignmentId),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["thesis-teachers", variables.thesisId],
      });
      toast.success(response?.message || "Teacher removed successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to remove teacher");
    },
  });
};

export const useGetThesisSteps = (thesisId, options = {}) => {
  return useQuery({
    queryKey: ["thesis-steps", thesisId],
    queryFn: () => getThesisSteps(thesisId),
    enabled: !!thesisId,
    staleTime: 10000,
    ...options,
  });
};

export const useSaveThesisSteps = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ thesisId, steps, version }) =>
      saveThesisSteps(thesisId, { steps, version }),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["thesis-steps", variables.thesisId],
      });
      queryClient.invalidateQueries({
        queryKey: ["thesis", variables.thesisId],
      });
      toast.success(response?.message || "Thesis steps saved successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to save thesis steps");
    },
  });
};

export const useGetThesisTrajectories = (thesisId, options = {}) => {
  return useQuery({
    queryKey: ["thesis-trajectories", thesisId],
    queryFn: () => getTrajectories(thesisId),
    enabled: !!thesisId,
    staleTime: 10000,
    ...options,
  });
};

export const useCreateThesisTrajectory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ thesisId, data }) => createTrajectory(thesisId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["thesis-trajectories", variables.thesisId],
      });
      queryClient.invalidateQueries({
        queryKey: ["thesis-deadlines", variables.thesisId],
      });
      toast.success(response?.message || "Trajectory created successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create trajectory");
    },
  });
};

export const useUpdateThesisTrajectory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ thesisId, trajectoryId, data }) =>
      updateTrajectory(thesisId, trajectoryId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["thesis-trajectories", variables.thesisId],
      });
      queryClient.invalidateQueries({
        queryKey: ["thesis-deadlines", variables.thesisId],
      });
      toast.success(response?.message || "Trajectory updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update trajectory");
    },
  });
};

export const useDeleteThesisTrajectory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ thesisId, trajectoryId }) =>
      deleteTrajectory(thesisId, trajectoryId),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["thesis-trajectories", variables.thesisId],
      });
      queryClient.invalidateQueries({
        queryKey: ["thesis-deadlines", variables.thesisId],
      });
      toast.success(response?.message || "Trajectory deleted successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete trajectory");
    },
  });
};

export const useGetThesisDeadlines = (thesisId, options = {}) => {
  return useQuery({
    queryKey: ["thesis-deadlines", thesisId],
    queryFn: () => getThesisDeadlines(thesisId),
    enabled: !!thesisId,
    staleTime: 10000,
    ...options,
  });
};

export const useSaveThesisDeadlines = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ thesisId, deadlines }) =>
      saveThesisDeadlines(thesisId, { deadlines }),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["thesis-deadlines", variables.thesisId],
      });
      toast.success(response?.message || "Deadlines saved successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to save deadlines");
    },
  });
};

export const useGetTrajectoryStudents = (
  thesisId,
  trajectoryId,
  params = {},
  options = {}
) => {
  return useQuery({
    queryKey: ["thesis-trajectory-students", thesisId, trajectoryId, params],
    queryFn: () => getTrajectoryStudents(thesisId, trajectoryId, params),
    enabled: !!thesisId && !!trajectoryId,
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
    ...options,
  });
};

export const useGetTrajectoryFormData = (
  thesisId,
  trajectoryId,
  params = {},
  options = {}
) => {
  const { enabled = true, ...queryOptions } = options;
  return useQuery({
    queryKey: ["thesis-trajectory-form-data", thesisId, trajectoryId, params],
    queryFn: () => getTrajectoryFormData(thesisId, trajectoryId, params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
    ...queryOptions,
    enabled: Boolean(thesisId && trajectoryId && enabled),
  });
};

export const useExportTrajectoryFormDataCsv = () => {
  return useMutation({
    mutationFn: ({ thesisId, trajectoryId, params = {} }) =>
      exportTrajectoryFormDataCsv(thesisId, trajectoryId, params),
    onSuccess: (data) => {
      triggerBlobDownload(data, `trajectory-form-data-${Date.now()}.csv`);
      toast.success("Form data CSV exported successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to export form data CSV");
    },
  });
};

export const useGetThesisEligibleStudents = (
  thesisId,
  params = {},
  options = {}
) => {
  return useQuery({
    queryKey: ["thesis-eligible-students", thesisId, params],
    queryFn: () => getThesisEligibleStudents(thesisId, params),
    enabled: !!thesisId,
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
    ...options,
  });
};

/** @deprecated Use useGetThesisEligibleStudents */
export const useGetTrajectoryEligibleStudents = (
  thesisId,
  _trajectoryId,
  params = {},
  options = {}
) => useGetThesisEligibleStudents(thesisId, params, options);

export const useExportTrajectoryStudentsCsv = () => {
  return useMutation({
    mutationFn: ({ thesisId, trajectoryId, params = {} }) =>
      exportTrajectoryStudentsCsv(thesisId, trajectoryId, params),
    onSuccess: (data) => {
      triggerBlobDownload(
        data,
        `trajectory-enrolled-${Date.now()}.csv`
      );
      toast.success("Enrolled students CSV exported successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to export enrolled students CSV");
    },
  });
};

export const useExportThesisEligibleStudentsCsv = () => {
  return useMutation({
    mutationFn: ({ thesisId, params = {} }) =>
      exportThesisEligibleStudentsCsv(thesisId, params),
    onSuccess: (data) => {
      triggerBlobDownload(data, `thesis-eligible-${Date.now()}.csv`);
      toast.success("Eligible students CSV exported successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to export eligible students CSV");
    },
  });
};

/** @deprecated Use useExportThesisEligibleStudentsCsv */
export const useExportTrajectoryEligibleStudentsCsv =
  useExportThesisEligibleStudentsCsv;

export const useAddThesisEligibleStudents = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ thesisId, userIds }) =>
      addThesisEligibleStudents(thesisId, userIds),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["thesis-eligible-students", variables.thesisId],
      });
      toast.success(
        response?.message || "Eligible students added successfully"
      );
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to add eligible students");
    },
  });
};

/** @deprecated Use useAddThesisEligibleStudents */
export const useAddTrajectoryEligibleStudents = useAddThesisEligibleStudents;

export const useRemoveThesisEligibleStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ thesisId, userId }) =>
      removeThesisEligibleStudent(thesisId, userId),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["thesis-eligible-students", variables.thesisId],
      });
      toast.success(
        response?.message || "Eligible student removed successfully"
      );
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to remove eligible student");
    },
  });
};

/** @deprecated Use useRemoveThesisEligibleStudent */
export const useRemoveTrajectoryEligibleStudent =
  useRemoveThesisEligibleStudent;

export const useGetTrajectoryStudentDetail = (
  thesisId,
  trajectoryId,
  userId,
  options = {}
) => {
  return useQuery({
    queryKey: ["thesis-trajectory-student-detail", thesisId, trajectoryId, userId],
    queryFn: () => getTrajectoryStudentDetail(thesisId, trajectoryId, userId),
    enabled: !!thesisId && !!trajectoryId && !!userId,
    staleTime: 10000,
    ...options,
  });
};

export const useUpdateTrajectoryStudentReader = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ thesisId, trajectoryId, userId, reader }) =>
      updateTrajectoryStudentReader(thesisId, trajectoryId, userId, { reader }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "thesis-trajectory-student-detail",
          variables.thesisId,
          variables.trajectoryId,
          variables.userId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["thesis-trajectory-students", variables.thesisId, variables.trajectoryId],
      });
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update reader");
    },
  });
};

export const useUpdateTrajectoryStudentAdditionalReader = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ thesisId, trajectoryId, userId, additional_reader }) =>
      updateTrajectoryStudentAdditionalReader(thesisId, trajectoryId, userId, {
        additional_reader,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "thesis-trajectory-student-detail",
          variables.thesisId,
          variables.trajectoryId,
          variables.userId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "thesis-trajectory-students",
          variables.thesisId,
          variables.trajectoryId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["thesis-evaluation"],
      });
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update additional reader");
    },
  });
};

export const useUpdateTrajectoryStudentSupervisor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ thesisId, trajectoryId, userId, supervisor, status }) =>
      updateTrajectoryStudentSupervisor(thesisId, trajectoryId, userId, { supervisor, status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "thesis-trajectory-student-detail",
          variables.thesisId,
          variables.trajectoryId,
          variables.userId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["thesis-trajectory-students", variables.thesisId, variables.trajectoryId],
      });
      toast.success(
        variables.supervisor
          ? "Supervisor updated successfully"
          : "Supervisor cleared successfully"
      );
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update supervisor");
    },
  });
};

export const useUpdateTrajectoryStudentAttemptStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ thesisId, trajectoryId, userId, status, reason }) =>
      updateTrajectoryStudentAttemptStatus(thesisId, trajectoryId, userId, {
        status,
        reason,
      }),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "thesis-trajectory-student-detail",
          variables.thesisId,
          variables.trajectoryId,
          variables.userId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["thesis-trajectory-students", variables.thesisId, variables.trajectoryId],
      });
      toast.success(response?.message || `Marked as ${variables.status}`);
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update attempt status");
    },
  });
};

export const useReenrollTrajectoryStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ thesisId, trajectoryId, userId, targetThesisId }) =>
      reenrollTrajectoryStudent(thesisId, trajectoryId, userId, {
        ...(targetThesisId ? { thesis_id: targetThesisId } : {}),
      }),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "thesis-trajectory-student-detail",
          variables.thesisId,
          variables.trajectoryId,
          variables.userId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "thesis-trajectory-students",
          variables.thesisId,
          variables.trajectoryId,
        ],
      });
      const targetThesisId = variables.targetThesisId || variables.thesisId;
      queryClient.invalidateQueries({
        queryKey: ["thesis-eligible-students", targetThesisId],
      });
      queryClient.invalidateQueries({
        queryKey: ["thesis-eligible-students", variables.thesisId],
      });
      queryClient.invalidateQueries({
        queryKey: ["thesis-trajectories", variables.thesisId],
      });
      toast.success(
        response?.message ||
          "Student added as eligible on the selected thesis"
      );
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to re-enrol student");
    },
  });
};

export const useMoveTrajectoryEnrolment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ thesisId, trajectoryId, userId, targetTrajectoryId }) =>
      moveTrajectoryEnrolment(thesisId, trajectoryId, userId, {
        trajectory_id: targetTrajectoryId,
      }),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "thesis-trajectory-student-detail",
          variables.thesisId,
          variables.trajectoryId,
          variables.userId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "thesis-trajectory-students",
          variables.thesisId,
          variables.trajectoryId,
        ],
      });
      if (variables.targetTrajectoryId) {
        queryClient.invalidateQueries({
          queryKey: [
            "thesis-trajectory-student-detail",
            variables.thesisId,
            String(variables.targetTrajectoryId),
            variables.userId,
          ],
        });
        queryClient.invalidateQueries({
          queryKey: [
            "thesis-trajectory-students",
            variables.thesisId,
            String(variables.targetTrajectoryId),
          ],
        });
        queryClient.invalidateQueries({
          queryKey: ["thesis-eligible-students", variables.thesisId],
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["thesis-trajectories", variables.thesisId],
      });
      toast.success(
        response?.message || "Enrolment moved to the selected trajectory"
      );
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to move enrolment");
    },
  });
};

export const useUpdateTrajectoryStudentStepDeadline = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ thesisId, trajectoryId, userId, stepId, deadline_date }) =>
      updateTrajectoryStudentStepDeadline(
        thesisId,
        trajectoryId,
        userId,
        stepId,
        { deadline_date }
      ),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "thesis-trajectory-student-detail",
          variables.thesisId,
          variables.trajectoryId,
          variables.userId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["thesis-trajectory-students", variables.thesisId, variables.trajectoryId],
      });
      toast.success(response?.message || "Deadline updated");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update deadline");
    },
  });
};

export const useUploadStaffThesisDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ thesisId, trajectoryId, userId, stepId, data }) =>
      uploadStaffThesisDocument(thesisId, trajectoryId, userId, stepId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "thesis-trajectory-student-detail",
          variables.thesisId,
          variables.trajectoryId,
          variables.userId,
        ],
      });
      const isLink = variables?.data?.kind === "link";
      toast.success(
        isLink ? "Link added successfully" : "Document uploaded successfully"
      );
    },
    onError: (error, variables) => {
      const isLink = variables?.data?.kind === "link";
      toast.error(
        error?.message ||
          (isLink ? "Failed to add link" : "Failed to upload document")
      );
    },
  });
};

export const useRenameStaffThesisDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ thesisId, trajectoryId, userId, stepId, documentId, name }) =>
      renameStaffThesisDocument(thesisId, trajectoryId, userId, stepId, documentId, { name }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "thesis-trajectory-student-detail",
          variables.thesisId,
          variables.trajectoryId,
          variables.userId,
        ],
      });
      toast.success("Document renamed successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to rename document");
    },
  });
};

export const useDeleteStaffThesisDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ thesisId, trajectoryId, userId, stepId, documentId }) =>
      deleteStaffThesisDocument(thesisId, trajectoryId, userId, stepId, documentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "thesis-trajectory-student-detail",
          variables.thesisId,
          variables.trajectoryId,
          variables.userId,
        ],
      });
      toast.success("Document deleted successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete document");
    },
  });
};

export const useGetStudentPersonalNotes = (thesisId, trajectoryId, userId, options = {}) => {
  return useQuery({
    queryKey: ["thesis-student-personal-notes", thesisId, trajectoryId, userId],
    queryFn: () => getStudentPersonalNotes(thesisId, trajectoryId, userId),
    enabled: !!(thesisId && trajectoryId && userId),
    ...options,
  });
};

export const useCreateStudentPersonalNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      thesisId,
      trajectoryId,
      userId,
      note,
      step = null,
      attachments = [],
    }) =>
      createStudentPersonalNote(thesisId, trajectoryId, userId, {
        note,
        step,
        attachments,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "thesis-trajectory-student-detail",
          variables.thesisId,
          variables.trajectoryId,
          variables.userId,
        ],
      });
      toast.success("Note added successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to add note");
    },
  });
};

export const useGetAdminStudentTheses = (
  userId,
  params = {},
  options = {}
) => {
  return useQuery({
    queryKey: ["admin-student-theses", userId, params],
    queryFn: () => getAdminStudentTheses(userId, params),
    enabled: !!userId,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetTrajectoryQnaAnnouncements = (
  thesisId,
  trajectoryId,
  params = {},
  options = {}
) => {
  return useQuery({
    queryKey: [
      "thesis-trajectory-qna-announcements",
      thesisId,
      trajectoryId,
      params,
    ],
    queryFn: () =>
      getTrajectoryQnaAnnouncements(thesisId, trajectoryId, params),
    enabled: !!(thesisId && trajectoryId),
    ...options,
  });
};

export const useGetTrajectoryQnaAnnouncementById = (
  thesisId,
  trajectoryId,
  itemId,
  options = {}
) => {
  return useQuery({
    queryKey: [
      "thesis-trajectory-qna-announcement-detail",
      thesisId,
      trajectoryId,
      itemId,
    ],
    queryFn: () =>
      getTrajectoryQnaAnnouncementById(thesisId, trajectoryId, itemId),
    enabled: !!(thesisId && trajectoryId && itemId),
    ...options,
  });
};

export const useCreateTrajectoryQnaAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ thesisId, trajectoryId, data }) =>
      createTrajectoryQnaAnnouncement(thesisId, trajectoryId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "thesis-trajectory-qna-announcements",
          variables.thesisId,
          variables.trajectoryId,
        ],
      });
      toast.success("Created successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create Q&A / Announcement");
    },
  });
};

export const useUpdateTrajectoryQnaAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ thesisId, trajectoryId, itemId, data }) =>
      updateTrajectoryQnaAnnouncement(thesisId, trajectoryId, itemId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "thesis-trajectory-qna-announcements",
          variables.thesisId,
          variables.trajectoryId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "thesis-trajectory-qna-announcement-detail",
          variables.thesisId,
          variables.trajectoryId,
          variables.itemId,
        ],
      });
      toast.success("Updated successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update Q&A / Announcement");
    },
  });
};

export const useDeleteTrajectoryQnaAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ thesisId, trajectoryId, itemId }) =>
      deleteTrajectoryQnaAnnouncement(thesisId, trajectoryId, itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "thesis-trajectory-qna-announcements",
          variables.thesisId,
          variables.trajectoryId,
        ],
      });
      toast.success("Deleted successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete Q&A / Announcement");
    },
  });
};




