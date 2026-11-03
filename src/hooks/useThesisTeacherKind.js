import { useRouterState } from "@tanstack/react-router";

/**
 * Resolves DO vs Master thesis teacher context from the current path.
 */
export function useThesisTeacherKind() {
  const pathname = useRouterState({
    select: (s) => s.location.pathname || "",
  });

  const isMaster =
    typeof pathname === "string" && pathname.startsWith("/teacher/master-thesis");

  if (isMaster) {
    return {
      type: "master",
      basePath: "/teacher/master-thesis",
      label: "Master Thesis",
      isMaster: true,
      isDo: false,
    };
  }

  return {
    type: "do",
    basePath: "/teacher/thesis",
    label: "DO Thesis",
    isMaster: false,
    isDo: true,
  };
}

export default useThesisTeacherKind;
