import { useTranslation } from "react-i18next";

const statusVariants = {
  // General statuses
  active: "text-green-600",
  success: "text-green-600",
  inactive: "text-red-500",
  pending_verification: "text-amber-600",
  waitlisted: "text-blue-600",
  pending: "text-amber-600 dark:text-amber-400",
  approved: "text-green-600",
  suspended: "text-gray-500",
  rejected: "text-red-600",
  resubmitted: "text-blue-600",
  deleted: "text-red-500",
  available: "text-green-600",
  on_ride: "text-blue-600",
  offline: "text-red-500",
  drafted: "text-amber-600",
  draft: "text-amber-600",
  published: "text-green-600",
  unpublished: "text-amber-600",
  archived: "text-gray-500",
  sended: "text-green-600",
  scheduled: "text-blue-600",
  sent: "text-green-600",
  closed: "text-red-500",
  open: "text-green-600",
  re_enrolled: "text-blue-600",
  paused: "text-amber-600",
  stopped: "text-red-600",
  removed: "text-gray-500",

  // Bloom levels (Difficulty)
  remember: "text-green-600",
  understand: "text-amber-600",
  apply: "text-red-500",
  analyze: "text-blue-600",
  evaluate: "text-purple-600",
  create: "text-indigo-600",

  // Year Completion logs
  validation_check: "text-blue-600",
  validation_failed: "text-red-600",
  year_promoted: "text-green-600",
  year_demoted: "text-amber-600",
  manual_override: "text-purple-600",
  year_marked_failed: "text-red-600",
  year_re_enrolled: "text-blue-600",
  course_completed: "text-green-600",
  planning_ended: "text-amber-600",
  student_request: "text-blue-600",
  leftover: "text-amber-600",
  completed_reattempt: "text-indigo-600",
  assigned: "text-green-600",

  // Submission statuses
  submitted: "text-blue-600",
  passed: "text-green-600",
  pass: "text-green-600",
  fail: "text-red-600",
  failed: "text-red-600 dark:text-red-400",
  started: "text-indigo-600",
  ended: "text-green-600",

  // Payment statuses
  paid: "text-green-600 dark:text-green-400",
  unpaid: "text-red-600 dark:text-red-400",
  marked_paid: "text-teal-600 dark:text-teal-400",
  free: "text-blue-600 dark:text-blue-400",
  paid_kmo: "text-green-600 dark:text-green-400",
  waiting_kmo: "text-amber-600 dark:text-amber-400",
  submitted_kmo: "text-blue-600 dark:text-blue-400",
  contribution_received_kmo: "text-indigo-600 dark:text-indigo-400",
  payment_released_kmo: "text-purple-600 dark:text-purple-400",
  waiting_third_party: "text-amber-600 dark:text-amber-400",
  not_completed: "text-gray-500 dark:text-gray-400",
  completed: "text-green-600 dark:text-green-400",
  not_available: "text-gray-500 dark:text-gray-400",
  not_started: "text-amber-600 dark:text-amber-400",
  deadline_passed: "text-red-600 dark:text-red-400",
  cooldown: "text-amber-600 dark:text-amber-400",
  overdue: "text-red-600 dark:text-red-400",
  credited: "text-amber-700 dark:text-amber-300",
  refunded: "text-red-700 dark:text-red-300",
  issued: "text-blue-600 dark:text-blue-400",
  canceled: "text-red-600 dark:text-red-400",
  cancelled: "text-red-600 dark:text-red-400",
  used_via_kmo: "text-green-600 dark:text-green-400",
  "used via kmo": "text-green-600 dark:text-green-400",
  used_via_location_switch: "text-green-600 dark:text-green-400",
  "used via location switch": "text-green-600 dark:text-green-400",

  // Module availability
  locked: "text-gray-500",
  "in-progress": "text-blue-600",
  ongoing: "text-amber-600",
  "not submitted": "text-red-600",

  // Ride statuses
  requested: "text-amber-600",
  accepted: "text-blue-600",
  arrived: "text-purple-600",
  in_progress: "text-indigo-600",

  // Boolean
  true: "text-green-600",
  false: "text-red-600",

  // HTTP Methods
  GET: "text-blue-600",
  POST: "text-green-600",
  PUT: "text-amber-600",
  PATCH: "text-indigo-600",
  DELETE: "text-red-600",

  // Status Codes
  200: "text-green-600",
  201: "text-green-600",
  204: "text-green-600",
  301: "text-amber-600",
  302: "text-amber-600",
  304: "text-amber-600",
  400: "text-red-600",
  401: "text-red-600",
  403: "text-red-600",
  404: "text-red-600",
  409: "text-red-600",
  500: "text-purple-600",
  502: "text-purple-600",
  503: "text-purple-600",
};

const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  let displayText;
  let variantKey = status;

  if (status === "pending_verification") {
    displayText = t("common.status.pending", "Pending");
  } else if (status === "on_ride") {
    displayText = t("common.status.onRide", "On Ride");
  } else if (status === "waitlisted") {
    displayText = t("common.status.inProgress", "In Progress");
  } else if (typeof status === "boolean") {
    displayText = status
      ? t("common.active", "Active")
      : t("common.inactive", "Inactive");
    variantKey = status ? "active" : "inactive";
  } else if (status === "not_started") {
    displayText = t("common.status.notStarted", "Not Started");
  } else if (status === "archived") {
    displayText = t("common.status.archived", "Archived");
  } else if (status === "validation_check") {
    displayText = t("common.status.validationCheck", "Validation Check");
  } else if (status === "validation_failed") {
    displayText = t("common.status.validationFailed", "Validation Failed");
  } else if (status === "year_promoted") {
    displayText = t("common.status.promoted", "Promoted");
  } else if (status === "manual_override") {
    displayText = t("common.status.manualOverride", "Manual Override");
  } else if (status === "year_marked_failed") {
    displayText = t("common.status.failed", "Failed");
  } else if (status === "year_re_enrolled" || status === "re_enrolled") {
    displayText = t("common.status.reenrolled", "Re-enrolled");
  } else if (status === "course_completed") {
    displayText = t("common.status.courseCompleted", "Course Completed");
  } else if (status === "paused") {
    displayText = t("common.status.paused", "Paused");
  } else if (status === "stopped") {
    displayText = t("common.status.stopped", "Stopped");
  } else if (status === "removed") {
    displayText = t("common.status.removed", "Removed");
  } else if (status === "in-progress") {
    displayText = t("common.status.inProgress", "In Progress");
  } else if (status === "not submitted") {
    displayText = t("common.status.notSubmitted", "Not Submitted");
  } else if (status === "overdue") {
    displayText = t("common.status.overdue", "Overdue");
  } else if (status === "free") {
    displayText = t("common.status.free", "Free");
  } else if (status === "unpaid") {
    displayText = t("common.status.unpaid", "Unpaid");
  } else if (status === "marked_paid") {
    displayText = t("common.status.markedPaid", "Marked paid");
  } else if (status === "paid_kmo") {
    displayText = t("common.status.paidKmo", "Paid (KMO)");
  } else if (status === "waiting_kmo") {
    displayText = t("common.status.waitingKmo", "Waiting (KMO)");
  } else if (status === "submitted_kmo") {
    displayText = t("common.status.submittedKmo", "Submitted (KMO)");
  } else if (status === "contribution_received_kmo") {
    displayText = t(
      "common.status.contributionReceivedKmo",
      "Contribution received (KMO)"
    );
  } else if (status === "payment_released_kmo") {
    displayText = t(
      "common.status.paymentReleasedKmo",
      "Payment released (KMO)"
    );
  } else if (status === "waiting_third_party") {
    displayText = t(
      "common.status.waitingThirdParty",
      "Waiting (third party)"
    );
  } else if (status === "not_completed") {
    displayText = t("common.status.notCompleted", "Not completed");
  } else if (status === "completed") {
    displayText = t("common.status.completed", "Completed");
  } else if (status === "not_available") {
    displayText = t("common.status.notAvailable", "Not available");
  } else if (status === "deadline_passed") {
    displayText = t("common.status.deadlinePassed", "Deadline passed");
  } else if (status === "cooldown") {
    displayText = t("common.status.cooldown", "Cooldown");
  } else if (status === "used_via_kmo") {
    displayText = t("common.status.usedViaKmo", "Used via KMO");
  } else if (status === "used_via_location_switch") {
    displayText = t(
      "common.status.usedViaLocationSwitch",
      "Used via location switch"
    );
  } else if (status === "pending") {
    displayText = t("common.status.pending", "Pending");
  } else if (status === "approved") {
    displayText = t("common.status.approved", "Approved");
  } else if (status === "rejected") {
    displayText = t("common.status.rejected", "Rejected");
  } else {
    displayText = status;
  }

  const colorClass =
    statusVariants[variantKey] || "text-gray-800 dark:text-gray-200";

  return (
    <span className={`font-medium capitalize ${colorClass}`}>
      {displayText}
    </span>
  );
};

export default StatusBadge;
