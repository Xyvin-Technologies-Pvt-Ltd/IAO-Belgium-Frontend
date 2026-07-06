const statusVariants = {
  // General statuses
  active: "text-green-600",
  success: "text-green-600",
  inactive: "text-red-500",
  pending_verification: "text-amber-600",
  waitlisted: "text-blue-600",
  pending: "text-amber-600",
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
  archived: "text-gray-500",
  sended: "text-green-600",
  scheduled: "text-blue-600",
  sent: "text-green-600",
  closed: "text-red-500",
  open: "text-green-600",
  re_enrolled: "text-blue-600",

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
  manual_override: "text-purple-600",
  year_marked_failed: "text-red-600",
  year_re_enrolled: "text-blue-600",
  course_completed: "text-green-600",

  // Submission statuses
  submitted: "text-blue-600",
  passed: "text-green-600",
  pass: "text-green-600",
  fail: "text-red-600",
  failed: "text-red-600",
  started: "text-indigo-600",
  not_started: "text-gray-500",
  ended: "text-green-600",

  // Payment statuses
  paid: "text-green-600",
  overdue: "text-red-600",

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
  completed: "text-green-600",
  cancelled: "text-red-600",

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
  let displayText;
  if (status === "pending_verification") {
    displayText = "Pending";
  } else if (status === "on_ride") {
    displayText = "On Ride";
  } else if (status === "waitlisted") {
    displayText = "In Progress";
  } else if (typeof status === "boolean") {
    displayText = status ? "Active" : "Inactive";
  } else if (status === "not_started") {
    displayText = "Not Started";
  } else if (status === "archived") {
    displayText = "Archived";
  } else if (status === "validation_check") {
    displayText = "Validation Check";
  } else if (status === "validation_failed") {
    displayText = "Validation Failed";
  } else if (status === "year_promoted") {
    displayText = "Promoted";
  } else if (status === "manual_override") {
    displayText = "Manual Override";
  } else if (status === "year_marked_failed") {
    displayText = "Failed";
  } else if (status === "year_re_enrolled") {
    displayText = "Re-enrolled";
  } else if (status === "course_completed") {
    displayText = "Course Completed";
  } else if (status === "re_enrolled") {
    displayText = "Re-enrolled";
  } else if (status === "in-progress") {
    displayText = "In Progress";
  } else if (status === "not submitted") {
    displayText = "Not Submitted";
  } else if (status === "overdue") {
    displayText = "Overdue";
  } else {
    displayText = status;
  }

  const colorClass = statusVariants[status] || "text-gray-800";

  return (
    <span className={`font-medium capitalize ${colorClass}`}>
      {displayText}
    </span>
  );
};

export default StatusBadge;
