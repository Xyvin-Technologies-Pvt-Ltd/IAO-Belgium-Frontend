import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatTZ } from "@/utils/dateUtils";
import moment from "moment";
import {
  useEvaluateSubmission,
  useGetSubmissionById,
} from "@/store/useSubmission";
import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useParams, useNavigate } from "@tanstack/react-router";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import StatusBadge from "@/components/StatusBadge";
import image from "../../../assets/images/no-academic.png";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

const evaluationSchema = z.object({
  score: z.coerce
    .number()
    .min(0, "Score must be at least 0")
    .max(100, "Score cannot exceed 100"),
  feedback: z.string().optional(),
});

const ViewSubmission = () => {
  const { id } = useParams({ strict: false });
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data, isLoading, error } = useGetSubmissionById(id);
  const submissionData = data?.data;

  const { mutate: evaluate, isPending } = useEvaluateSubmission();

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    renderToolbar: (Toolbar) => (
      <Toolbar>
        {(slots) => {
          const {
            CurrentPageInput,
            Download,
            GoToNextPage,
            GoToPreviousPage,
            NumberOfPages,
            Print,
            ShowSearchPopover,
            Zoom,
            ZoomIn,
            ZoomOut,
          } = slots;
          return (
            <div
              style={{
                alignItems: "center",
                display: "flex",
                width: "100%",
                padding: "4px",
              }}
            >
              <div style={{ padding: "0px 2px" }}>
                <ShowSearchPopover />
              </div>
              <div style={{ padding: "0px 2px" }}>
                <ZoomOut />
              </div>
              <div style={{ padding: "0px 2px" }}>
                <Zoom />
              </div>
              <div style={{ padding: "0px 2px" }}>
                <ZoomIn />
              </div>
              <div style={{ padding: "0px 2px", marginLeft: "auto" }}>
                <GoToPreviousPage />
              </div>
              <div className="flex items-center gap-2">
                <div style={{ width: "4rem" }}>
                  <CurrentPageInput />
                </div>
                <div className="text-gray-600 text-sm">
                  / <NumberOfPages />
                </div>
              </div>
              <div style={{ padding: "0px 2px" }}>
                <GoToNextPage />
              </div>
              <div style={{ padding: "0px 2px", marginLeft: "auto" }}>
                <Download />
              </div>
              <div style={{ padding: "0px 2px" }}>
                <Print />
              </div>
            </div>
          );
        }}
      </Toolbar>
    ),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      score: "",
      feedback: "",
    },
  });

  useEffect(() => {
    if (submissionData) {
      reset({
        score: submissionData.score || "",
        feedback: submissionData.feedback || "",
      });
    }
  }, [submissionData, reset]);

  const { updateBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    updateBreadcrumbs([
      { label: t("evaluation", "Evaluations"), path: "/teacher/evaluations" },
      { label: t("viewSubmission", "View Submission") },
    ]);
    return () => {
      updateBreadcrumbs([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (formData) => {
    evaluate({
      id: submissionData._id,
      data: {
        score: formData.score,
        feedback: formData.feedback,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center bg-white">
        <LoadingSpinner size="lg" text="Loading submission details..." />
      </div>
    );
  }

  if (error || !submissionData) {
    const isReassigned =
      error?.message === "Submission has been reassigned to another teacher.";

    if (isReassigned) {
      return (
        <div className="h-[calc(100vh-80px)] p-6 bg-[#F9F9F9] dark:bg-[#0B0F19]">
          <div className="flex flex-col items-center justify-center h-full text-center bg-sidebar rounded-xl p-5 border border-sidebar-border">
            <img
              src={image}
              alt="Reassigned"
              className="w-64 mb-4 opacity-80"
            />
            <h3 className="text-lg font-semibold text-sidebar-foreground">
              Submission Reassigned
            </h3>
            <p className="text-sm text-sidebar-foreground/70 max-w-md mt-1 mb-4">
              The submission previously assigned to you has been reassigned to a
              new teacher. You don't have to evaluate it.
            </p>
            <Button
              className="mt-4"
              onClick={() => navigate({ to: "/teacher/evaluations" })}
            >
              Return to Evaluations
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center bg-white dark:bg-sidebar">
        <ErrorMessage
          message={error?.message || "Failed to load submission data"}
          showRetry={false}
          variant="card"
        />
      </div>
    );
  }

  const studentName = submissionData?.student
    ? `${submissionData.student.last_name || ""} ${submissionData.student.first_name || ""}`
    : submissionData?.application?.user
      ? `${submissionData.application.user.last_name || ""} ${submissionData.application.user.first_name || ""}`
      : "N/A";

  const isEvolvable = submissionData?.status === "submitted";
  const documentFile = submissionData?.documents?.[0];
  const pdfUrl = documentFile?.url ? encodeURI(documentFile.url) : null;

  return (
    <div className="p-6 h-[calc(100vh-80px)] bg-white dark:bg-sidebar overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
        {/* LEFT SIDE PDF VIEWER */}
        <div className="col-span-1 lg:col-span-7 bg-[#F9F9F9] dark:bg-sidebar border-none shadow-sm flex flex-col h-full overflow-hidden">
          {documentFile ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b dark:border-white/10">
                <button
                  onClick={() => navigate({ to: "/teacher/evaluations" })}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>

                <span className="font-semibold text-gray-800 dark:text-gray-100 text-lg">
                  {documentFile.url.split("/").pop() || "Document.pdf"}
                </span>
              </div>

              {/* PDF Viewer */}
              <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900">
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                  <Viewer
                    fileUrl={pdfUrl}
                    plugins={[defaultLayoutPluginInstance]}
                  />
                </Worker>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              No Document Attached
            </div>
          )}
        </div>

        {/* RIGHT SIDE EVALUATION */}
        <div className="col-span-1 lg:col-span-5 bg-white dark:bg-sidebar flex flex-col h-full overflow-y-auto">
          {/* Student Info */}
          <div className="bg-[#F9F9F9] dark:bg-gray-800/50 p-5 mb-8">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl font-bold text-[#374151] dark:text-white capitalize">
                {studentName}
              </h1>
              <StatusBadge status={submissionData?.status || "pending"} />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-600 dark:text-gray-300 text-[15px]">
              <div className="flex items-center gap-2">
                <span>{submissionData?.program?.name || "MSc osteopathy"}</span>
                <span className="px-3 py-1 bg-gray-200/80 dark:bg-gray-700 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-200 shrink-0">
                  IN-101
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>
                  {submissionData?.batch?.name || "MSc 2025 Intake A"}
                </span>
                <span className="px-3 py-1 bg-gray-200/80 dark:bg-gray-700 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-200 shrink-0">
                  IN-101
                </span>
              </div>
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-6 text-[#334155] dark:text-gray-100 shrink-0">
            Evaluations
          </h3>

          {isEvolvable ? (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex-1 flex flex-col space-y-6"
            >
              <div>
                <label className="text-sm font-semibold mb-2 block text-gray-900 dark:text-gray-200">
                  Score (0-100)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Enter score (0-100)"
                  {...register("score")}
                />
                {errors.score && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.score.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block text-gray-900 dark:text-gray-200">
                  Feedback
                </label>
                <Textarea
                  placeholder="Enter any remarks to add before forwarding"
                  {...register("feedback")}
                  className="h-32 resize-none dark:bg-gray-800 dark:border-gray-700"
                />
                {errors.feedback && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.feedback.message}
                  </p>
                )}
              </div>

              <div className="mt-auto pt-6 flex flex-col justify-end">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-12 bg-[#ff8904] hover:bg-[#e07803] text-white"
                >
                  {isPending ? "Submitting..." : "Complete Evaluation"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <strong className="text-gray-900 dark:text-white">
                  Score:
                </strong>{" "}
                {submissionData?.score}
              </div>
              <div>
                <strong className="text-gray-900 dark:text-white">
                  Feedback:
                </strong>{" "}
                {submissionData?.feedback}
              </div>
              {submissionData?.reviewed_at && (
                <div className="text-xs text-gray-400 mt-4">
                  Evaluated on{" "}
                  {moment(submissionData.reviewed_at).format(
                    "MMM Do YYYY, h:mm a",
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewSubmission;
