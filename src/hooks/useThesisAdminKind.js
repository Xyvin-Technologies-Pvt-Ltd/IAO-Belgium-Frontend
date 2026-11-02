import { useRouterState } from "@tanstack/react-router";

/**
 * Resolves DO vs Master thesis admin context from the current path.
 */
export function useThesisAdminKind() {
  const pathname = useRouterState({
    select: (s) => s.location.pathname || "",
  });

  const isMaster =
    typeof pathname === "string" && pathname.startsWith("/admin/master-thesis");

  if (isMaster) {
    return {
      type: "master",
      basePath: "/admin/master-thesis",
      label: "Master Thesis",
      permissionPath: "/admin/master-thesis",
      isMaster: true,
      isDo: false,
    };
  }

  return {
    type: "do",
    basePath: "/admin/thesis",
    label: "DO Thesis",
    permissionPath: "/admin/thesis",
    isMaster: false,
    isDo: true,
  };
}

export default useThesisAdminKind;
