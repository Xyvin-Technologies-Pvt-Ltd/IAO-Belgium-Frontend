// Portal resolution for domain separation.
//
// One codebase, one build, served on two hostnames:
//   admin.osteopathie.eu   -> admin portal only
//   teacher.osteopathie.eu -> teacher portal only
//
// The portal is resolved at runtime from the hostname so the SAME build can be
// served on both domains. A build-time override (VITE_PORTAL) is supported for
// local dev and for setups that prefer two separate artifacts.
//
// IMPORTANT: this is UX/branding only. It hides the wrong portal and rejects the
// wrong role at login, but it is NOT a security boundary — the backend enforces
// access via role-based middleware. See docs/FRONTEND_DOMAIN_SEPARATION.md.

const ENV_PORTAL = import.meta.env.VITE_PORTAL; // "admin" | "teacher" | undefined

function resolvePortal() {
  if (ENV_PORTAL === "admin" || ENV_PORTAL === "teacher") return ENV_PORTAL;

  const host = (typeof window !== "undefined" && window.location.hostname) || "";
  if (host.startsWith("admin.")) return "admin";
  if (host.startsWith("teacher.")) return "teacher";

  // Local dev / legacy single-domain deployment: expose both portals (current behaviour).
  return "both";
}

export const PORTAL = resolvePortal();

export const IS_ADMIN_PORTAL = PORTAL === "admin";
export const IS_TEACHER_PORTAL = PORTAL === "teacher";
export const IS_COMBINED_PORTAL = PORTAL === "both";

// Whether a logged-in user's role is allowed on this portal.
export function isRoleAllowedOnPortal(role) {
  if (PORTAL === "both") return role === "admin" || role === "teacher";
  return role === PORTAL;
}

// Where to send a user with a wrong-for-this-portal role.
export const OTHER_PORTAL_HINT = {
  admin: "Admins, please use the admin portal.",
  teacher: "Teachers, please use the teacher portal.",
};
