import {
  createThesis,
  getThesisById,
  getTheses,
  updateThesis,
  updateThesisStatus,
  getThesisRoles,
  createThesisRole,
  getThesisTeachers,
  assignThesisTeacher,
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
  getTrajectoryStudentDetail,
  updateTrajectoryStudentReader,
  updateTrajectoryStudentSupervisor,
  updateTrajectoryStudentAttemptStatus,
  updateTrajectoryStudentStepDeadline,
  uploadStaffThesisDocument,
  renameStaffThesisDocument,
  deleteStaffThesisDocument,
} from "@/api/thesisApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  return useQuery({
    queryKey: ["thesis", id],
    queryFn: () => getThesisById(id),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    enabled: !!id,
    ...options,
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

export const useGetThesisRoles = (options = {}) => {
  return useQuery({
    queryKey: ["thesis-roles"],
    queryFn: () => getThesisRoles(),
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
    mutationFn: ({ thesisId, teacherId }) =>
      assignThesisTeacher(thesisId, { teacher: teacherId }),
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



